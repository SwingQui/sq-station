/**
 * OAuth Permission Group Management Controller
 * 处理 OAuth 权限组管理的 HTTP 请求
 */

import { createAuthRouter } from "../utils/auth-helper";
import { OAuthPermissionGroupRepository } from "../repositories/oauth-permission-group.repository";
import { requirePermission } from "../middleware/permission";
import { success, fail, badRequest } from "../utils/response";
import { Permission } from "../constants/permissions";

const router = createAuthRouter();

/**
 * 获取权限组列表
 * GET /api/oauth/permission-groups
 */
router.get(
	"/permission-groups",
	requirePermission(Permission.OAUTH_GROUP_READ),
	async (c) => {
		try {
			const repo = new OAuthPermissionGroupRepository(c.env.DB);
			const groups = await repo.findAll();
			return c.json(success(groups));
		} catch (e: any) {
			return c.json(fail(500, e.message || "获取权限组列表失败"));
		}
	}
);

/**
 * 获取单个权限组
 * GET /api/oauth/permission-groups/:id
 */
router.get(
	"/permission-groups/:id",
	requirePermission(Permission.OAUTH_GROUP_READ),
	async (c) => {
		try {
			const id = parseInt(c.req.param("id"));
			const repo = new OAuthPermissionGroupRepository(c.env.DB);
			const group = await repo.findById(id);
			if (!group) {
				return c.json(badRequest("权限组不存在"));
			}
			return c.json(success(group));
		} catch (e: any) {
			return c.json(fail(500, e.message || "获取权限组失败"));
		}
	}
);

/**
 * 创建权限组
 * POST /api/oauth/permission-groups
 */
router.post(
	"/permission-groups",
	requirePermission(Permission.OAUTH_GROUP_CREATE),
	async (c) => {
		try {
			const data = await c.req.json();
			const { group_key, group_name, description, permissions, sort_order, status } = data;

			// 验证必需参数
			if (!group_key || !group_name) {
				return c.json(badRequest("权限组标识和名称不能为空"));
			}

			if (!permissions || !Array.isArray(permissions)) {
				return c.json(badRequest("权限列表格式错误"));
			}

			const repo = new OAuthPermissionGroupRepository(c.env.DB);

			// 检查 group_key 是否已存在
			const existing = await repo.findByGroupKey(group_key);
			if (existing) {
				return c.json(badRequest("权限组标识已存在"));
			}

			const id = await repo.create({
				group_key,
				group_name,
				description,
				permissions,
				sort_order,
				status,
			});

			return c.json(success({ id }, "权限组创建成功"));
		} catch (e: any) {
			return c.json(fail(500, e.message || "创建权限组失败"));
		}
	}
);

/**
 * 更新权限组
 * PUT /api/oauth/permission-groups/:id
 */
router.put(
	"/permission-groups/:id",
	requirePermission(Permission.OAUTH_GROUP_UPDATE),
	async (c) => {
		try {
			const id = parseInt(c.req.param("id"));
			const data = await c.req.json();

			const repo = new OAuthPermissionGroupRepository(c.env.DB);
			const existing = await repo.findById(id);
			if (!existing) {
				return c.json(badRequest("权限组不存在"));
			}

			// 如果修改 group_key，检查是否冲突
			if (data.group_key && data.group_key !== existing.group_key) {
				const conflict = await repo.findByGroupKey(data.group_key);
				if (conflict) {
					return c.json(badRequest("权限组标识已存在"));
				}
			}

			await repo.update(id, data);
			return c.json(success(null, "更新成功"));
		} catch (e: any) {
			return c.json(fail(500, e.message || "更新权限组失败"));
		}
	}
);

/**
 * 删除权限组
 * DELETE /api/oauth/permission-groups/:id
 */
router.delete(
	"/permission-groups/:id",
	requirePermission(Permission.OAUTH_GROUP_DELETE),
	async (c) => {
		try {
			const id = parseInt(c.req.param("id"));

			const repo = new OAuthPermissionGroupRepository(c.env.DB);
			const existing = await repo.findById(id);
			if (!existing) {
				return c.json(badRequest("权限组不存在"));
			}

			await repo.delete(id);
			return c.json(success(null, "删除成功"));
		} catch (e: any) {
			return c.json(fail(500, e.message || "删除权限组失败"));
		}
	}
);

export default router;
