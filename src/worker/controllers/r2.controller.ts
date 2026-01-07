/**
 * R2 存储控制器
 * 处理 R2 对象存储相关的 HTTP 请求
 */

import { Hono } from "hono";
import type { Env } from "../index.d";
import { success, fail } from "../utils/response";

const app = new Hono<{ Bindings: Env }>();

// 获取单个对象
app.get("/:key", async (c) => {
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

		// 返回文件内容
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

// 上传对象（支持文件和文本）
app.put("/:key", async (c) => {
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

// 删除对象
app.delete("/:key", async (c) => {
	try {
		const key = c.req.param("key");
		await c.env.R2_BINDING.delete(key);
		return c.json(success({ key }, "删除成功"));
	} catch (e: any) {
		return c.json(fail(500, e.message));
	}
});

// 列出所有对象
app.get("/", async (c) => {
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

// 获取对象元数据
app.get("/:key/metadata", async (c) => {
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

// 批量删除
app.post("/delete", async (c) => {
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

export default app;
