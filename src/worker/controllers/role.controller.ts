/**
 * 角色控制器
 * 处理角色相关的 HTTP 请求和响应
 */

import { Hono } from "hono";
import type { Env, Variables } from "../index.d";
import { RoleService } from "../services/role.service";
import { RoleRepository } from "../repositories/role.repository";
import { RoleMenuRepository } from "../repositories/role-menu.repository";
import { success, fail, badRequest, notFound } from "../utils/response";
import { requirePermission, requireAnyPermission } from "../middleware/permission";
import { Permission } from "../constants/permissions";

const app = new Hono<{ Bindings: Env; Variables: Variables }>();

// 中间件：创建服务实例并注入到上下文
app.use("/*", async (c, next) => {
	const roleRepo = new RoleRepository(c.env.DB);
	const roleMenuRepo = new RoleMenuRepository(c.env.DB);
	const roleService = new RoleService(roleRepo, roleMenuRepo);
	c.set("roleService", roleService);
	await next();
});

// 获取角色列表（需要权限）
app.get("/", requirePermission(Permission.SYSTEM_ROLE_READ), async (c) => {
	try {
		const roleService = c.get("roleService") as RoleService;
		const roles = await roleService.findAll();
		return c.json(success(roles));
	} catch (e: any) {
		return c.json(fail(500, e.message));
	}
});

// 获取单个角色（需要权限）
app.get("/:id", requireAnyPermission([Permission.SYSTEM_ROLE_READ, Permission.SYSTEM_ROLE_READ]), async (c) => {
	try {
		const id = parseInt(c.req.param("id"));
		if (isNaN(id)) {
			return c.json(badRequest("无效的角色 ID"));
		}

		const roleService = c.get("roleService") as RoleService;
		const role = await roleService.findById(id);
		return c.json(success(role));
	} catch (e: any) {
		if (e.message === "角色不存在") {
			return c.json(notFound(e.message));
		}
		return c.json(fail(500, e.message));
	}
});

// 创建角色（需要权限）
app.post("/", requirePermission(Permission.SYSTEM_ROLE_CREATE), async (c) => {
	try {
		const data = await c.req.json();
		const roleService = c.get("roleService") as RoleService;
		const roleId = await roleService.create(data);
		return c.json(success({ roleId }, "创建成功"));
	} catch (e: any) {
		if (e.message.includes("不能为空") || e.message.includes("已存在")) {
			return c.json(badRequest(e.message));
		}
		return c.json(fail(500, e.message));
	}
});

// 更新角色（需要权限）
app.put("/:id", requirePermission(Permission.SYSTEM_ROLE_UPDATE), async (c) => {
	try {
		const id = parseInt(c.req.param("id"));
		if (isNaN(id)) {
			return c.json(badRequest("无效的角色 ID"));
		}

		const data = await c.req.json();
		const roleService = c.get("roleService") as RoleService;

		// 执行更新
		await roleService.update(id, data);

		return c.json(success(null, "更新成功"));
	} catch (e: any) {
		if (e.message === "角色不存在") {
			return c.json(notFound(e.message));
		}
		if (e.message.includes("不能修改") || e.message.includes("已存在")) {
			return c.json(fail(400, e.message));
		}
		return c.json(fail(500, e.message));
	}
});

// 删除角色（需要权限）
app.delete("/:id", requirePermission(Permission.SYSTEM_ROLE_DELETE), async (c) => {
	try {
		const id = parseInt(c.req.param("id"));
		if (isNaN(id)) {
			return c.json(badRequest("无效的角色 ID"));
		}

		const roleService = c.get("roleService") as RoleService;

		// 获取角色数据（用于验证）
		const role = await roleService.findById(id);
		if (!role) {
			return c.json(notFound("角色不存在"));
		}

		// 执行删除
		await roleService.delete(id);

		return c.json(success(null, "删除成功"));
	} catch (e: any) {
		if (e.message === "角色不存在") {
			return c.json(notFound(e.message));
		}
		if (e.message.includes("不能删除")) {
			return c.json(fail(400, e.message));
		}
		return c.json(fail(500, e.message));
	}
});

export default app;
