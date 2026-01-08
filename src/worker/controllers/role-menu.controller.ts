/**
 * 角色菜单关联控制器
 * 处理角色菜单分配相关的 HTTP 请求
 */

import { Hono } from "hono";
import type { Env, Variables } from "../index.d";
import { RoleMenuService } from "../services/role-menu.service";
import { RoleRepository } from "../repositories/role.repository";
import { MenuRepository } from "../repositories/menu.repository";
import { RoleMenuRepository } from "../repositories/role-menu.repository";
import { success, fail, badRequest, notFound } from "../utils/response";
import { authMiddleware } from "../middleware/auth";
import { requirePermission } from "../middleware/permission";
import { Permission } from "../constants/permissions";

const app = new Hono<{ Bindings: Env; Variables: Variables }>();

// 认证中间件：所有路由需要认证
app.use("*", authMiddleware);

// 中间件：创建服务实例并注入到上下文
app.use("/*", async (c, next) => {
	const roleRepo = new RoleRepository(c.env.DB);
	const menuRepo = new MenuRepository(c.env.DB);
	const roleMenuRepo = new RoleMenuRepository(c.env.DB);
	const roleMenuService = new RoleMenuService(roleRepo, menuRepo, roleMenuRepo);
	c.set("roleMenuService", roleMenuService);
	await next();
});

// 获取角色的菜单列表
app.get("/:id/menus", requirePermission(Permission.SYSTEM_ROLE_READ), async (c) => {
	try {
		const id = parseInt(c.req.param("id"));
		if (isNaN(id)) {
			return c.json(badRequest("无效的角色 ID"));
		}

		const roleMenuService = c.get("roleMenuService") as RoleMenuService;
		const menus = await roleMenuService.getMenusByRoleId(id);
		return c.json(success(menus));
	} catch (e: any) {
		if (e.message === "角色不存在") {
			return c.json(notFound(e.message));
		}
		return c.json(fail(500, e.message));
	}
});

// 获取角色的菜单 ID 列表
app.get("/:id/menuIds", requirePermission(Permission.SYSTEM_ROLE_READ), async (c) => {
	try {
		const id = parseInt(c.req.param("id"));
		if (isNaN(id)) {
			return c.json(badRequest("无效的角色 ID"));
		}

		const roleMenuService = c.get("roleMenuService") as RoleMenuService;
		const menuIds = await roleMenuService.getMenuIdsByRoleId(id);
		return c.json(success(menuIds));
	} catch (e: any) {
		if (e.message === "角色不存在") {
			return c.json(notFound(e.message));
		}
		return c.json(fail(500, e.message));
	}
});

// 为角色分配菜单
app.put("/:id/menus", requirePermission(Permission.SYSTEM_ROLE_ASSIGN_MENUS), async (c) => {
	try {
		const id = parseInt(c.req.param("id"));
		if (isNaN(id)) {
			return c.json(badRequest("无效的角色 ID"));
		}

		const { menuIds } = await c.req.json();
		if (!Array.isArray(menuIds)) {
			return c.json(badRequest("菜单 ID 必须是数组"));
		}

		const roleMenuService = c.get("roleMenuService") as RoleMenuService;
		await roleMenuService.assignMenus(id, menuIds);
		return c.json(success(null, "分配成功"));
	} catch (e: any) {
		if (e.message === "角色不存在") {
			return c.json(notFound(e.message));
		}
		if (e.message.includes("不存在")) {
			return c.json(fail(400, e.message));
		}
		return c.json(fail(500, e.message));
	}
});

export default app;
