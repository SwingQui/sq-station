/**
 * OAuth Client Management Controller
 * 处理 OAuth 客户端管理的 HTTP 请求
 */

import { createAuthRouter } from "../utils/auth-helper";
import { OAuthRepository } from "../repositories/oauth.repository";
import { requirePermission } from "../middleware/permission";
import { Permission } from "../constants/permissions";
import { generateClientId, generateClientSecret, hashClientSecret } from "../utils/crypto";
import { success, fail, badRequest } from "../utils/response";

const router = createAuthRouter();

/**
 * 获取客户端列表
 * GET /api/oauth/clients
 */
router.get(
	"/clients",
	requirePermission(Permission.OAUTH_CLIENT_READ),
	async (c) => {
		try {
			const oauthRepo = new OAuthRepository(c.env.DB);
			const clients = await oauthRepo.findAll();
			// 返回时不返回 client_secret
			const safeClients = clients.map((client) => ({
				...client,
				client_secret: "***HIDDEN***",
			}));
			return c.json(success(safeClients));
		} catch (e: any) {
			return c.json(fail(500, e.message || "获取客户端列表失败"));
		}
	}
);

/**
 * 创建客户端
 * POST /api/oauth/clients
 */
router.post(
	"/clients",
	requirePermission(Permission.OAUTH_CLIENT_CREATE),
	async (c) => {
		try {
			const data = await c.req.json();
			const { client_name, description, scope, expires_in, status } = data;

			// 验证必需参数
			if (!client_name) {
				return c.json(badRequest("客户端名称不能为空"));
			}

			// 生成客户端 ID 和密钥
			const clientId = generateClientId();
			const clientSecret = generateClientSecret();
			const hashedSecret = await hashClientSecret(clientSecret);

			const oauthRepo = new OAuthRepository(c.env.DB);
			const id = await oauthRepo.create({
				client_id: clientId,
				client_secret: hashedSecret,
				client_name,
				description,
				scope: scope || "[]",
				expires_in: expires_in || 3600,
				status: status ?? 1,
			});

			// 返回创建的客户端（包含明文密钥，仅此一次）
			return c.json(
				success(
					{
						id,
						client_id: clientId,
						client_secret: clientSecret, // 仅创建时返回明文密钥
						client_name,
						description,
						scope: scope || "[]",
						expires_in: expires_in || 3600,
						status: status ?? 1,
					},
					"客户端创建成功"
				)
			);
		} catch (e: any) {
			return c.json(fail(500, e.message || "创建客户端失败"));
		}
	}
);

/**
 * 更新客户端
 * PUT /api/oauth/clients/:id
 */
router.put(
	"/clients/:id",
	requirePermission(Permission.OAUTH_CLIENT_UPDATE),
	async (c) => {
		try {
			const id = parseInt(c.req.param("id"));
			const data = await c.req.json();

			const oauthRepo = new OAuthRepository(c.env.DB);
			const existing = await oauthRepo.findById(id);
			if (!existing) {
				return c.json(badRequest("客户端不存在"));
			}

			// 使用 updateWithGroups 支持 permission_group_ids
			await oauthRepo.updateWithGroups(id, data);
			return c.json(success(null, "更新成功"));
		} catch (e: any) {
			return c.json(fail(500, e.message || "更新客户端失败"));
		}
	}
);

/**
 * 删除客户端
 * DELETE /api/oauth/clients/:id
 */
router.delete(
	"/clients/:id",
	requirePermission(Permission.OAUTH_CLIENT_DELETE),
	async (c) => {
		try {
			const id = parseInt(c.req.param("id"));

			const oauthRepo = new OAuthRepository(c.env.DB);
			const existing = await oauthRepo.findById(id);
			if (!existing) {
				return c.json(badRequest("客户端不存在"));
			}

			await oauthRepo.delete(id);
			return c.json(success(null, "删除成功"));
		} catch (e: any) {
			return c.json(fail(500, e.message || "删除客户端失败"));
		}
	}
);

/**
 * 重置客户端密钥
 * POST /api/oauth/clients/:id/reset-secret
 */
router.post(
	"/clients/:id/reset-secret",
	requirePermission(Permission.OAUTH_CLIENT_RESET_SECRET),
	async (c) => {
		try {
			const id = parseInt(c.req.param("id"));

			const oauthRepo = new OAuthRepository(c.env.DB);
			const existing = await oauthRepo.findById(id);
			if (!existing) {
				return c.json(badRequest("客户端不存在"));
			}

			// 生成新密钥
			const newSecret = generateClientSecret();
			const hashedSecret = await hashClientSecret(newSecret);

			await oauthRepo.updateSecret(id, hashedSecret);

			return c.json(
				success(
					{ client_secret: newSecret },
					"密钥已重置，请妥善保存"
				)
			);
		} catch (e: any) {
			return c.json(fail(500, e.message || "重置密钥失败"));
		}
	}
);

export default router;
