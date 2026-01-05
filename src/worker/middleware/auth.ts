/**
 * 认证中间件
 * 验证 JWT token 并将用户信息附加到上下文
 * 使用 KV 缓存优化权限加载性能
 */

import type { Context, Next } from "hono";
import type { Env, Variables, AuthUser } from "../index.d";
import { verifyToken } from "../utils/jwt";
import { unauthorized } from "../utils/response";
import { PermissionCacheService } from "../services/permission-cache.service";

/**
 * 从缓存或数据库加载用户权限
 * 使用 KV 缓存避免每次请求都查询数据库
 */
async function loadUserPermissions(kv: KVNamespace, db: D1Database, userId: number): Promise<string[]> {
	try {
		const permissionCache = new PermissionCacheService(kv);
		return await permissionCache.getUserPermissions(userId, db);
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

	// 加载用户权限（使用 KV 缓存）
	const permissions = await loadUserPermissions(c.env.KV_BINDING, c.env.DB, payload.userId);

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
			// 加载用户权限（使用 KV 缓存）
			const permissions = await loadUserPermissions(c.env.KV_BINDING, c.env.DB, payload.userId);

			c.set("currentUser", {
				userId: payload.userId,
				username: payload.username,
				permissions: permissions,
			} as AuthUser);
		}
	}

	await next();
};
