/**
 * 认证 API
 * 包含登录、登出、获取当前用户信息等接口
 */

import { Hono } from "hono";
import type { Env, Variables } from "../index.d";
import { signToken } from "../utils/jwt";
import { verifyPasswordWithUsername } from "../utils/password";
import { success, fail, badRequest, unauthorized, notFound } from "../utils/response";
import { authMiddleware } from "../middleware/auth";
import { buildMenuTree } from "../utils/tree";
import { handleError } from "../utils/response";
import type { SysMenu } from "../types/database";

const authApi = new Hono<{ Bindings: Env; Variables: Variables }>();

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
			c.env.JWT_SECRET || "default-secret-key",
			c.env.JWT_EXPIRES_IN || "24 * 60 * 60"
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
	} catch (e: unknown) {
		return c.json(fail(500, handleError(e, "登录失败")));
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
 * 需要认证（由中间件保护）
 */
authApi.get("/me", authMiddleware, async (c) => {
	try {
		// 从上下文获取当前用户（由 authMiddleware 注入）
		const currentUser = c.get("currentUser");
		if (!currentUser) {
			return c.json(unauthorized("未登录"));
		}

		const userId = currentUser.userId;

		// 查询用户信息
		const userResult = await c.env.DB.prepare(
			"SELECT id, username, nickname, avatar, email, phone FROM sys_user WHERE id = ? AND status = 1"
		).bind(userId).first();

		if (!userResult) {
			return c.json(notFound("用户不存在"));
		}

		// 检查是否为超级管理员
		const isAdmin = userId === 1 || userResult.username === "admin";

		let permissions: string[];
		let menuTree: SysMenu[];

		if (isAdmin) {
			// 超级管理员获取所有权限和菜单
			const allPermissionsResult = await c.env.DB.prepare(`
				SELECT DISTINCT permission
				FROM sys_menu
				WHERE permission IS NOT NULL AND permission != ''
			`).all();

			permissions = allPermissionsResult.results.map((r) => r.permission as string);

			const allMenusResult = await c.env.DB.prepare(`
				SELECT *
				FROM sys_menu
				WHERE menu_status = 1
				ORDER BY sort_order ASC
			`).all();

			menuTree = buildMenuTree(allMenusResult.results as unknown as SysMenu[]);
		} else {
			// 普通用户按角色查询
			const permissionsResult = await c.env.DB.prepare(`
				SELECT DISTINCT m.permission
				FROM sys_menu m
				INNER JOIN sys_role_menu rm ON m.id = rm.menu_id
				INNER JOIN sys_user_role ur ON rm.role_id = ur.role_id
				WHERE ur.user_id = ? AND m.permission IS NOT NULL AND m.permission != ''
			`).bind(userId).all();

			permissions = permissionsResult.results.map((r) => r.permission as string);

			const menusResult = await c.env.DB.prepare(`
				SELECT m.*
				FROM sys_menu m
				INNER JOIN sys_role_menu rm ON m.id = rm.menu_id
				INNER JOIN sys_user_role ur ON rm.role_id = ur.role_id
				WHERE ur.user_id = ? AND m.menu_status = 1
				ORDER BY m.sort_order ASC
			`).bind(userId).all();

			menuTree = buildMenuTree(menusResult.results as unknown as SysMenu[]);
		}

		return c.json(success({
			user: userResult,
			permissions,
			menus: menuTree,
		}));
	} catch (e: unknown) {
		return c.json(fail(500, handleError(e, "获取用户信息失败")));
	}
});

/**
 * 刷新 Token
 * POST /api/auth/refresh
 * 需要认证（由中间件保护）
 */
authApi.post("/refresh", authMiddleware, async (c) => {
	try {
		// 从上下文获取当前用户（由 authMiddleware 注入）
		const currentUser = c.get("currentUser");
		if (!currentUser) {
			return c.json(unauthorized("未登录"));
		}

		// 生成新 token
		const newToken = await signToken(
			{
				userId: currentUser.userId,
				username: currentUser.username,
			},
			c.env.JWT_SECRET || "default-secret-key",
			c.env.JWT_EXPIRES_IN || "24 * 60 * 60"
		);

		return c.json(success({ token: newToken }, "刷新成功"));
	} catch (e: unknown) {
		return c.json(fail(500, handleError(e, "刷新 Token 失败")));
	}
});

export default authApi;
