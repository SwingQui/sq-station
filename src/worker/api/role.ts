import { Hono } from "hono";
import type { Env } from "../index.d";
import { success, fail, badRequest, notFound } from "../utils/response";

const app = new Hono<{ Bindings: Env }>();

// 获取角色列表
app.get("/", async (c) => {
	try {
		const { results } = await c.env.DB.prepare(
			"SELECT * FROM sys_role ORDER BY sort_order"
		).all();
		return c.json(success(results));
	} catch (e: any) {
		return c.json(fail(500, e.message));
	}
});

// 获取单个角色
app.get("/:id", async (c) => {
	try {
		const id = c.req.param("id");
		const role = await c.env.DB.prepare(
			"SELECT * FROM sys_role WHERE id = ?"
		).bind(id).first();
		if (!role) return c.json(notFound("角色不存在"));
		return c.json(success(role));
	} catch (e: any) {
		return c.json(fail(500, e.message));
	}
});

// 创建角色
app.post("/", async (c) => {
	try {
		const { role_name, role_key, sort_order, status, remark } = await c.req.json();
		if (!role_name || !role_key) {
			return c.json(badRequest("角色名称和权限标识不能为空"));
		}
		const result = await c.env.DB.prepare(
			"INSERT INTO sys_role (role_name, role_key, sort_order, status, remark) VALUES (?, ?, ?, ?, ?)"
		).bind(role_name, role_key, sort_order ?? 0, status ?? 1, remark || null).run();
		return c.json(success({ roleId: result.meta.last_row_id }, "创建成功"));
	} catch (e: any) {
		return c.json(fail(500, e.message));
	}
});

// 更新角色
app.put("/:id", async (c) => {
	try {
		const id = c.req.param("id");
		const { role_name, role_key, sort_order, status, remark } = await c.req.json();
		await c.env.DB.prepare(
			"UPDATE sys_role SET role_name = ?, role_key = ?, sort_order = ?, status = ?, remark = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
		).bind(role_name, role_key, sort_order ?? 0, status ?? 1, remark || null, id).run();
		return c.json(success(null, "更新成功"));
	} catch (e: any) {
		return c.json(fail(500, e.message));
	}
});

// 删除角色
app.delete("/:id", async (c) => {
	try {
		const id = c.req.param("id");
		if (id === "1") {
			return c.json(fail(400, "不能删除超级管理员角色"));
		}
		await c.env.DB.prepare("DELETE FROM sys_role WHERE id = ?").bind(id).run();
		return c.json(success(null, "删除成功"));
	} catch (e: any) {
		return c.json(fail(500, e.message));
	}
});

export default app;
