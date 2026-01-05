/**
 * 权限缓存服务
 * 使用 KV 存储角色权限，避免每次请求都查询数据库
 *
 * 缓存策略：
 * - 角色权限缓存：role:permissions:{roleKey}
 * - 缓存过期时间：1小时（3600秒）
 * - 权限变更时主动失效缓存
 */

import type { KVNamespace } from "../index.d";

/**
 * 权限缓存服务类
 */
export class PermissionCacheService {
	private readonly CACHE_TTL = 3600; // 1小时
	private readonly ROLE_PREFIX = "role:permissions:";
	private readonly USER_PREFIX = "user:roles:";

	constructor(private kv: KVNamespace) {}

	/**
	 * 获取角色权限（从缓存或数据库）
	 * @param roleKey 角色标识
	 * @param db 数据库实例
	 * @returns 权限数组
	 */
	async getRolePermissions(roleKey: string, db: D1Database): Promise<string[]> {
		const cacheKey = `${this.ROLE_PREFIX}${roleKey}`;

		try {
			// 1. 尝试从缓存获取
			const cached = await this.kv.get(cacheKey, 'json');
			if (cached && Array.isArray(cached)) {
				console.log(`[PermissionCache] Cache hit for role: ${roleKey}`);
				return cached as string[];
			}

			// 2. 从数据库查询
			const result = await db.prepare(
				"SELECT permissions FROM sys_role WHERE role_key = ? AND status = 1"
			).bind(roleKey).first<{ permissions: string }>();

			let permissions: string[] = [];
			if (result?.permissions) {
				try {
					permissions = JSON.parse(result.permissions);
				} catch (e) {
					console.error(`[PermissionCache] Failed to parse permissions for role ${roleKey}:`, e);
					permissions = [];
				}
			}

			// 3. 写入缓存
			await this.kv.put(cacheKey, JSON.stringify(permissions), {
				expirationTtl: this.CACHE_TTL
			});

			console.log(`[PermissionCache] Cached permissions for role: ${roleKey}, count: ${permissions.length}`);
			return permissions;
		} catch (e) {
			console.error(`[PermissionCache] Error getting role permissions: ${roleKey}`, e);
			return [];
		}
	}

	/**
	 * 获取用户所有角色（从缓存或数据库）
	 * @param userId 用户ID
	 * @param db 数据库实例
	 * @returns 角色数组
	 */
	async getUserRoles(userId: number, db: D1Database): Promise<string[]> {
		const cacheKey = `${this.USER_PREFIX}${userId}`;

		try {
			// 1. 尝试从缓存获取
			const cached = await this.kv.get(cacheKey, 'json');
			if (cached && Array.isArray(cached)) {
				console.log(`[PermissionCache] Cache hit for user roles: ${userId}`);
				return cached as string[];
			}

			// 2. 从数据库查询
			const result = await db.prepare(
				"SELECT roles FROM sys_user WHERE id = ?"
			).bind(userId).first<{ roles: string }>();

			let roles: string[] = [];
			if (result?.roles) {
				try {
					roles = JSON.parse(result.roles);
				} catch (e) {
					console.error(`[PermissionCache] Failed to parse roles for user ${userId}:`, e);
					roles = [];
				}
			}

			// 3. 写入缓存
			await this.kv.put(cacheKey, JSON.stringify(roles), {
				expirationTtl: this.CACHE_TTL
			});

			return roles;
		} catch (e) {
			console.error(`[PermissionCache] Error getting user roles: ${userId}`, e);
			return [];
		}
	}

	/**
	 * 获取用户所有权限（合并所有角色的权限）
	 * @param userId 用户ID
	 * @param db 数据库实例
	 * @returns 权限数组
	 */
	async getUserPermissions(userId: number, db: D1Database): Promise<string[]> {
		try {
			// 1. 获取用户的所有角色
			const roleKeys = await this.getUserRoles(userId, db);

			if (roleKeys.length === 0) {
				console.log(`[PermissionCache] User ${userId} has no roles`);
				return [];
			}

			console.log(`[PermissionCache] User ${userId} roles:`, roleKeys);

			// 2. 获取每个角色的权限并合并
			const allPermissions = new Set<string>();

			for (const roleKey of roleKeys) {
				const rolePerms = await this.getRolePermissions(roleKey, db);
				for (const perm of rolePerms) {
					allPermissions.add(perm);
				}
			}

			const permissionsArray = Array.from(allPermissions);
			console.log(`[PermissionCache] User ${userId} permissions:`, permissionsArray);
			return permissionsArray;
		} catch (e) {
			console.error(`[PermissionCache] Error getting user permissions: ${userId}`, e);
			return [];
		}
	}

	/**
	 * 清除角色权限缓存（权限变更时调用）
	 * @param roleKey 角色标识
	 */
	async invalidateRole(roleKey: string): Promise<void> {
		const cacheKey = `${this.ROLE_PREFIX}${roleKey}`;
		try {
			await this.kv.delete(cacheKey);
			console.log(`[PermissionCache] Invalidated cache for role: ${roleKey}`);
		} catch (e) {
			console.error(`[PermissionCache] Error invalidating role cache: ${roleKey}`, e);
		}
	}

	/**
	 * 清除用户角色缓存（用户角色变更时调用）
	 * @param userId 用户ID
	 */
	async invalidateUser(userId: number): Promise<void> {
		const cacheKey = `${this.USER_PREFIX}${userId}`;
		try {
			await this.kv.delete(cacheKey);
			console.log(`[PermissionCache] Invalidated cache for user: ${userId}`);
		} catch (e) {
			console.error(`[PermissionCache] Error invalidating user cache: ${userId}`, e);
		}
	}

	/**
	 * 清除所有权限缓存（谨慎使用）
	 * 注意：KV 不支持列出所有 keys，此功能需要维护一个 key 列表
	 */
	async invalidateAll(): Promise<void> {
		// KV 不支持列出所有 keys，需要通过前缀删除
		// 这需要使用 KV 的 list API，但需要记录所有 key
		console.warn(`[PermissionCache] invalidateAll() called - manual cache clearing may be needed`);
		// 实际实现可以通过维护一个 key 列表来实现
	}

	/**
	 * 预热缓存（用于系统启动或权限变更后）
	 * @param db 数据库实例
	 */
	async warmup(db: D1Database): Promise<void> {
		try {
			console.log(`[PermissionCache] Starting cache warmup...`);

			// 获取所有启用的角色
			const roles = await db.prepare(
				"SELECT role_key FROM sys_role WHERE status = 1"
			).all<{ role_key: string }>();

			let count = 0;
			for (const role of roles.results || []) {
				await this.getRolePermissions(role.role_key, db);
				count++;
			}

			console.log(`[PermissionCache] Cache warmup completed, ${count} roles cached`);
		} catch (e) {
			console.error(`[PermissionCache] Error during cache warmup:`, e);
		}
	}
}
