/**
 * OAuth Controller
 * 处理 OAuth 2.0 Token 端点
 */

import { Hono } from "hono";
import { OAuthService } from "../services/oauth.service";
import { OAuthRepository } from "../repositories/oauth.repository";
import { success, fail, badRequest, unauthorized } from "../utils/response";
import type { Env, Variables } from "../index.d";

const app = new Hono<{ Bindings: Env; Variables: Variables }>();

/**
 * OAuth 2.0 Token 端点
 * POST /oauth/token
 *
 * 请求体：
 * {
 *   "grant_type": "client_credentials",
 *   "client_id": "xxx",
 *   "client_secret": "xxx",
 *   "scope": "system:user:list system:role:list"  // 可选
 * }
 *
 * 响应：
 * {
 *   "code": 200,
 *   "data": {
 *     "access_token": "eyJhbGc...",
 *     "token_type": "Bearer",
 *     "expires_in": 3600,
 *     "scope": "system:user:list system:role:list"
 *   }
 * }
 */
app.post("/token", async (c) => {
	try {
		const { grant_type, client_id, client_secret, scope } = await c.req.json();

		// 验证 grant_type
		if (grant_type !== "client_credentials") {
			return c.json(badRequest("不支持的授权类型"));
		}

		// 验证必需参数
		if (!client_id || !client_secret) {
			return c.json(badRequest("缺少必需参数"));
		}

		const oauthRepo = new OAuthRepository(c.env.DB);
		const oauthService = new OAuthService(oauthRepo);

		// 生成 Token
		const result = await oauthService.generateClientCredentialsToken(
			client_id,
			client_secret,
			scope,
			c.env.JWT_SECRET
		);

		return c.json(success(result));
	} catch (e: any) {
		if (
			e.message.includes("无效的客户端") ||
			e.message.includes("已被禁用") ||
			e.message.includes("权限超出授权范围")
		) {
			return c.json(unauthorized(e.message));
		}
		return c.json(fail(400, e.message || "获取 Token 失败"));
	}
});

export default app;
