import { Hono } from "hono";
import type { Env } from "../index.d";

const app = new Hono<{ Bindings: Env }>();

// 获取用户的角色列表
app.get("/:id/roles", async (c) => {
	const id = c.req.param("id");
	const { results } = await c.env.DB.prepare(
		"SELECT r.* FROM sys_role r INNER JOIN sys_user_role ur ON r.id = ur.role_id WHERE ur.user_id = ?"
	).bind(id).all();
	return c.json({ roles: results });
});

// 分配用户角色
app.put("/:id/roles", async (c) => {
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

export default app;
