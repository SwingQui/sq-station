import { Hono } from "hono";
import type { Env } from "../index.d";
import { hashPasswordWithUsername } from "../utils/password";
import { success, fail, badRequest, notFound } from "../utils/response";

const app = new Hono<{ Bindings: Env }>();

// 获取用户列表
app.get("/", async (c) => {
	try {
		const { results } = await c.env.DB.prepare(
			"SELECT id, username, nickname, email, phone, avatar, status, remark, created_at FROM sys_user ORDER BY id"
		).all();
		return c.json(success(results));
	} catch (e: any) {
		return c.json(fail(500, e.message));
	}
});

// 获取单个用户
app.get("/:id", async (c) => {
	try {
		const id = c.req.param("id");
		const user = await c.env.DB.prepare(
			"SELECT id, username, nickname, email, phone, avatar, status, remark, created_at FROM sys_user WHERE id = ?"
		).bind(id).first();
		if (!user) return c.json(notFound("用户不存在"));
		return c.json(success(user));
	} catch (e: any) {
		return c.json(fail(500, e.message));
	}
});

// 创建用户
app.post("/", async (c) => {
	try {
		const { username, password, nickname, email, phone, avatar, status, remark } = await c.req.json();
		if (!username || !password) {
			return c.json(badRequest("用户名和密码不能为空"));
		}
		// 加密密码
		const hashedPassword = await hashPasswordWithUsername(password, username);
		const result = await c.env.DB.prepare(
			"INSERT INTO sys_user (username, password, nickname, email, phone, avatar, status, remark) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
		).bind(username, hashedPassword, nickname || null, email || null, phone || null, avatar || null, status ?? 1, remark || null).run();
		return c.json(success({ userId: result.meta.last_row_id }, "创建成功"));
	} catch (e: any) {
		return c.json(fail(500, e.message));
	}
});

// 更新用户
app.put("/:id", async (c) => {
	try {
		const id = c.req.param("id");
		const { username, password, nickname, email, phone, avatar, status, remark } = await c.req.json();
		// 如果提供了密码，则加密并更新
		if (password && password.trim()) {
			const hashedPassword = await hashPasswordWithUsername(password, username);
			await c.env.DB.prepare(
				"UPDATE sys_user SET username = ?, password = ?, nickname = ?, email = ?, phone = ?, avatar = ?, status = ?, remark = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
			).bind(username, hashedPassword, nickname || null, email || null, phone || null, avatar || null, status ?? 1, remark || null, id).run();
		} else {
			// 不更新密码
			await c.env.DB.prepare(
				"UPDATE sys_user SET username = ?, nickname = ?, email = ?, phone = ?, avatar = ?, status = ?, remark = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
			).bind(username, nickname || null, email || null, phone || null, avatar || null, status ?? 1, remark || null, id).run();
		}
		return c.json(success(null, "更新成功"));
	} catch (e: any) {
		return c.json(fail(500, e.message));
	}
});

// 删除用户
app.delete("/:id", async (c) => {
	try {
		const id = c.req.param("id");
		if (id === "1") {
			return c.json(fail(400, "不能删除超级管理员"));
		}
		await c.env.DB.prepare("DELETE FROM sys_user WHERE id = ?").bind(id).run();
		return c.json(success(null, "删除成功"));
	} catch (e: any) {
		return c.json(fail(500, e.message));
	}
});

export default app;
