/**
 * 权限中间件
 * 检查用户是否拥有指定权限
 */

import type { Context, Next } from "hono";
import type { Env, Variables, AuthUser } from "../index.d";

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

		// 查询用户权限
		const result = await c.env.DB.prepare(`
			SELECT DISTINCT m.permission
			FROM sys_menu m
			INNER JOIN sys_role_menu rm ON m.id = rm.menu_id
			INNER JOIN sys_user_role ur ON rm.role_id = ur.role_id
			WHERE ur.user_id = ? AND m.permission = ?
		`).bind(currentUser.userId, permission).first();

		if (!result) {
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

		// 检查是否有任一权限
		const placeholders = permissions.map(() => "?").join(",");
		const result = await c.env.DB.prepare(`
			SELECT DISTINCT m.permission
			FROM sys_menu m
			INNER JOIN sys_role_menu rm ON m.id = rm.menu_id
			INNER JOIN sys_user_role ur ON rm.role_id = ur.role_id
			WHERE ur.user_id = ? AND m.permission IN (${placeholders})
		`).bind(currentUser.userId, ...permissions).first();

		if (!result) {
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

		// 检查用户是否有该角色
		const result = await c.env.DB.prepare(`
			SELECT r.*
			FROM sys_role r
			INNER JOIN sys_user_role ur ON r.id = ur.role_id
			WHERE ur.user_id = ? AND r.role_key = ? AND r.status = 1
		`).bind(currentUser.userId, roleKey).first();

		if (!result) {
			return c.json({ error: "无权限访问" }, 403);
		}

		await next();
	};
};
