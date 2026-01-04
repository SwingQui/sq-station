/**
 * 权限控制器
 * 处理用户权限查询相关的 HTTP 请求
 */

import { Hono } from "hono";
import type { Env, Variables } from "../index.d";
import { MenuService } from "../services/menu.service";
import { UserRepository } from "../repositories/user.repository";
import { MenuRepository } from "../repositories/menu.repository";
import { success, fail, badRequest, notFound } from "../utils/response";

const app = new Hono<{ Bindings: Env; Variables: Variables }>();

// 中间件：创建服务实例并注入到上下文
app.use("/*", async (c, next) => {
	const userRepo = new UserRepository(c.env.DB);
	const menuRepo = new MenuRepository(c.env.DB);
	const menuService = new MenuService(menuRepo);
	c.set("menuService", menuService);
	c.set("userRepo", userRepo);
	await next();
});

// 获取用户的菜单权限（树形结构）
app.get("/:id/menus", async (c) => {
	try {
		const id = parseInt(c.req.param("id"));
		if (isNaN(id)) {
			return c.json(badRequest("无效的用户 ID"));
		}

		const userRepo = c.get("userRepo") as UserRepository;
		const user = await userRepo.findById(id);
		if (!user) {
			return c.json(notFound("用户不存在"));
		}

		const menuService = c.get("menuService") as MenuService;
		const isAdmin = id === 1 || user.username === "admin";
		const menus = await menuService.findByUserIdTree(id, isAdmin);

		return c.json(success(menus));
	} catch (e: any) {
		return c.json(fail(500, e.message));
	}
});

// 获取用户的权限标识列表
app.get("/:id/permissions", async (c) => {
	try {
		const id = parseInt(c.req.param("id"));
		if (isNaN(id)) {
			return c.json(badRequest("无效的用户 ID"));
		}

		const userRepo = c.get("userRepo") as UserRepository;
		const user = await userRepo.findById(id);
		if (!user) {
			return c.json(notFound("用户不存在"));
		}

		const menuService = c.get("menuService") as MenuService;
		const isAdmin = id === 1 || user.username === "admin";
		const permissions = await menuService.findPermissionsByUserId(id, isAdmin);

		return c.json(success(permissions));
	} catch (e: any) {
		return c.json(fail(500, e.message));
	}
});

export default app;
