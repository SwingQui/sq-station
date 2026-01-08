/**
 * 认证中间件
 * 验证 JWT token 并将用户信息附加到上下文
 * 支持用户 Token 和 OAuth 客户端 Token
 */

import type { Context, Next } from "hono";
import type { Env, Variables, AuthUser, OAuthClient } from "../index.d";
import { verifyToken } from "../utils/jwt";
import { unauthorized } from "../utils/response";
import { MenuRepository } from "../repositories/menu.repository";

/**
 * 从数据库加载用户权限（角色权限 + 直接权限）
 */
async function loadUserPermissions(db: D1Database, userId: number): Promise<string[]> {
	try {
		const menuRepo = new MenuRepository(db);
		return await menuRepo.findPermissionsByUserId(userId);
	} catch (e) {
		console.error("[Auth] Error loading user permissions:", e);
		return []; // 返回空数组而不是抛出错误
	}
}

/**
 * 认证中间件
 * 验证请求头中的 JWT token
 * 支持两种 Token 类型：
 * 1. 用户 Token（包含 userId, username）
 * 2. OAuth Token（包含 clientId, scopes）
 */
export const authMiddleware = async (c: Context<{ Bindings: Env; Variables: Variables }>, next: Next) => {
	// 公开路径白名单（不需要认证的路径）
	const publicPaths = [
		"/api/auth/login",
		"/api/auth/logout",
		"/oauth/token", // OAuth Token 端点是公开的
	];

	// 如果是公开路径，直接跳过认证
	if (publicPaths.some((path) => c.req.path === path || c.req.path.startsWith(path))) {
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

	// 检查 Token 类型
	if (payload.type === "oauth") {
		// OAuth Token：设置客户端信息到上下文
		console.log(`[AuthMiddleware] OAuth Token verified for client: ${payload.clientName} (${payload.clientId})`);
		c.set("oauthClient", {
			clientId: payload.clientId!,
			clientName: payload.clientName!,
			scopes: payload.scopes || [],
		} as OAuthClient);
	} else {
		// 用户 Token：从数据库加载用户权限
		console.log(`[AuthMiddleware] User Token verified for user: ${payload.username} (ID: ${payload.userId})`);
		const permissions = await loadUserPermissions(c.env.DB, payload.userId!);

		c.set("currentUser", {
			userId: payload.userId!,
			username: payload.username!,
			permissions: permissions,
		} as AuthUser);
	}

	console.log(`[AuthMiddleware] Context set, proceeding to next handler`);
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
			if (payload.type === "oauth") {
				c.set("oauthClient", {
					clientId: payload.clientId!,
					clientName: payload.clientName!,
					scopes: payload.scopes || [],
				} as OAuthClient);
			} else {
				const permissions = await loadUserPermissions(c.env.DB, payload.userId!);
				c.set("currentUser", {
					userId: payload.userId!,
					username: payload.username!,
					permissions: permissions,
				} as AuthUser);
			}
		}
	}

	await next();
};
