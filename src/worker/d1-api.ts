import { Hono } from "hono";
import type { Env } from "./index.d";

const d1Api = new Hono<{ Bindings: Env }>();

// ====================================
// 用户管理 API
// ====================================

// 获取用户列表
d1Api.get("/api/users", async (c) => {
	const { results } = await c.env.DB.prepare(
		"SELECT id, username, nickname, email, phone, avatar, status, remark, created_at FROM sys_user ORDER BY id"
	).all();
	return c.json({ users: results });
});

// 获取单个用户
d1Api.get("/api/users/:id", async (c) => {
	const id = c.req.param("id");
	const user = await c.env.DB.prepare(
		"SELECT id, username, nickname, email, phone, avatar, status, remark, created_at FROM sys_user WHERE id = ?"
	).bind(id).first();
	if (!user) return c.json({ error: "用户不存在" }, 404);
	return c.json({ user });
});

// 创建用户
d1Api.post("/api/users", async (c) => {
	const { username, password, nickname, email, phone, avatar, status, remark } = await c.req.json();
	if (!username || !password) {
		return c.json({ error: "用户名和密码不能为空" }, 400);
	}
	try {
		const result = await c.env.DB.prepare(
			"INSERT INTO sys_user (username, password, nickname, email, phone, avatar, status, remark) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
		).bind(username, password, nickname || null, email || null, phone || null, avatar || null, status ?? 1, remark || null).run();
		return c.json({ success: true, userId: result.meta.last_row_id });
	} catch (e: any) {
		return c.json({ error: e.message }, 400);
	}
});

// 更新用户
d1Api.put("/api/users/:id", async (c) => {
	const id = c.req.param("id");
	const { username, password, nickname, email, phone, avatar, status, remark } = await c.req.json();
	try {
		await c.env.DB.prepare(
			"UPDATE sys_user SET username = ?, password = ?, nickname = ?, email = ?, phone = ?, avatar = ?, status = ?, remark = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
		).bind(username, password, nickname || null, email || null, phone || null, avatar || null, status ?? 1, remark || null, id).run();
		return c.json({ success: true });
	} catch (e: any) {
		return c.json({ error: e.message }, 400);
	}
});

// 删除用户
d1Api.delete("/api/users/:id", async (c) => {
	const id = c.req.param("id");
	if (id === "1") {
		return c.json({ error: "不能删除超级管理员" }, 400);
	}
	await c.env.DB.prepare("DELETE FROM sys_user WHERE id = ?").bind(id).run();
	return c.json({ success: true });
});

// ====================================
// 角色管理 API
// ====================================

// 获取角色列表
d1Api.get("/api/roles", async (c) => {
	const { results } = await c.env.DB.prepare(
		"SELECT * FROM sys_role ORDER BY sort_order"
	).all();
	return c.json({ roles: results });
});

// 获取单个角色
d1Api.get("/api/roles/:id", async (c) => {
	const id = c.req.param("id");
	const role = await c.env.DB.prepare(
		"SELECT * FROM sys_role WHERE id = ?"
	).bind(id).first();
	if (!role) return c.json({ error: "角色不存在" }, 404);
	return c.json({ role });
});

// 创建角色
d1Api.post("/api/roles", async (c) => {
	const { role_name, role_key, sort_order, status, remark } = await c.req.json();
	if (!role_name || !role_key) {
		return c.json({ error: "角色名称和权限标识不能为空" }, 400);
	}
	try {
		const result = await c.env.DB.prepare(
			"INSERT INTO sys_role (role_name, role_key, sort_order, status, remark) VALUES (?, ?, ?, ?, ?)"
		).bind(role_name, role_key, sort_order ?? 0, status ?? 1, remark || null).run();
		return c.json({ success: true, roleId: result.meta.last_row_id });
	} catch (e: any) {
		return c.json({ error: e.message }, 400);
	}
});

