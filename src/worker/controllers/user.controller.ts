/**
 * 用户控制器
 * 处理用户相关的 HTTP 请求和响应
 */

import { Hono } from "hono";
import type { Env, Variables } from "../index.d";
import { UserService } from "../services/user.service";
import { UserRepository } from "../repositories/user.repository";
import { UserRoleRepository } from "../repositories/user-role.repository";
import { RoleRepository } from "../repositories/role.repository";
import { success, fail, badRequest, notFound } from "../utils/response";

const app = new Hono<{ Bindings: Env; Variables: Variables }>();

// 中间件：创建服务实例并注入到上下文
app.use("/*", async (c, next) => {
	const userRepo = new UserRepository(c.env.DB);
	const userRoleRepo = new UserRoleRepository(c.env.DB);
	const roleRepo = new RoleRepository(c.env.DB);
	const userService = new UserService(userRepo, userRoleRepo, roleRepo);
	c.set("userService", userService);
	await next();
});

// 获取用户列表
app.get("/", async (c) => {
	try {
		const userService = c.get("userService") as UserService;
		const users = await userService.findAll();
		return c.json(success(users));
	} catch (e: any) {
		return c.json(fail(500, e.message));
	}
});

// 获取单个用户
app.get("/:id", async (c) => {
	try {
		const id = parseInt(c.req.param("id"));
		if (isNaN(id)) {
			return c.json(badRequest("无效的用户 ID"));
		}

		const userService = c.get("userService") as UserService;
		const user = await userService.findById(id);
		return c.json(success(user));
	} catch (e: any) {
		if (e.message === "用户不存在") {
			return c.json(notFound(e.message));
		}
		return c.json(fail(500, e.message));
	}
});

// 创建用户
app.post("/", async (c) => {
	try {
		const data = await c.req.json();
		const userService = c.get("userService") as UserService;
		const userId = await userService.create(data);
		return c.json(success({ userId }, "创建成功"));
	} catch (e: any) {
		if (e.message.includes("不能为空") || e.message.includes("已存在")) {
			return c.json(badRequest(e.message));
		}
		return c.json(fail(500, e.message));
	}
});

// 更新用户
app.put("/:id", async (c) => {
	try {
		const id = parseInt(c.req.param("id"));
		if (isNaN(id)) {
			return c.json(badRequest("无效的用户 ID"));
		}

		const data = await c.req.json();
		const userService = c.get("userService") as UserService;
		await userService.update(id, data);
		return c.json(success(null, "更新成功"));
	} catch (e: any) {
		if (e.message === "用户不存在") {
			return c.json(notFound(e.message));
		}
		if (e.message.includes("不能修改") || e.message.includes("已存在")) {
			return c.json(fail(400, e.message));
		}
		return c.json(fail(500, e.message));
	}
});

// 删除用户
app.delete("/:id", async (c) => {
	try {
		const id = parseInt(c.req.param("id"));
		if (isNaN(id)) {
			return c.json(badRequest("无效的用户 ID"));
		}

		const userService = c.get("userService") as UserService;
		await userService.delete(id);
		return c.json(success(null, "删除成功"));
	} catch (e: any) {
		if (e.message === "用户不存在") {
			return c.json(notFound(e.message));
		}
		if (e.message.includes("不能删除")) {
			return c.json(fail(400, e.message));
		}
		return c.json(fail(500, e.message));
	}
});

export default app;
