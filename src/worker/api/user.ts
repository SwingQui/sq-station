import { Hono } from "hono";
import type { Env } from "../index.d";

const app = new Hono<{ Bindings: Env }>();

// 获取用户列表
app.get("/", async (c) => {
	const { results } = await c.env.DB.prepare(
		"SELECT id, username, nickname, email, phone, avatar, status, remark, created_at FROM sys_user ORDER BY id"
	).all();
	return c.json({ users: results });
});

// 获取单个用户
app.get("/:id", async (c) => {
	const id = c.req.param("id");
	const user = await c.env.DB.prepare(
		"SELECT id, username, nickname, email, phone, avatar, status, remark, created_at FROM sys_user WHERE id = ?"
	).bind(id).first();
	if (!user) return c.json({ error: "用户不存在" }, 404);
	return c.json({ user });
});

// 创建用户
app.post("/", async (c) => {
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
app.put("/:id", async (c) => {
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
app.delete("/:id", async (c) => {
	const id = c.req.param("id");
	if (id === "1") {
		return c.json({ error: "不能删除超级管理员" }, 400);
	}
	await c.env.DB.prepare("DELETE FROM sys_user WHERE id = ?").bind(id).run();
	return c.json({ success: true });
});

export default app;