// 更新角色
d1Api.put("/api/roles/:id", async (c) => {
	const id = c.req.param("id");
	const { role_name, role_key, sort_order, status, remark } = await c.req.json();
	try {
		await c.env.DB.prepare(
			"UPDATE sys_role SET role_name = ?, role_key = ?, sort_order = ?, status = ?, remark = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
		).bind(role_name, role_key, sort_order ?? 0, status ?? 1, remark || null, id).run();
		return c.json({ success: true });
	} catch (e: any) {
		return c.json({ error: e.message }, 400);
	}
});

// 删除角色
d1Api.delete("/api/roles/:id", async (c) => {
	const id = c.req.param("id");
	if (id === "1") {
		return c.json({ error: "不能删除超级管理员角色" }, 400);
	}
	await c.env.DB.prepare("DELETE FROM sys_role WHERE id = ?").bind(id).run();
	return c.json({ success: true });
});

// ====================================
// 菜单管理 API
// ====================================

// 获取菜单列表 (树形结构)
d1Api.get("/api/menus", async (c) => {
	const { results } = await c.env.DB.prepare(
		"SELECT * FROM sys_menu ORDER BY sort_order"
	).all();

	// 构建树形结构
	const buildTree = (parentId: number = 0): any[] => {
		return results
			.filter((m: any) => m.parent_id === parentId)
			.map((m: any) => ({
				...m,
				children: buildTree(m.id)
			}));
	};

	return c.json({ menus: buildTree() });
});

// 获取单个菜单
d1Api.get("/api/menus/:id", async (c) => {
	const id = c.req.param("id");
	const menu = await c.env.DB.prepare(
		"SELECT * FROM sys_menu WHERE id = ?"
	).bind(id).first();
	if (!menu) return c.json({ error: "菜单不存在" }, 404);
	return c.json({ menu });
});

// 创建菜单
d1Api.post("/api/menus", async (c) => {
	const { parent_id, menu_name, menu_type, route_path, component_path, redirect, query_param, is_frame, is_cache, menu_visible, menu_status, icon, sort_order, permission } = await c.req.json();
	if (!menu_name || !menu_type) {
		return c.json({ error: "菜单名称和类型不能为空" }, 400);
	}
	try {
		const result = await c.env.DB.prepare(
			"INSERT INTO sys_menu (parent_id, menu_name, menu_type, route_path, component_path, redirect, query_param, is_frame, is_cache, menu_visible, menu_status, icon, sort_order, permission) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
		).bind(
			parent_id ?? 0,
			menu_name,
			menu_type,
			route_path || null,
			component_path || null,
			redirect || null,
			query_param || null,
			is_frame ?? 0,
			is_cache ?? 0,
			menu_visible ?? 1,
			menu_status ?? 1,
			icon || null,
			sort_order ?? 0,
			permission || null
		).run();
		return c.json({ success: true, menuId: result.meta.last_row_id });
	} catch (e: any) {
		return c.json({ error: e.message }, 400);
	}
});

// 更新菜单
d1Api.put("/api/menus/:id", async (c) => {
	const id = c.req.param("id");
	const { parent_id, menu_name, menu_type, route_path, component_path, redirect, query_param, is_frame, is_cache, menu_visible, menu_status, icon, sort_order, permission } = await c.req.json();
	try {
		await c.env.DB.prepare(
			"UPDATE sys_menu SET parent_id = ?, menu_name = ?, menu_type = ?, route_path = ?, component_path = ?, redirect = ?, query_param = ?, is_frame = ?, is_cache = ?, menu_visible = ?, menu_status = ?, icon = ?, sort_order = ?, permission = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
		).bind(
			parent_id ?? 0,
			menu_name,
			menu_type,
			route_path || null,
			component_path || null,
			redirect || null,
			query_param || null,
			is_frame ?? 0,
			is_cache ?? 0,
			menu_visible ?? 1,
			menu_status ?? 1,
			icon || null,
			sort_order ?? 0,
			permission || null,
			id
		).run();
		return c.json({ success: true });
	} catch (e: any) {
		return c.json({ error: e.message }, 400);
	}
});

