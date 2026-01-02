/**
 * 认证中间件
 * 验证 JWT token 并将用户信息附加到上下文
 */

import type { Context, Next } from "hono";
import { verifyToken } from "../utils/jwt";

export interface AuthUser {
	userId: number;
	username: string;
}

/**
 * 认证中间件
 * 验证请求头中的 JWT token
 */
export const authMiddleware = async (c: Context, next: Next) => {
	const authHeader = c.req.header("Authorization");

	// 没有 Authorization header
	if (!authHeader || !authHeader.startsWith("Bearer ")) {
		return c.json({ error: "未登录" }, 401);
	}

	const token = authHeader.substring(7);

	// 验证 token
	const payload = await verifyToken(token, c.env.JWT_SECRET || "default-secret-key");

	if (!payload) {
		return c.json({ error: "Token 无效或已过期" }, 401);
	}

	// 将用户信息附加到上下文
	c.set("currentUser", {
		userId: payload.userId,
		username: payload.username,
	} as AuthUser);

	await next();
};

/**
 * 可选认证中间件
 * 如果有 token 则验证，没有则跳过
 */
export const optionalAuthMiddleware = async (c: Context, next: Next) => {
	const authHeader = c.req.header("Authorization");

	if (authHeader && authHeader.startsWith("Bearer ")) {
		const token = authHeader.substring(7);
		const payload = await verifyToken(token, c.env.JWT_SECRET || "default-secret-key");

		if (payload) {
			c.set("currentUser", {
				userId: payload.userId,
				username: payload.username,
			} as AuthUser);
		}
	}

	await next();
};
