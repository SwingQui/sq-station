/**
 * 站点工具控制器
 * 处理站点工具的管理和下载
 *
 * 设计说明：
 * - 上传时：原文件名 test.txt → R2保存为 SQTools/windows/test-{timestamp}.txt
 * - 下载时：/api/frontend/tools/download/windows?name=test.txt → 返回 test.txt
 * - 数据库存储：windows_file_name = "test.txt"（原始文件名，不含时间戳）
 */

import { Hono } from "hono";
import type { Env, Variables } from "../index.d";
import { success, fail } from "../utils/response";
import { authMiddleware } from "../middleware/auth";
import { requirePermission } from "../middleware/permission";
import { Permission } from "../constants/permissions";

// 工具记录类型
interface ToolRecord {
	id: number;
	tool_name: string;
	description: string | null;
	icon: string | null;
	windows_file_key: string | null;
	windows_file_name: string | null;
	windows_file_size: number | null;
	android_file_key: string | null;
	android_file_name: string | null;
	android_file_size: number | null;
	sort_order: number;
	status: number;
	created_at: string;
	updated_at: string;
}

const app = new Hono<{ Bindings: Env; Variables: Variables }>();

/**
 * 生成带时间戳的文件名
 * test.txt → test-1709000000000.txt
 */
function generateTimestampedFileName(originalName: string): string {
	const lastDotIndex = originalName.lastIndexOf(".");
	const timestamp = Date.now();

	if (lastDotIndex === -1) {
		return `${originalName}-${timestamp}`;
	}

	const name = originalName.substring(0, lastDotIndex);
	const ext = originalName.substring(lastDotIndex);
	return `${name}-${timestamp}${ext}`;
}

// ==================== 公开接口 ====================

/**
 * GET /api/frontend/tools
 * 获取工具列表（公开访问）
 */
app.get("/", async (c) => {
	try {
		const result = await c.env.DB.prepare(`
			SELECT id, tool_name, description, icon,
				   windows_file_name, windows_file_size,
				   android_file_name, android_file_size,
				   sort_order, status, created_at, updated_at
			FROM sq_tools
			WHERE status = 1
			ORDER BY sort_order ASC, id ASC
		`).all();

		return c.json(success(result.results));
	} catch (e: any) {
		console.error("[Tools] 获取列表失败:", e);
		return c.json(fail(500, e.message || "获取列表失败"));
	}
});

/**
 * GET /api/frontend/tools/download/:platform?name=xxx
 * 下载工具文件（公开访问）
 * 根据原始文件名查找并下载
 */
app.get("/download/:platform", async (c) => {
	try {
		const platform = c.req.param("platform");
		const fileName = c.req.query("name");

		if (!["windows", "android"].includes(platform)) {
			return c.json(fail(400, "无效的平台参数"), 400);
		}

		if (!fileName) {
			return c.json(fail(400, "缺少文件名参数 name"), 400);
		}

		// 根据平台和原始文件名查找工具
		const fileField = platform === "windows"
			? "windows_file_name"
			: "android_file_name";

		const tool = await c.env.DB.prepare(`
			SELECT * FROM sq_tools WHERE ${fileField} = ? AND status = 1
		`).bind(fileName).first<ToolRecord>();

		if (!tool) {
			return c.json(fail(404, "文件不存在"), 404);
		}

		const fileKey = platform === "windows"
			? tool.windows_file_key
			: tool.android_file_key;

		if (!fileKey) {
			return c.json(fail(404, "该平台暂无下载"), 404);
		}

		// 从 R2 获取文件
		const object = await c.env.R2_BINDING.get(fileKey);
		if (!object) {
			return c.json(fail(404, "R2文件不存在"), 404);
		}

		// 返回文件流，使用原始文件名
		const headers = new Headers();
		headers.set("Content-Type", "application/octet-stream");
		headers.set("Content-Disposition", `attachment; filename="${fileName}"`);
		headers.set("Content-Length", String(object.size));

		const data = await object.arrayBuffer();
		return new Response(data, { headers });
	} catch (e: any) {
		console.error("[Tools] 下载失败:", e);
		return c.json(fail(500, e.message || "下载失败"));
	}
});

