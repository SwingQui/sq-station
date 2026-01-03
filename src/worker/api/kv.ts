import { Hono } from "hono";
import type { Env } from "../index.d";
import { success, fail } from "../utils/response";

const app = new Hono<{ Bindings: Env }>();

// 获取单个key的值
app.get("/:key", async (c) => {
	try {
		const key = c.req.param("key");
		const value = await c.env.KV_BINDING.get(key);
		if (value === null) {
			return c.json(fail(404, "Key不存在"));
		}
		return c.json(success({ key, value }));
	} catch (e: any) {
		return c.json(fail(500, e.message));
	}
});

// 设置key的值
app.put("/:key", async (c) => {
	try {
		const key = c.req.param("key");
		const { value } = await c.req.json();
		await c.env.KV_BINDING.put(key, value);
		return c.json(success({ key, value }, "设置成功"));
	} catch (e: any) {
		return c.json(fail(500, e.message));
	}
});

// 删除key
app.delete("/:key", async (c) => {
	try {
		const key = c.req.param("key");
		await c.env.KV_BINDING.delete(key);
		return c.json(success({ key }, "删除成功"));
	} catch (e: any) {
		return c.json(fail(500, e.message));
	}
});

// 列出所有keys
app.get("/", async (c) => {
	try {
		const list = await c.env.KV_BINDING.list();
		return c.json(success(list.keys));
	} catch (e: any) {
		return c.json(fail(500, e.message));
	}
});

export default app;
