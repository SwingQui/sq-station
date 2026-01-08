/**
 * R2 存储控制器
 * 处理 R2 对象存储相关的 HTTP 请求
 */

import { Hono } from "hono";
import type { Env, Variables } from "../index.d";
import { success, fail } from "../utils/response";
import { requirePermission } from "../middleware/permission";
import { Permission } from "../constants/permissions";

const app = new Hono<{ Bindings: Env; Variables: Variables }>();

// ==================== 文件夹相关路由（固定路径，必须放在前面）====================

// 获取文件夹列表 - 需要文件夹列表权限
app.get("/folders", requirePermission(Permission.R2_FOLDER_LIST), async (c) => {
	try {
		const prefix = c.req.query("prefix") || undefined;

		const listed = await c.env.R2_BINDING.list({
			prefix,
			limit: 1000,
		});

		// 从对象的 key 中提取文件夹路径
		const folderSet = new Set<string>();
		const currentPrefix = prefix || "";

		for (const obj of listed.objects) {
			// 跳过文件夹标记文件本身
			if (obj.customMetadata?.isFolder === "true") {
				continue;
			}

			// 提取路径中的文件夹
			const relativeKey = obj.key.substring(currentPrefix.length);
			const parts = relativeKey.split("/").filter(p => p);

			// 收集所有层级的文件夹
			for (let i = 0; i < parts.length - 1; i++) {
				const folderPath = currentPrefix + parts.slice(0, i + 1).join("/");
				folderSet.add(folderPath);
			}
		}

		const folders = Array.from(folderSet).sort();

		return c.json(success({ folders }));
	} catch (e: any) {
		return c.json(fail(500, e.message));
	}
});

// 创建文件夹 - 需要创建文件夹权限
app.put("/folder/:path", requirePermission(Permission.R2_FOLDER_CREATE), async (c) => {
	try {
		const path = c.req.param("path");

		// 规范化路径：移除开头的斜杠，确保以斜杠结尾
		const normalizedPath = path.replace(/^\/+/, "").replace(/\/+$/, "") + "/";

		// 创建一个 0 字节的文件夹标记文件
		await c.env.R2_BINDING.put(normalizedPath, new Uint8Array(0), {
			customMetadata: {
				isFolder: "true",
				createdAt: new Date().toISOString(),
			},
		});

		return c.json(success({
			path: normalizedPath,
		}, "文件夹创建成功"));
	} catch (e: any) {
		return c.json(fail(500, e.message));
	}
});

// 删除文件夹（递归删除所有内容）- 需要删除文件夹权限
app.delete("/folder/:path", requirePermission(Permission.R2_FOLDER_DELETE), async (c) => {
	try {
		const path = c.req.param("path");

		// 规范化路径
		const normalizedPath = path.replace(/^\/+/, "").replace(/\/+$/, "");
		const prefix = normalizedPath ? normalizedPath + "/" : "";

		// 列出所有以该前缀开头的对象
		const listed = await c.env.R2_BINDING.list({ prefix });

		// 收集所有要删除的 key
		const keysToDelete = listed.objects.map(obj => obj.key);

		if (keysToDelete.length > 0) {
			await c.env.R2_BINDING.delete(keysToDelete);
		}

		return c.json(success({
			path: normalizedPath,
			deletedCount: keysToDelete.length,
		}, "文件夹删除成功"));
	} catch (e: any) {
		return c.json(fail(500, e.message));
	}
});

// ==================== 对象相关路由 ====================

// 列出所有对象 - 需要文件列表权限
app.get("/", requirePermission(Permission.R2_FILE_LIST), async (c) => {
	try {
		const limit = parseInt(c.req.query("limit") || "100");
		const cursor = c.req.query("cursor") || undefined;
		const prefix = c.req.query("prefix") || undefined;

		const listed = await c.env.R2_BINDING.list({
			limit,
			cursor,
			prefix,
		});

		const result: any = {
			objects: listed.objects,
			truncated: listed.truncated,
		};
		if (listed.truncated && listed.cursor) {
			result.cursor = listed.cursor;
		}

		return c.json(success(result));
	} catch (e: any) {
		return c.json(fail(500, e.message));
	}
});

// 批量删除 - 需要删除文件权限
app.post("/delete", requirePermission(Permission.R2_FILE_DELETE), async (c) => {
	try {
		const { keys } = await c.req.json();

		if (!Array.isArray(keys) || keys.length === 0) {
			return c.json(fail(400, "keys 必须是非空数组"));
		}

		await c.env.R2_BINDING.delete(keys);

		return c.json(success({
			deletedCount: keys.length,
			keys,
		}, "批量删除成功"));
	} catch (e: any) {
		return c.json(fail(500, e.message));
	}
});

