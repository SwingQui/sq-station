import { Hono } from "hono";
import type { Env } from "./index.d";
import d1Api from "./d1-api";

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

// SQL 执行工具 API (支持所有 SQL 操作)
app.post("/api/sql/query", async (c) => {
	const { sql } = await c.req.json();
	if (!sql || typeof sql !== "string") {
		return c.json({ error: "SQL 语句不能为空" }, 400);
	}

	try {
		// 判断是否为 SELECT 查询
		const isSelect = sql.trim().toUpperCase().startsWith("SELECT");

		if (isSelect) {
			// SELECT 查询：返回结果集
			const result = await c.env.DB.prepare(sql).all();

			// 提取列名（从第一行的键）
			const columns = result.results.length > 0
				? Object.keys(result.results[0])
				: [];

			// 转换数据为二维数组
			const rows = result.results.map((row: any) =>
				columns.map((col) => row[col])
			);

			return c.json({
				columns,
				rows,
			});
		} else {
			// INSERT/UPDATE/DELETE/CREATE/DROP 等：返回执行结果
			const result = await c.env.DB.prepare(sql).run();

			return c.json({
				success: true,
				message: "执行成功",
				changes: result.meta.changes,
				last_row_id: result.meta.last_row_id,
			});
		}
	} catch (e: any) {
		return c.json({ error: e.message || "执行失败" }, 400);
	}
});

// 挂载 D1 权限系统 API
app.route("/", d1Api);

export default app;
