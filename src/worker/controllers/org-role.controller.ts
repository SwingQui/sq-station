/**
 * 组织角色关联控制器
 * 处理组织角色分配相关的 HTTP 请求
 */

import { Hono } from "hono";
import type { Env, Variables } from "../index.d";
import { OrgRoleRepository } from "../repositories/org-role.repository";
import { success, fail, badRequest, handleError } from "../utils/response";

const app = new Hono<{ Bindings: Env; Variables: Variables }>();

// 查询组织的角色列表
app.get("/:orgId", async (c) => {
	try {
		const orgId = parseInt(c.req.param("orgId"));
		if (isNaN(orgId)) {
			return c.json(badRequest("无效的组织 ID"));
		}

		const orgRoleRepo = new OrgRoleRepository(c.env.DB);
		const result = await orgRoleRepo.findRolesByOrgId(orgId);
		return c.json(success(result));
	} catch (e: any) {
		return c.json(fail(500, handleError(e, "查询组织角色失败")));
	}
});

// 为组织分配角色
app.put("/:orgId", async (c) => {
	try {
		const orgId = parseInt(c.req.param("orgId"));
		if (isNaN(orgId)) {
			return c.json(badRequest("无效的组织 ID"));
		}

		const { roleIds } = await c.req.json();
		if (!Array.isArray(roleIds)) {
			return c.json(badRequest("角色 ID 列表格式错误"));
		}

		const orgRoleRepo = new OrgRoleRepository(c.env.DB);
		await orgRoleRepo.updateOrgRoles(orgId, roleIds);
		return c.json(success(null, "分配角色成功"));
	} catch (e: any) {
		return c.json(fail(500, handleError(e, "分配角色失败")));
	}
});

export default app;
