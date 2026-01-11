/**
 * Bookmarks 书签数据控制器
 * 处理书签配置的读写操作
 */

import { Hono } from "hono";
import type { Env, Variables } from "../index.d";
import { success, fail } from "../utils/response";
import { authMiddleware } from "../middleware/auth";
import { requirePermission } from "../middleware/permission";
import { Permission } from "../constants/permissions";

const app = new Hono<{ Bindings: Env; Variables: Variables }>();

/**
 * GET /api/frontend/bookmarks/config
 * 获取 Bookmarks 配置
 * 公开接口，前台页面直接访问（不需要认证）
 */
app.get("/config", async (c) => {
	try {
		const key = "bookmarks:config";
		const value = await c.env.KV_BINDING.get(key);

		if (value === null) {
			// 返回空配置对象
			return c.json(success({}, "未找到配置"));
		}

		// 解析 JSON
		const config = JSON.parse(value);
		return c.json(success(config));
	} catch (e: any) {
		console.error("[Bookmarks] 获取配置失败:", e);
		return c.json(fail(500, e.message || "获取配置失败"));
	}
});

// 认证中间件：以下路由需要认证
app.use("/config", authMiddleware);

/**
 * PUT /api/frontend/bookmarks/config
 * 保存 Bookmarks 配置
 * 需要前台配置权限
 */
app.put("/config", requirePermission(Permission.FRONTEND_BOOKMARKS_UPDATE), async (c) => {
	try {
		const { config } = await c.req.json();

		if (!config || typeof config !== "object") {
			return c.json(fail(400, "配置数据格式无效"));
		}

		const key = "bookmarks:config";
		const value = JSON.stringify(config);

		// 保存到 KV
		await c.env.KV_BINDING.put(key, value);

		return c.json(success({ key, config }, "保存成功"));
	} catch (e: any) {
		console.error("[Bookmarks] 保存配置失败:", e);
		return c.json(fail(500, e.message || "保存配置失败"));
	}
});

export default app;
