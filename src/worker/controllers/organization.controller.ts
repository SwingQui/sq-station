/**
 * 组织控制器
 * 处理组织管理相关的 HTTP 请求
 */

import { Hono } from "hono";
import type { Env, Variables } from "../index.d";
import { OrganizationService } from "../services/organization.service";
import { OrganizationRepository } from "../repositories/organization.repository";
import { success, fail, badRequest, handleError } from "../utils/response";

const app = new Hono<{ Bindings: Env; Variables: Variables }>();

// 中间件：创建服务实例并注入到上下文
app.use("/*", async (c, next) => {
	const orgRepo = new OrganizationRepository(c.env.DB);
	const orgService = new OrganizationService(orgRepo);
	c.set("orgService", orgService);
	await next();
});

// 查询所有组织
app.get("/", async (c) => {
	try {
		const orgService = c.get("orgService") as OrganizationService;
		const result = await orgService.findAll();
		return c.json(success(result));
	} catch (e: any) {
		return c.json(fail(500, handleError(e, "查询组织列表失败")));
	}
});

// 根据 ID 查询组织
app.get("/:id", async (c) => {
	try {
		const id = parseInt(c.req.param("id"));
		if (isNaN(id)) {
			return c.json(badRequest("无效的组织 ID"));
		}

		const orgService = c.get("orgService") as OrganizationService;
		const result = await orgService.findById(id);
		return c.json(success(result));
	} catch (e: any) {
		return c.json(fail(500, handleError(e, "查询组织详情失败")));
	}
});

// 创建组织
app.post("/", async (c) => {
	try {
		const data = await c.req.json();
		const orgService = c.get("orgService") as OrganizationService;
		const id = await orgService.create(data);
		return c.json(success({ id }, "创建组织成功"));
	} catch (e: any) {
		return c.json(fail(500, handleError(e, "创建组织失败")));
	}
});

// 更新组织
app.put("/:id", async (c) => {
	try {
		const id = parseInt(c.req.param("id"));
		if (isNaN(id)) {
			return c.json(badRequest("无效的组织 ID"));
		}

		const data = await c.req.json();
		const orgService = c.get("orgService") as OrganizationService;
		await orgService.update(id, data);
		return c.json(success(null, "更新组织成功"));
	} catch (e: any) {
		return c.json(fail(500, handleError(e, "更新组织失败")));
	}
});

// 删除组织
app.delete("/:id", async (c) => {
	try {
		const id = parseInt(c.req.param("id"));
		if (isNaN(id)) {
			return c.json(badRequest("无效的组织 ID"));
		}

		const orgService = c.get("orgService") as OrganizationService;
		await orgService.delete(id);
		return c.json(success(null, "删除组织成功"));
	} catch (e: any) {
		return c.json(fail(500, handleError(e, "删除组织失败")));
	}
});

export default app;
