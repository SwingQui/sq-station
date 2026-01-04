/**
 * 权限中间件
 * 检查用户是否拥有指定权限
 */

import type { Context, Next } from "hono";
import type { Env, Variables, AuthUser } from "../index.d";

/**
 * 检查用户是否为超级管理员（拥有 *:*:* 权限）
 */
function isSuperAdmin(permissions: string[]): boolean {
	return permissions.includes("*:*:*");
}

/**
 * 权限检查中间件工厂函数
 * @param permission 需要的权限标识
 */
export const requirePermission = (permission: string) => {
	return async (c: Context<{ Bindings: Env; Variables: Variables }>, next: Next) => {
		const currentUser = c.get("currentUser") as AuthUser | undefined;

		if (!currentUser) {
			return c.json({ error: "未登录" }, 401);
		}

		// 超级管理员绕过权限检查
		if (isSuperAdmin(currentUser.permissions || [])) {
			await next();
			return;
		}

		// 检查用户是否有该权限
		if (!currentUser.permissions?.includes(permission)) {
			return c.json({ error: "无权限访问" }, 403);
		}

		await next();
	};
};

/**
 * 多权限检查中间件（满足其一即可）
 * @param permissions 权限标识数组
 */
export const requireAnyPermission = (permissions: string[]) => {
	return async (c: Context<{ Bindings: Env; Variables: Variables }>, next: Next) => {
		const currentUser = c.get("currentUser") as AuthUser | undefined;

		if (!currentUser) {
			return c.json({ error: "未登录" }, 401);
		}

		// 超级管理员绕过权限检查
		if (isSuperAdmin(currentUser.permissions || [])) {
			await next();
			return;
		}

		// 检查是否有任一权限
		const hasPermission = permissions.some(p => currentUser.permissions?.includes(p));
		if (!hasPermission) {
			return c.json({ error: "无权限访问" }, 403);
		}

		await next();
	};
};

/**
 * 角色检查中间件
 * @param roleKey 角色标识（如 admin, user）
 */
export const requireRole = (roleKey: string) => {
	return async (c: Context<{ Bindings: Env; Variables: Variables }>, next: Next) => {
		const currentUser = c.get("currentUser") as AuthUser | undefined;

		if (!currentUser) {
			return c.json({ error: "未登录" }, 401);
		}

		// 超级管理员绕过角色检查
		if (isSuperAdmin(currentUser.permissions || [])) {
			await next();
			return;
		}

		// 检查用户是否有该角色
		const result = await c.env.DB.prepare(`
			SELECT roles FROM sys_user WHERE id = ?
		`).bind(currentUser.userId).first<{ roles: string }>();

		if (!result) {
			return c.json({ error: "无权限访问" }, 403);
		}

		// 解析用户的角色数组
		let userRoles: string[];
		try {
			userRoles = JSON.parse(result.roles || "[]") as string[];
		} catch (e) {
			return c.json({ error: "无权限访问" }, 403);
		}

		if (!userRoles.includes(roleKey)) {
			return c.json({ error: "无权限访问" }, 403);
		}

		await next();
	};
};
