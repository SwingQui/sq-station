/**
 * OAuth Service
 * 处理 OAuth 2.0 Client Credentials Token 生成逻辑
 */

import { OAuthRepository } from "../repositories/oauth.repository";
import { signToken } from "../utils/jwt";
import { verifyClientSecret } from "../utils/crypto";

export interface ClientCredentialsTokenResponse {
	access_token: string;
	token_type: string;
	expires_in: number;
	scope: string;
}

export class OAuthService {
	constructor(private oauthRepo: OAuthRepository) {}

	/**
	 * 生成 Client Credentials Token
	 */
	async generateClientCredentialsToken(
		clientId: string,
		clientSecret: string,
		requestedScope: string | undefined,
		jwtSecret: string | undefined
	): Promise<ClientCredentialsTokenResponse> {
		// 1. 验证客户端凭据
		const client = await this.oauthRepo.findByClientId(clientId);
		if (!client) {
			throw new Error("无效的客户端凭据");
		}

		// 2. 验证密钥
		const isValidSecret = await verifyClientSecret(clientSecret, client.client_secret);
		if (!isValidSecret) {
			throw new Error("无效的客户端凭据");
		}

		// 3. 检查客户端状态
		if (client.status !== 1) {
			throw new Error("客户端已被禁用");
		}

		// 4. 获取客户端的有效权限（自定义权限 + 权限组权限）
		const clientScopes = await this.oauthRepo.getClientEffectiveScopes(clientId);
		let finalScopes: string[] = [];

		if (requestedScope) {
			// 请求了特定 scope，验证是否在授权范围内
			const requestedScopes = requestedScope.split(" ").filter(Boolean);
			finalScopes = requestedScopes.filter((s) => clientScopes.includes(s));

			if (finalScopes.length === 0) {
				throw new Error("请求的权限超出授权范围");
			}
		} else {
			// 未请求 scope，使用客户端的全部授权 scope
			finalScopes = clientScopes;
		}

		// 5. 生成 JWT Token
		const token = await signToken(
			{
				clientId: client.client_id,
				clientName: client.client_name,
				scopes: finalScopes,
				type: "oauth", // 标识这是 OAuth Token
			},
			jwtSecret || "default-secret",
			`${client.expires_in}s`
		);

		return {
			access_token: token,
			token_type: "Bearer",
			expires_in: client.expires_in,
			scope: finalScopes.join(" "),
		};
	}
}
