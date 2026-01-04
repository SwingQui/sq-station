/**
 * 认证中间件
 * 验证 JWT token 并将用户信息附加到上下文
 */

import type { Context, Next } from "hono";
import type { Env, Variables, AuthUser } from "../index.d";
import { verifyToken } from "../utils/jwt";
import { unauthorized } from "../utils/response";

/**
 * 从数据库加载用户权限
 */
async function loadUserPermissions(db: D1Database, userId: number): Promise<string[]> {
	try {
		// 获取用户的角色列表
		const userResult = await db.prepare("SELECT roles FROM sys_user WHERE id = ?").bind(userId).first<{ roles: string }>();

		if (!userResult || !userResult.roles) {
			console.log(`[Auth] No roles found for user ${userId}`);
			return [];
		}

		// 解析用户的角色数组
		let userRoles: string[];
		try {
			userRoles = JSON.parse(userResult.roles) as string[];
		} catch (e) {
			console.error(`[Auth] Failed to parse user roles:`, userResult.roles, e);
			return [];
		}

		if (userRoles.length === 0) {
			console.log(`[Auth] User ${userId} has no roles`);
			return [];
		}

		console.log(`[Auth] User ${userId} roles:`, userRoles);

		// 根据角色查询权限
		const placeholders = userRoles.map(() => "?").join(",");
		const sql = `
			SELECT DISTINCT permissions
			FROM sys_role
			WHERE role_key IN (${placeholders}) AND status = 1
		`;

		const results = await db.prepare(sql).bind(...userRoles).all<{ permissions: string }>();

		// 合并所有角色的权限
		const allPermissions = new Set<string>();
		for (const row of results.results || []) {
			try {
				const perms = JSON.parse(row.permissions || "[]") as string[];
				for (const perm of perms) {
					allPermissions.add(perm);
				}
			} catch (e) {
				console.error("[Auth] Failed to parse permissions:", row.permissions, e);
			}
		}

		const permissionsArray = Array.from(allPermissions);
		console.log(`[Auth] User ${userId} permissions:`, permissionsArray);
		return permissionsArray;
	} catch (e) {
		console.error("[Auth] Error loading user permissions:", e);
		return []; // 返回空数组而不是抛出错误
	}
}

/**
 * 认证中间件
 * 验证请求头中的 JWT token
 */
export const authMiddleware = async (c: Context<{ Bindings: Env; Variables: Variables }>, next: Next) => {
	// 公开路径白名单（不需要认证的路径）
	const publicPaths = [
		"/api/auth/login",
		"/api/auth/logout",
	];

	// 如果是公开路径，直接跳过认证
	if (publicPaths.includes(c.req.path)) {
		console.log(`[AuthMiddleware] Public path detected, skipping auth: ${c.req.path}`);
		return next();
	}

	console.log(`[AuthMiddleware] Protected path, checking auth: ${c.req.path}`);
	const authHeader = c.req.header("Authorization");

	console.log(`[AuthMiddleware] Authorization header:`, authHeader ? authHeader.substring(0, 20) + "..." : "missing");

	// 没有 Authorization header
	if (!authHeader || !authHeader.startsWith("Bearer ")) {
		console.log("[AuthMiddleware] No valid Authorization header found");
		return c.json(unauthorized("未登录"), 401);
	}

	const token = authHeader.substring(7);

	console.log(`[AuthMiddleware] Token extracted, length: ${token.length}`);

	// 验证 token
	const payload = await verifyToken(token, c.env.JWT_SECRET || "default-secret-key");

	if (!payload) {
		console.log("[AuthMiddleware] Token verification failed");
		return c.json(unauthorized("Token 无效或已过期"), 401);
	}

	console.log(`[AuthMiddleware] Token verified for user: ${payload.username} (ID: ${payload.userId})`);

	// 加载用户权限
	const permissions = await loadUserPermissions(c.env.DB, payload.userId);

	// 将用户信息附加到上下文
	c.set("currentUser", {
		userId: payload.userId,
		username: payload.username,
		permissions: permissions,
	} as AuthUser);

	console.log(`[AuthMiddleware] User context set, proceeding to next handler`);
	await next();
};

/**
 * 可选认证中间件
 * 如果有 token 则验证，没有则跳过
 */
export const optionalAuthMiddleware = async (c: Context<{ Bindings: Env; Variables: Variables }>, next: Next) => {
	const authHeader = c.req.header("Authorization");

	if (authHeader && authHeader.startsWith("Bearer ")) {
		const token = authHeader.substring(7);
		const payload = await verifyToken(token, c.env.JWT_SECRET || "default-secret-key");

		if (payload) {
			// 加载用户权限
			const permissions = await loadUserPermissions(c.env.DB, payload.userId);

			c.set("currentUser", {
				userId: payload.userId,
				username: payload.username,
				permissions: permissions,
			} as AuthUser);
		}
	}

	await next();
};
