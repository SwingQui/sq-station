import { Hono } from "hono";
import type { Env } from "./index.d";

const app = new Hono<{ Bindings: Env }>();

app.get("/api/", (c) => c.json({ name: "Cloudflare" }));

// KV 测试接口
app.get("/api/kv/:key", async (c) => {
	const key = c.req.param("key");
	const value = await c.env.KV_BINDING.get(key);
	return c.json({ key, value });
});

app.put("/api/kv/:key", async (c) => {
	const key = c.req.param("key");
	const { value } = await c.req.json();
	await c.env.KV_BINDING.put(key, value);
	return c.json({ success: true, key, value });
});

app.delete("/api/kv/:key", async (c) => {
	const key = c.req.param("key");
	await c.env.KV_BINDING.delete(key);
	return c.json({ success: true, key });
});

app.get("/api/kv", async (c) => {
	const list = await c.env.KV_BINDING.list();
	return c.json({ keys: list.keys });
});

// 从远程 KV 缓存所有数据到本地（仅在远程模式可用）
app.post("/api/kv/sync", async (c) => {
	const list = await c.env.KV_BINDING.list();
	const results: { key: string; value: string | null }[] = [];

	for (const key of list.keys) {
		const value = await c.env.KV_BINDING.get(key.name);
		results.push({ key: key.name, value });
	}

	return c.json({
		message: "同步成功",
		count: results.length,
		data: results,
	});
});

export default app;
