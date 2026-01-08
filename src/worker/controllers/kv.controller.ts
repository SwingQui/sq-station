/**
 * KV 存储控制器
 * 处理 KV 键值对存储相关的 HTTP 请求
 */

import { Hono } from "hono";
import type { Env, Variables } from "../index.d";
import { success, fail } from "../utils/response";
import { authMiddleware } from "../middleware/auth";
import { requirePermission } from "../middleware/permission";
import { Permission } from "../constants/permissions";

const app = new Hono<{ Bindings: Env; Variables: Variables }>();

// 认证中间件：所有路由需要认证
app.use("*", authMiddleware);

// 获取单个 key 的值
app.get("/:key", requirePermission(Permission.SYSTEM_SQL_QUERY), async (c) => {
	try {
		const key = c.req.param("key");
		const value = await c.env.KV_BINDING.get(key);
		if (value === null) {
			return c.json(fail(404, "Key 不存在"));
		}
		return c.json(success({ key, value }));
	} catch (e: any) {
		return c.json(fail(500, e.message));
	}
});

// 设置 key 的值
app.put("/:key", requirePermission(Permission.SYSTEM_SQL_QUERY), async (c) => {
	try {
		const key = c.req.param("key");
		const { value } = await c.req.json();
		await c.env.KV_BINDING.put(key, value);
		return c.json(success({ key, value }, "设置成功"));
	} catch (e: any) {
		return c.json(fail(500, e.message));
	}
});

// 删除 key
app.delete("/:key", requirePermission(Permission.SYSTEM_SQL_QUERY), async (c) => {
	try {
		const key = c.req.param("key");
		await c.env.KV_BINDING.delete(key);
		return c.json(success({ key }, "删除成功"));
	} catch (e: any) {
		return c.json(fail(500, e.message));
	}
});

// 列出所有 keys
app.get("/", requirePermission(Permission.SYSTEM_SQL_QUERY), async (c) => {
	try {
		const list = await c.env.KV_BINDING.list();
		return c.json(success(list.keys));
	} catch (e: any) {
		return c.json(fail(500, e.message));
	}
});

export default app;