// ==================== 管理接口（需要认证）====================

/**
 * GET /api/frontend/tools/manage
 * 获取工具列表（管理端，包含所有状态）
 */
app.get("/manage", authMiddleware, requirePermission(Permission.FRONTEND_TOOLS_READ), async (c) => {
	try {
		const result = await c.env.DB.prepare(`
			SELECT * FROM sq_tools
			ORDER BY sort_order ASC, id ASC
		`).all();

		return c.json(success(result.results));
	} catch (e: any) {
		console.error("[Tools] 获取管理列表失败:", e);
		return c.json(fail(500, e.message || "获取列表失败"));
	}
});

/**
 * POST /api/frontend/tools
 * 创建工具（不需要 tool_key，只需要 tool_name）
 */
app.post("/", authMiddleware, requirePermission(Permission.FRONTEND_TOOLS_CREATE), async (c) => {
	try {
		const { tool_name, description, icon, sort_order } = await c.req.json();

		if (!tool_name) {
			return c.json(fail(400, "工具名称不能为空"), 400);
		}

		const result = await c.env.DB.prepare(`
			INSERT INTO sq_tools (tool_name, description, icon, sort_order)
			VALUES (?, ?, ?, ?)
		`).bind(
			tool_name,
			description || null,
			icon || null,
			sort_order || 0
		).run();

		return c.json(success({ id: result.meta.last_row_id }, "创建成功"));
	} catch (e: any) {
		console.error("[Tools] 创建失败:", e);
		return c.json(fail(500, e.message || "创建失败"));
	}
});

/**
 * PUT /api/frontend/tools/:id
 * 更新工具信息
 */
app.put("/:id", authMiddleware, requirePermission(Permission.FRONTEND_TOOLS_UPDATE), async (c) => {
	try {
		const id = c.req.param("id");
		const { tool_name, description, icon, sort_order, status } = await c.req.json();

		await c.env.DB.prepare(`
			UPDATE sq_tools
			SET tool_name = ?, description = ?, icon = ?, sort_order = ?, status = ?, updated_at = CURRENT_TIMESTAMP
			WHERE id = ?
		`).bind(
			tool_name,
			description || null,
			icon || null,
			sort_order ?? 0,
			status ?? 1,
			id
		).run();

		return c.json(success(null, "更新成功"));
	} catch (e: any) {
		console.error("[Tools] 更新失败:", e);
		return c.json(fail(500, e.message || "更新失败"));
	}
});

/**
 * DELETE /api/frontend/tools/:id
 * 删除工具（同时删除 R2 文件）
 */
app.delete("/:id", authMiddleware, requirePermission(Permission.FRONTEND_TOOLS_DELETE), async (c) => {
	try {
		const id = c.req.param("id");

		// 获取工具信息
		const tool = await c.env.DB.prepare(`
			SELECT windows_file_key, android_file_key FROM sq_tools WHERE id = ?
		`).bind(id).first<Pick<ToolRecord, "windows_file_key" | "android_file_key">>();

		if (!tool) {
			return c.json(fail(404, "工具不存在"), 404);
		}

		// 删除 R2 文件
		const keysToDelete: string[] = [];
		if (tool.windows_file_key) keysToDelete.push(tool.windows_file_key);
		if (tool.android_file_key) keysToDelete.push(tool.android_file_key);

		if (keysToDelete.length > 0) {
			await c.env.R2_BINDING.delete(keysToDelete);
		}

		// 删除数据库记录
		await c.env.DB.prepare(`DELETE FROM sq_tools WHERE id = ?`).bind(id).run();

		return c.json(success(null, "删除成功"));
	} catch (e: any) {
		console.error("[Tools] 删除失败:", e);
		return c.json(fail(500, e.message || "删除失败"));
	}
});

/**
 * POST /api/frontend/tools/:id/upload
 * 上传工具文件
 * 文件保存格式：SQTools/{platform}/{originalName-timestamp.ext}
 */
