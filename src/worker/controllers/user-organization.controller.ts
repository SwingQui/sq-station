/**
 * 用户组织关联控制器
 * 处理用户组织分配相关的 HTTP 请求
 */

import { Hono } from "hono";
import type { Env, Variables } from "../index.d";
import { UserOrganizationRepository } from "../repositories/user-organization.repository";
import { success, fail, badRequest, handleError } from "../utils/response";

const app = new Hono<{ Bindings: Env; Variables: Variables }>();

// 查询用户的组织列表
app.get("/:userId", async (c) => {
	try {
		const userId = parseInt(c.req.param("userId"));
		if (isNaN(userId)) {
			return c.json(badRequest("无效的用户 ID"));
		}

		const userOrgRepo = new UserOrganizationRepository(c.env.DB);
		const result = await userOrgRepo.findOrgsByUserId(userId);
		return c.json(success(result));
	} catch (e: any) {
		return c.json(fail(500, handleError(e, "查询用户组织失败")));
	}
});

// 为用户分配组织
app.put("/:userId", async (c) => {
	try {
		const userId = parseInt(c.req.param("userId"));
		if (isNaN(userId)) {
			return c.json(badRequest("无效的用户 ID"));
		}

		const { orgIds } = await c.req.json();
		if (!Array.isArray(orgIds)) {
			return c.json(badRequest("组织 ID 列表格式错误"));
		}

		const userOrgRepo = new UserOrganizationRepository(c.env.DB);
		await userOrgRepo.updateUserOrgs(userId, orgIds);
		return c.json(success(null, "分配组织成功"));
	} catch (e: any) {
		return c.json(fail(500, handleError(e, "分配组织失败")));
	}
});

export default app;
