import { Hono } from "hono";
import type { Env } from "../index.d";
import { success, fail } from "../utils/response";

const app = new Hono<{ Bindings: Env }>();

// 获取角色的菜单列表
app.get("/:id/menus", async (c) => {
	try {
		const id = c.req.param("id");
		const { results } = await c.env.DB.prepare(
			"SELECT m.* FROM sys_menu m INNER JOIN sys_role_menu rm ON m.id = rm.menu_id WHERE rm.role_id = ? ORDER BY m.sort_order"
		).bind(id).all();
		return c.json(success(results));
	} catch (e: any) {
		return c.json(fail(500, e.message));
	}
});

// 分配角色菜单
app.put("/:id/menus", async (c) => {
	try {
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
		return c.json(success(null, "分配成功"));
	} catch (e: any) {
		return c.json(fail(500, e.message));
	}
});

export default app;
