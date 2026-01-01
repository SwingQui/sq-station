import { Hono } from "hono";
import type { Env } from "../index.d";

const app = new Hono<{ Bindings: Env }>();

// 获取单个key的值
app.get("/:key", async (c) => {
	const key = c.req.param("key");
	const value = await c.env.KV_BINDING.get(key);
	return c.json({ key, value });
});

// 设置key的值
app.put("/:key", async (c) => {
	const key = c.req.param("key");
	const { value } = await c.req.json();
	await c.env.KV_BINDING.put(key, value);
	return c.json({ success: true, key, value });
});

// 删除key
app.delete("/:key", async (c) => {
	const key = c.req.param("key");
	await c.env.KV_BINDING.delete(key);
	return c.json({ success: true, key });
});

// 列出所有keys
app.get("/", async (c) => {
	const list = await c.env.KV_BINDING.list();
	return c.json({ keys: list.keys });
});

export default app;