app.post("/:id/upload", authMiddleware, requirePermission(Permission.FRONTEND_TOOLS_UPLOAD), async (c) => {
	try {
		const id = c.req.param("id");

		// 获取工具信息
		const tool = await c.env.DB.prepare(`
			SELECT id FROM sq_tools WHERE id = ?
		`).bind(id).first();

		if (!tool) {
			return c.json(fail(404, "工具不存在"), 404);
		}

		const formData = await c.req.formData();
		const file = formData.get("file") as File | null;
		const platform = formData.get("platform") as string | null;

		if (!file || !platform) {
			return c.json(fail(400, "缺少文件或平台参数"), 400);
		}

		if (!["windows", "android"].includes(platform)) {
			return c.json(fail(400, "无效的平台参数"), 400);
		}

		// 生成带时间戳的文件名，防止同名文件冲突
		const timestampedName = generateTimestampedFileName(file.name);
		// R2 路径：SQTools/{platform}/{timestampedName}
		const fileKey = `SQTools/${platform}/${timestampedName}`;

		// 上传到 R2
		const buffer = await file.arrayBuffer();
		await c.env.R2_BINDING.put(fileKey, buffer, {
			httpMetadata: { contentType: file.type || "application/octet-stream" },
			customMetadata: {
				originalFilename: file.name,
				timestampedFilename: timestampedName,
				uploadedAt: new Date().toISOString(),
			},
		});

		// 更新数据库 - 存储原始文件名（不含时间戳）
		const updateField = platform === "windows"
			? "windows_file_key = ?, windows_file_name = ?, windows_file_size = ?"
			: "android_file_key = ?, android_file_name = ?, android_file_size = ?";

		await c.env.DB.prepare(`
			UPDATE sq_tools SET ${updateField}, updated_at = CURRENT_TIMESTAMP WHERE id = ?
		`).bind(fileKey, file.name, file.size, id).run();

		// 删除旧文件（如果存在）
		const oldTool = await c.env.DB.prepare(`
			SELECT windows_file_key, android_file_key FROM sq_tools WHERE id = ?
		`).bind(id).first<Pick<ToolRecord, "windows_file_key" | "android_file_key">>();

		const oldFileKey = platform === "windows"
			? oldTool?.windows_file_key
			: oldTool?.android_file_key;

		// 重新查询获取旧文件key（因为上面已经更新了）
		if (oldFileKey && oldFileKey !== fileKey) {
			try {
				await c.env.R2_BINDING.delete(oldFileKey);
			} catch (e) {
				console.warn("[Tools] 删除旧文件失败:", e);
			}
		}

		return c.json(success({
			fileKey,
			originalName: file.name,
			timestampedName,
			fileSize: file.size,
		}, "上传成功"));
	} catch (e: any) {
		console.error("[Tools] 上传失败:", e);
		return c.json(fail(500, e.message || "上传失败"));
	}
});

/**
 * DELETE /api/frontend/tools/:id/file/:platform
 * 删除指定平台的文件
 */
app.delete("/:id/file/:platform", authMiddleware, requirePermission(Permission.FRONTEND_TOOLS_DELETE), async (c) => {
	try {
		const id = c.req.param("id");
		const platform = c.req.param("platform");

		if (!["windows", "android"].includes(platform)) {
			return c.json(fail(400, "无效的平台参数"), 400);
		}

		// 获取工具信息
		const tool = await c.env.DB.prepare(`
			SELECT * FROM sq_tools WHERE id = ?
		`).bind(id).first<ToolRecord>();

		if (!tool) {
			return c.json(fail(404, "工具不存在"), 404);
		}

		const fileKey = platform === "windows"
			? tool.windows_file_key
			: tool.android_file_key;

		if (fileKey) {
			await c.env.R2_BINDING.delete(fileKey);
		}

		// 更新数据库
		const updateField = platform === "windows"
			? "windows_file_key = NULL, windows_file_name = NULL, windows_file_size = NULL"
			: "android_file_key = NULL, android_file_name = NULL, android_file_size = NULL";

		await c.env.DB.prepare(`
			UPDATE sq_tools SET ${updateField}, updated_at = CURRENT_TIMESTAMP WHERE id = ?
		`).bind(id).run();

		return c.json(success(null, "删除成功"));
	} catch (e: any) {
		console.error("[Tools] 删除文件失败:", e);
		return c.json(fail(500, e.message || "删除失败"));
	}
});

export default app;
