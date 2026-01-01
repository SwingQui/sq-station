import { Hono } from "hono";
import type { Env } from "../index.d";

const app = new Hono<{ Bindings: Env }>();

// 获取菜单列表 (树形结构)
app.get("/", async (c) => {
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
app.get("/:id", async (c) => {
	const id = c.req.param("id");
	const menu = await c.env.DB.prepare(
		"SELECT * FROM sys_menu WHERE id = ?"
	).bind(id).first();
	if (!menu) return c.json({ error: "菜单不存在" }, 404);
	return c.json({ menu });
});

// 创建菜单
app.post("/", async (c) => {
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
app.put("/:id", async (c) => {
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
app.delete("/:id", async (c) => {
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

export default app;
