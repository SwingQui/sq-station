/**
 * 用户角色关联控制器
 * 处理用户角色分配相关的 HTTP 请求
 */

import { Hono } from "hono";
import type { Env, Variables } from "../index.d";
import { UserRoleService } from "../services/user-role.service";
import { UserRepository } from "../repositories/user.repository";
import { RoleRepository } from "../repositories/role.repository";
import { UserRoleRepository } from "../repositories/user-role.repository";
import { success, fail, badRequest, notFound } from "../utils/response";

const app = new Hono<{ Bindings: Env; Variables: Variables }>();

// 中间件：创建服务实例并注入到上下文
app.use("/*", async (c, next) => {
	const userRepo = new UserRepository(c.env.DB);
	const roleRepo = new RoleRepository(c.env.DB);
	const userRoleRepo = new UserRoleRepository(c.env.DB);
	const userRoleService = new UserRoleService(userRepo, roleRepo, userRoleRepo);
	c.set("userRoleService", userRoleService);
	await next();
});

// 获取用户的角色列表
app.get("/:id/roles", async (c) => {
	try {
		const id = parseInt(c.req.param("id"));
		if (isNaN(id)) {
			return c.json(badRequest("无效的用户 ID"));
		}

		const userRoleService = c.get("userRoleService") as UserRoleService;
		const roles = await userRoleService.getRolesByUserId(id);
		return c.json(success(roles));
	} catch (e: any) {
		if (e.message === "用户不存在") {
			return c.json(notFound(e.message));
		}
		return c.json(fail(500, e.message));
	}
});

// 为用户分配角色
app.put("/:id/roles", async (c) => {
	try {
		const id = parseInt(c.req.param("id"));
		if (isNaN(id)) {
			return c.json(badRequest("无效的用户 ID"));
		}

		const { roleIds } = await c.req.json();
		if (!Array.isArray(roleIds)) {
			return c.json(badRequest("角色 ID 必须是数组"));
		}

		const userRoleService = c.get("userRoleService") as UserRoleService;
		await userRoleService.assignRoles(id, roleIds);

		return c.json(success(null, "分配成功"));
	} catch (e: any) {
		if (e.message === "用户不存在") {
			return c.json(notFound(e.message));
		}
		if (e.message.includes("不存在")) {
			return c.json(fail(400, e.message));
		}
		return c.json(fail(500, e.message));
	}
});

export default app;
