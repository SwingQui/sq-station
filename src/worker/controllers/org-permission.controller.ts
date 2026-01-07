/**
 * 组织权限控制器
 * 处理组织权限分配相关的 HTTP 请求
 */

import { Hono } from "hono";
import type { Env, Variables } from "../index.d";
import { OrgPermissionRepository } from "../repositories/org-permission.repository";
import { success, fail, badRequest } from "../utils/response";

const app = new Hono<{ Bindings: Env; Variables: Variables }>();

// 中间件：创建 Repository 实例并注入到上下文
app.use("/*", async (c, next) => {
	const orgPermRepo = new OrgPermissionRepository(c.env.DB);
	c.set("orgPermRepo", orgPermRepo);
	await next();
});

/**
 * 获取组织的权限列表
 * GET /api/organizations/:orgId/permissions
 */
app.get("/:orgId/permissions", async (c) => {
	try {
		const orgId = parseInt(c.req.param("orgId"));
		if (isNaN(orgId)) {
			return c.json(badRequest("无效的组织 ID"));
		}

		const orgPermRepo = c.get("orgPermRepo") as OrgPermissionRepository;
		const permissions = await orgPermRepo.findByOrgId(orgId);
		return c.json(success(permissions));
	} catch (e: any) {
		return c.json(fail(500, e.message));
	}
});

/**
 * 为组织分配权限
 * PUT /api/organizations/:orgId/permissions
 * Body: { permissions: string[] }
 */
app.put("/:orgId/permissions", async (c) => {
	try {
		const orgId = parseInt(c.req.param("orgId"));
		if (isNaN(orgId)) {
			return c.json(badRequest("无效的组织 ID"));
		}

		const { permissions } = await c.req.json();

		if (!Array.isArray(permissions)) {
			return c.json(badRequest("权限必须是数组"));
		}

		const currentUser = c.get("currentUser") as any;
		const orgPermRepo = c.get("orgPermRepo") as OrgPermissionRepository;

		await orgPermRepo.assignPermissions(orgId, permissions, currentUser?.userId);
		return c.json(success(null, "分配成功"));
	} catch (e: any) {
		return c.json(fail(500, e.message));
	}
});

export default app;
