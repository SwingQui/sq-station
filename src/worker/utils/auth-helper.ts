/**
 * 认证路由辅助函数
 * 提供创建带认证和不带认证路由器的便捷方法
 */

import { Hono } from "hono";
import type { Env, Variables } from "../index.d";
import { authMiddleware } from "../middleware/auth";

/**
 * 创建一个需要认证的 Hono 路由器
 * 所有挂载到这个路由器的端点都会自动验证 JWT token
 *
 * @example
 * const protectedApi = createAuthRouter();
 * protectedApi.get("/users", getUsersHandler);
 * protectedApi.post("/users", createUserHandler);
 * app.route("/api", protectedApi);
 */
export function createAuthRouter(): Hono<{ Bindings: Env; Variables: Variables }> {
	const router = new Hono<{ Bindings: Env; Variables: Variables }>();
	router.use("/*", authMiddleware);
	return router;
}

/**
 * 创建一个不需要认证的 Hono 路由器（公开端点）
 *
 * @example
 * const publicApi = createPublicRouter();
 * publicApi.post("/login", loginHandler);
 * publicApi.post("/logout", logoutHandler);
 * app.route("/api/auth", publicApi);
 */
export function createPublicRouter(): Hono<{ Bindings: Env; Variables: Variables }> {
	return new Hono<{ Bindings: Env; Variables: Variables }>();
}
