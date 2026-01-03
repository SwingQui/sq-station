/**
 * 认证 API
 * 包含登录、登出、获取当前用户信息等接口
 */

import { Hono } from "hono";
import type { Env } from "../index.d";
import { signToken, verifyToken } from "../utils/jwt";
import { verifyPasswordWithUsername } from "../utils/password";
import { success, fail, badRequest, unauthorized, notFound } from "../utils/response";

const authApi = new Hono<{ Bindings: Env }>();

/**
 * 登录接口
 * POST /api/auth/login
 * Body: { username, password }
 */
authApi.post("/login", async (c) => {
	try {
		const { username, password } = await c.req.json();

		if (!username || !password) {
			return c.json(badRequest("用户名和密码不能为空"));
		}

		// 查询用户
		const userResult = await c.env.DB.prepare(
			"SELECT id, username, password, nickname, avatar, status FROM sys_user WHERE username = ?"
		).bind(username).first();

		if (!userResult) {
			return c.json(unauthorized("用户名或密码错误"));
		}

		// 检查用户状态
		if (userResult.status === 0) {
			return c.json(fail(403, "账户已被禁用"));
		}

		// 验证密码
		const isValid = await verifyPasswordWithUsername(
			password,
			username,
			userResult.password as string
		);

		if (!isValid) {
			return c.json(unauthorized("用户名或密码错误"));
		}

		// 生成 JWT token
		const token = await signToken(
			{
				userId: userResult.id as number,
				username: userResult.username as string,
			},
			c.env.JWT_SECRET || "default-secret-key"
		);

		// 返回用户信息和 token
		return c.json(success({
			token,
			user: {
				id: userResult.id,
				username: userResult.username,
				nickname: userResult.nickname,
				avatar: userResult.avatar,
			},
		}, "登录成功"));
	} catch (e: any) {
		return c.json(fail(500, e.message));
	}
});

/**
 * 登出接口
 * POST /api/auth/logout
 * JWT 是无状态的，客户端删除 token 即可
 */
authApi.post("/logout", (c) => {
	// JWT 无状态，服务端无需做任何操作
	// 客户端删除 localStorage 中的 token 即可
	return c.json(success(null, "登出成功"));
});

/**
 * 获取当前用户信息（包含权限和菜单）
 * GET /api/auth/me
 */
authApi.get("/me", async (c) => {
	try {
		// 从 Authorization header 获取 token
		const authHeader = c.req.header("Authorization");
		if (!authHeader || !authHeader.startsWith("Bearer ")) {
			return c.json(unauthorized("未登录"));
		}

		const token = authHeader.substring(7);

		// 验证 token
		const payload = await verifyToken(token, c.env.JWT_SECRET || "default-secret-key");
		if (!payload) {
			return c.json(unauthorized("Token 无效或已过期"));
		}

		// 查询用户信息
		const userResult = await c.env.DB.prepare(
			"SELECT id, username, nickname, avatar, email, phone FROM sys_user WHERE id = ? AND status = 1"
		).bind(payload.userId).first();

		if (!userResult) {
			return c.json(notFound("用户不存在"));
		}

		// 查询用户权限
		const permissionsResult = await c.env.DB.prepare(`
			SELECT DISTINCT m.permission
			FROM sys_menu m
			INNER JOIN sys_role_menu rm ON m.id = rm.menu_id
			INNER JOIN sys_user_role ur ON rm.role_id = ur.role_id
			WHERE ur.user_id = ? AND m.permission IS NOT NULL AND m.permission != ''
		`).bind(payload.userId).all();

		const permissions = permissionsResult.results.map((r: any) => r.permission);

		// 查询用户菜单（树形结构）
		const menusResult = await c.env.DB.prepare(`
			SELECT m.*
			FROM sys_menu m
			INNER JOIN sys_role_menu rm ON m.id = rm.menu_id
			INNER JOIN sys_user_role ur ON rm.role_id = ur.role_id
			WHERE ur.user_id = ? AND m.menu_status = 1
			ORDER BY m.sort_order ASC
		`).bind(payload.userId).all();

		// 构建菜单树
		const menuTree = buildMenuTree(menusResult.results as any[]);

		return c.json(success({
			user: userResult,
			permissions,
			menus: menuTree,
		}));
	} catch (e: any) {
		return c.json(fail(500, e.message));
	}
});

/**
 * 刷新 Token
 * POST /api/auth/refresh
 */
authApi.post("/refresh", async (c) => {
	try {
		const authHeader = c.req.header("Authorization");
		if (!authHeader || !authHeader.startsWith("Bearer ")) {
			return c.json(unauthorized("未登录"));
		}

		const token = authHeader.substring(7);

		// 验证当前 token
		const payload = await verifyToken(token, c.env.JWT_SECRET || "default-secret-key");
		if (!payload) {
			return c.json(unauthorized("Token 无效或已过期"));
		}

		// 生成新 token
		const newToken = await signToken(
			{
				userId: payload.userId,
				username: payload.username,
			},
			c.env.JWT_SECRET || "default-secret-key"
		);

		return c.json(success({ token: newToken }, "刷新成功"));
	} catch (e: any) {
		return c.json(fail(500, e.message));
	}
});

/**
 * 构建菜单树
 */
function buildMenuTree(menus: any[], parentId: number = 0): any[] {
	const result: any[] = [];

	for (const menu of menus) {
		if (menu.parent_id === parentId) {
			const children = buildMenuTree(menus, menu.id);
			if (children.length > 0) {
				menu.children = children;
			}
			result.push(menu);
		}
	}

	return result;
}

export default authApi;