// 删除菜单
d1Api.delete("/api/menus/:id", async (c) => {
	const id = c.req.param("id");
	// 检查是否有子菜单
	const { count } = await c.env.DB.prepare(
		"SELECT COUNT(*) as count FROM sys_menu WHERE parent_id = ?"
	).bind(id).first() as any;
	if (count > 0) {
		return c.json({ error: "存在子菜单，无法删除" }, 400);
	}
	await c.env.DB.prepare("DELETE FROM sys_menu WHERE id = ?").bind(id).run();
	return c.json({ success: true });
});

// ====================================
// 用户角色关联 API
// ====================================

// 获取用户的角色列表
d1Api.get("/api/users/:id/roles", async (c) => {
	const id = c.req.param("id");
	const { results } = await c.env.DB.prepare(
		"SELECT r.* FROM sys_role r INNER JOIN sys_user_role ur ON r.id = ur.role_id WHERE ur.user_id = ?"
	).bind(id).all();
	return c.json({ roles: results });
});

// 分配用户角色
d1Api.put("/api/users/:id/roles", async (c) => {
	const id = c.req.param("id");
	const { roleIds } = await c.req.json();
	// 删除现有角色
	await c.env.DB.prepare("DELETE FROM sys_user_role WHERE user_id = ?").bind(id).run();
	// 添加新角色
	for (const roleId of roleIds) {
		await c.env.DB.prepare(
			"INSERT INTO sys_user_role (user_id, role_id) VALUES (?, ?)"
		).bind(id, roleId).run();
	}
	return c.json({ success: true });
});

// ====================================
// 角色菜单关联 API
// ====================================

// 获取角色的菜单列表
d1Api.get("/api/roles/:id/menus", async (c) => {
	const id = c.req.param("id");
	const { results } = await c.env.DB.prepare(
		"SELECT m.* FROM sys_menu m INNER JOIN sys_role_menu rm ON m.id = rm.menu_id WHERE rm.role_id = ? ORDER BY m.sort_order"
	).bind(id).all();
	return c.json({ menus: results });
});

// 分配角色菜单
d1Api.put("/api/roles/:id/menus", async (c) => {
	const id = c.req.param("id");
	const { menuIds } = await c.req.json();
	// 删除现有菜单
	await c.env.DB.prepare("DELETE FROM sys_role_menu WHERE role_id = ?").bind(id).run();
	// 添加新菜单
	for (const menuId of menuIds) {
		await c.env.DB.prepare(
			"INSERT INTO sys_role_menu (role_id, menu_id) VALUES (?, ?)"
		).bind(id, menuId).run();
	}
	return c.json({ success: true });
});

// ====================================
// 权限验证 API (根据用户获取可用菜单)
// ====================================

// 获取用户的菜单权限 (树形结构)
d1Api.get("/api/user/:id/menus", async (c) => {
	const id = c.req.param("id");
	const { results } = await c.env.DB.prepare(
		`SELECT DISTINCT m.* FROM sys_menu m
		 INNER JOIN sys_role_menu rm ON m.id = rm.menu_id
		 INNER JOIN sys_user_role ur ON rm.role_id = ur.role_id
		 WHERE ur.user_id = ? AND m.menu_status = 1
		 ORDER BY m.sort_order`
	).bind(id).all();

	// 构建树形结构
	const buildTree = (parentId: number = 0): any[] => {
		return results
			.filter((m: any) => m.parent_id === parentId)
			.map((m: any) => ({
				...m,
				children: buildTree(m.id)
			}));
	};

	return c.json({ menus: buildTree() });
});

// 验证用户权限
d1Api.get("/api/user/:id/permissions", async (c) => {
	const id = c.req.param("id");
	const { results } = await c.env.DB.prepare(
		`SELECT DISTINCT m.permission FROM sys_menu m
		 INNER JOIN sys_role_menu rm ON m.id = rm.menu_id
		 INNER JOIN sys_user_role ur ON rm.role_id = ur.role_id
		 WHERE ur.user_id = ? AND m.permission IS NOT NULL AND m.permission != ''`
	).bind(id).all();
	const permissions = results.map((r: any) => r.permission);
	return c.json({ permissions });
});

export default d1Api;
