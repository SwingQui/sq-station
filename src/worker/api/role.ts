import { Hono } from "hono";
import type { Env } from "../index.d";

const app = new Hono<{ Bindings: Env }>();

// 获取角色列表
app.get("/", async (c) => {
	const { results } = await c.env.DB.prepare(
		"SELECT * FROM sys_role ORDER BY sort_order"
	).all();
	return c.json({ roles: results });
});

// 获取单个角色
app.get("/:id", async (c) => {
	const id = c.req.param("id");
	const role = await c.env.DB.prepare(
		"SELECT * FROM sys_role WHERE id = ?"
	).bind(id).first();
	if (!role) return c.json({ error: "角色不存在" }, 404);
	return c.json({ role });
});

// 创建角色
app.post("/", async (c) => {
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
app.put("/:id", async (c) => {
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
app.delete("/:id", async (c) => {
	const id = c.req.param("id");
	if (id === "1") {
		return c.json({ error: "不能删除超级管理员角色" }, 400);
	}
	await c.env.DB.prepare("DELETE FROM sys_role WHERE id = ?").bind(id).run();
	return c.json({ success: true });
});

export default app;