// 获取单个对象 - 需要查看文件或下载文件权限
app.get("/:key", requirePermission(Permission.R2_FILE_VIEW), async (c) => {
	try {
		const key = c.req.param("key");
		const object = await c.env.R2_BINDING.get(key);

		if (object === null) {
			return c.json(fail(404, "对象不存在"));
		}

		// 获取对象元数据
		const metadata = {
			key,
			size: object.size,
			httpMetadata: object.httpMetadata,
			customMetadata: object.customMetadata,
		};

		// 如果请求头 Accept 是 text/html 或 application/json，返回元数据
		// 否则返回文件内容
		const accept = c.req.header("Accept") || "";
		if (accept.includes("application/json") || accept.includes("text/html")) {
			return c.json(success(metadata));
		}

		// 返回文件内容（需要下载权限）
		const currentUser = c.get("currentUser");
		if (!currentUser?.permissions?.includes(Permission.R2_FILE_DOWNLOAD) &&
		    !currentUser?.permissions?.includes("*:*:*")) {
			return c.json(fail(403, "无下载权限"), 403);
		}

		const headers = new Headers();
		if (object.httpMetadata) {
			if (object.httpMetadata.contentType) {
				headers.set("Content-Type", object.httpMetadata.contentType);
			}
			if (object.httpMetadata.cacheControl) {
				headers.set("Cache-Control", object.httpMetadata.cacheControl);
			}
			if (object.httpMetadata.contentEncoding) {
				headers.set("Content-Encoding", object.httpMetadata.contentEncoding);
			}
		}

		// 读取并返回文件内容
		const data = await object.arrayBuffer();
		return new Response(data, { headers });
	} catch (e: any) {
		return c.json(fail(500, e.message));
	}
});

// 上传对象（支持文件和文本）- 需要上传文件权限
app.put("/:key", requirePermission(Permission.R2_FILE_UPLOAD), async (c) => {
	try {
		const key = c.req.param("key");
		const contentType = c.req.header("Content-Type") || "application/octet-stream";

		// 检查是否是文件上传
		const contentTypeHeader = c.req.header("Content-Type") || "";
		const isMultipart = contentTypeHeader.includes("multipart/form-data");

		if (isMultipart) {
			// 处理文件上传
			const formData = await c.req.formData();
			const file = formData.get("file") as File | null;

			if (!file) {
				return c.json(fail(400, "未找到文件"));
			}

			const buffer = await file.arrayBuffer();
			const httpMetadata = {
				contentType: file.type || contentType,
			};

			await c.env.R2_BINDING.put(key, buffer, {
				httpMetadata,
				customMetadata: {
					filename: file.name,
					uploadedAt: new Date().toISOString(),
				},
			});

			return c.json(success({
				key,
				size: buffer.byteLength,
				contentType: file.type,
			}, "上传成功"));
		} else {
			// 处理文本/JSON 上传
			const body = await c.req.json();
			const { value, httpMetadata, customMetadata } = body;

			const metadata: any = {};
			if (httpMetadata) metadata.httpMetadata = httpMetadata;
			if (customMetadata) metadata.customMetadata = customMetadata;

			await c.env.R2_BINDING.put(key, value, metadata);

			return c.json(success({
				key,
				size: value?.length || 0,
			}, "上传成功"));
		}
	} catch (e: any) {
		return c.json(fail(500, e.message));
	}
});

// 删除对象 - 需要删除文件权限
app.delete("/:key", requirePermission(Permission.R2_FILE_DELETE), async (c) => {
	try {
		const key = c.req.param("key");
		await c.env.R2_BINDING.delete(key);
		return c.json(success({ key }, "删除成功"));
	} catch (e: any) {
		return c.json(fail(500, e.message));
	}
});

// 获取对象元数据 - 需要查看文件权限
app.get("/:key/metadata", requirePermission(Permission.R2_FILE_VIEW), async (c) => {
	try {
		const key = c.req.param("key");
		const object = await c.env.R2_BINDING.head(key);

		if (object === null) {
			return c.json(fail(404, "对象不存在"), 404);
		}

		// 返回元数据作为 JSON
		return c.json(success({
			key,
			size: object.size,
			httpMetadata: object.httpMetadata,
			customMetadata: object.customMetadata,
		}));
	} catch (e: any) {
		return c.json(fail(500, e.message));
	}
});

export default app;
