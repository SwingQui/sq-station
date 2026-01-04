/**
 * 认证控制器
 * 处理登录、登出、获取用户信息等认证相关的 HTTP 请求
 */

import { Hono } from "hono";
import type { Env, Variables } from "../index.d";
import { AuthService } from "../services/auth.service";
import { UserRepository } from "../repositories/user.repository";
import { MenuRepository } from "../repositories/menu.repository";
import { success, fail, unauthorized, notFound, handleError } from "../utils/response";
import { authMiddleware } from "../middleware/auth";

const app = new Hono<{ Bindings: Env; Variables: Variables }>();

/**
 * 登录接口
 * POST /api/auth/login
 * Body: { username, password }
 */
app.post("/login", async (c) => {
	try {
		const data = await c.req.json();

		const userRepo = new UserRepository(c.env.DB);
		const menuRepo = new MenuRepository(c.env.DB);
		const authService = new AuthService(userRepo, menuRepo);

		const result = await authService.login(
			data,
			c.env.JWT_SECRET || "default-secret-key",
			c.env.JWT_EXPIRES_IN || "24 * 60 * 60"
		);

		return c.json(success(result, "登录成功"));
	} catch (e: any) {
		if (e.message.includes("用户名或密码") || e.message.includes("不能为空") || e.message.includes("已被禁用")) {
			return c.json(unauthorized(e.message));
		}
		return c.json(fail(500, handleError(e, "登录失败")));
	}
});

/**
 * 登出接口
 * POST /api/auth/logout
 * JWT 是无状态的，客户端删除 token 即可
 */
app.post("/logout", (c) => {
	return c.json(success(null, "登出成功"));
});

/**
 * 获取当前用户信息（包含权限和菜单）
 * GET /api/auth/me
 * 需要认证（由中间件保护）
 */
app.get("/me", authMiddleware, async (c) => {
	try {
		const currentUser = c.get("currentUser");
		if (!currentUser) {
			return c.json(unauthorized("未登录"));
		}

		const userRepo = new UserRepository(c.env.DB);
		const menuRepo = new MenuRepository(c.env.DB);
		const authService = new AuthService(userRepo, menuRepo);

		const result = await authService.getUserInfo(currentUser.userId);

		return c.json(success(result));
	} catch (e: any) {
		if (e.message === "用户不存在") {
			return c.json(notFound(e.message));
		}
		return c.json(fail(500, handleError(e, "获取用户信息失败")));
	}
});

/**
 * 刷新 Token
 * POST /api/auth/refresh
 * 需要认证（由中间件保护）
 */
app.post("/refresh", authMiddleware, async (c) => {
	try {
		const currentUser = c.get("currentUser");
		if (!currentUser) {
			return c.json(unauthorized("未登录"));
		}

		const userRepo = new UserRepository(c.env.DB);
		const menuRepo = new MenuRepository(c.env.DB);
		const authService = new AuthService(userRepo, menuRepo);

		const token = await authService.refreshToken(
			currentUser.userId,
			currentUser.username,
			c.env.JWT_SECRET || "default-secret-key",
			c.env.JWT_EXPIRES_IN || "24 * 60 * 60"
		);

		return c.json(success({ token }, "刷新成功"));
	} catch (e: any) {
		return c.json(fail(500, handleError(e, "刷新 Token 失败")));
	}
});

export default app;
