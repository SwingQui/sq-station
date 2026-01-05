/**
 * 菜单控制器
 * 处理菜单相关的 HTTP 请求和响应
 */

import { Hono } from "hono";
import type { Env, Variables } from "../index.d";
import { MenuService } from "../services/menu.service";
import { MenuRepository } from "../repositories/menu.repository";
import { success, fail, badRequest, notFound } from "../utils/response";
import { requirePermission, requireAnyPermission } from "../middleware/permission";
import { Permission } from "../constants/permissions";

const app = new Hono<{ Bindings: Env; Variables: Variables }>();

// 中间件：创建服务实例并注入到上下文
app.use("/*", async (c, next) => {
	const menuRepo = new MenuRepository(c.env.DB);
	const menuService = new MenuService(menuRepo);
	c.set("menuService", menuService);
	await next();
});

// 获取菜单列表（需要权限）
app.get("/", requirePermission(Permission.SYSTEM_MENU_LIST), async (c) => {
	try {
		const menuService = c.get("menuService") as MenuService;
		const menus = await menuService.findAllTree();
		return c.json(success(menus));
	} catch (e: any) {
		return c.json(fail(500, e.message));
	}
});

// 获取单个菜单（需要权限）
app.get("/:id", requireAnyPermission([Permission.SYSTEM_MENU_LIST, Permission.SYSTEM_MENU_VIEW]), async (c) => {
	try {
		const id = parseInt(c.req.param("id"));
		if (isNaN(id)) {
			return c.json(badRequest("无效的菜单 ID"));
		}

		const menuService = c.get("menuService") as MenuService;
		const menu = await menuService.findById(id);
		return c.json(success(menu));
	} catch (e: any) {
		if (e.message === "菜单不存在") {
			return c.json(notFound(e.message));
		}
		return c.json(fail(500, e.message));
	}
});

// 创建菜单（需要权限）
app.post("/", requirePermission(Permission.SYSTEM_MENU_ADD), async (c) => {
	try {
		const data = await c.req.json();
		const menuService = c.get("menuService") as MenuService;
		const menuId = await menuService.create(data);
		return c.json(success({ menuId }, "创建成功"));
	} catch (e: any) {
		if (e.message.includes("不能为空") || e.message.includes("不存在")) {
			return c.json(badRequest(e.message));
		}
		return c.json(fail(500, e.message));
	}
});

// 更新菜单（需要权限）
app.put("/:id", requirePermission(Permission.SYSTEM_MENU_EDIT), async (c) => {
	try {
		const id = parseInt(c.req.param("id"));
		if (isNaN(id)) {
			return c.json(badRequest("无效的菜单 ID"));
		}

		const data = await c.req.json();
		const menuService = c.get("menuService") as MenuService;
		await menuService.update(id, data);
		return c.json(success(null, "更新成功"));
	} catch (e: any) {
		if (e.message === "菜单不存在") {
			return c.json(notFound(e.message));
		}
		if (e.message.includes("不存在") || e.message.includes("不能将")) {
			return c.json(fail(400, e.message));
		}
		return c.json(fail(500, e.message));
	}
});

// 删除菜单（需要权限）
app.delete("/:id", requirePermission(Permission.SYSTEM_MENU_DELETE), async (c) => {
	try {
		const id = parseInt(c.req.param("id"));
		if (isNaN(id)) {
			return c.json(badRequest("无效的菜单 ID"));
		}

		const menuService = c.get("menuService") as MenuService;
		await menuService.delete(id);
		return c.json(success(null, "删除成功"));
	} catch (e: any) {
		if (e.message === "菜单不存在") {
			return c.json(notFound(e.message));
		}
		if (e.message.includes("存在子菜单")) {
			return c.json(fail(400, e.message));
		}
		return c.json(fail(500, e.message));
	}
});

export default app;
