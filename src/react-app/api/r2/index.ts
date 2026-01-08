/**
 * R2 对象存储 API
 * 路径前缀: /api/r2
 */

import { apiRequest } from "../../utils/core/request";
import { getToken } from "../../utils/auth";

export interface R2Object {
	key: string;
	size: number;
	uploaded?: string;
	httpMetadata?: {
		contentType?: string;
		cacheControl?: string;
		contentEncoding?: string;
	};
	customMetadata?: {
		filename?: string;
		uploadedAt?: string;
		isFolder?: string;
	};
}

export interface R2ListResult {
	objects: R2Object[];
	truncated: boolean;
	cursor?: string;
}

export interface R2Metadata {
	key: string;
	size: number;
	httpMetadata?: {
		contentType?: string;
		cacheControl?: string;
		contentEncoding?: string;
	};
	customMetadata?: {
		filename?: string;
		uploadedAt?: string;
		isFolder?: string;
	};
}

export interface R2UploadResult {
	key: string;
	size: number;
	filename?: string;
	contentType?: string;
}

/**
 * 获取对象列表
 */
export async function getR2List(limit = 100, cursor?: string, prefix?: string): Promise<R2ListResult> {
	const params = new URLSearchParams();
	if (limit) params.set("limit", limit.toString());
	if (cursor) params.set("cursor", cursor);
	if (prefix) params.set("prefix", prefix);

	const query = params.toString();
	return await apiRequest<R2ListResult>("GET", `/api/r2${query ? `?${query}` : ""}`);
}

/**
 * 获取对象元数据
 */
export async function getR2Metadata(key: string): Promise<R2Metadata> {
	return await apiRequest<R2Metadata>("GET", `/api/r2/${encodeURIComponent(key)}/metadata`);
}

/**
 * 上传对象（文本/JSON）
 */
export async function uploadR2Value(key: string, value: string, options?: {
	httpMetadata?: { contentType?: string };
	customMetadata?: Record<string, string>;
}): Promise<R2UploadResult> {
	return await apiRequest<R2UploadResult>("PUT", `/api/r2/${encodeURIComponent(key)}`, {
		value,
		...options,
	});
}

/**
 * 上传文件
 */
export async function uploadR2File(key: string, file: File): Promise<R2UploadResult> {
	const formData = new FormData();
	formData.append("file", file);

	// 获取 token
	const token = getToken();

	const response = await fetch(`/api/r2/${encodeURIComponent(key)}`, {
		method: "PUT",
		headers: {
			// 注意：不能手动设置 Content-Type，让浏览器自动设置 multipart/form-data 边界
			...(token ? { Authorization: `Bearer ${token}` } : {}),
		},
		body: formData,
	});

	if (!response.ok) {
		// 解析错误信息
		let errorMsg = `上传失败: ${response.statusText}`;
		try {
			const errData = await response.json();
			if (errData.msg) {
				errorMsg = errData.msg;
			}
		} catch {
			// 忽略解析错误
		}
		throw new Error(errorMsg);
	}

	const result = await response.json();
	// 检查业务状态码
	if (result.code !== 200) {
		throw new Error(result.msg || "上传失败");
	}
	return result.data;
}

/**
 * 删除对象
 */
export async function deleteR2Object(key: string): Promise<void> {
	return await apiRequest("DELETE", `/api/r2/${encodeURIComponent(key)}`);
}

/**
 * 批量删除对象
 */
export async function batchDeleteR2Objects(keys: string[]): Promise<void> {
	return await apiRequest("POST", "/api/r2/delete", { keys });
}

/**
 * 下载对象（返回 Blob）
 */
export async function downloadR2Object(key: string): Promise<Blob> {
	// 获取 token
	const token = getToken();

	const response = await fetch(`/api/r2/${encodeURIComponent(key)}`, {
		headers: {
			...(token ? { Authorization: `Bearer ${token}` } : {}),
		},
	});

	if (!response.ok) {
		let errorMsg = `下载失败: ${response.statusText}`;
		try {
			const errData = await response.json();
			if (errData.msg) {
				errorMsg = errData.msg;
			}
		} catch {
			// 忽略解析错误
		}
		throw new Error(errorMsg);
	}

	return await response.blob();
}

/**
 * 获取对象公开访问 URL（如果配置了自定义域名）
 */
export function getR2PublicUrl(key: string, baseUrl?: string): string {
	// 如果配置了 R2 自定义域名，使用自定义域名
	// 否则返回通过代理访问的 URL
	return baseUrl ? `${baseUrl}/${key}` : `/api/r2/${encodeURIComponent(key)}`;
}

/**
 * 文件夹相关接口
 */

export interface R2FolderResult {
	folders: string[];
}

/**
 * 获取文件夹列表
 */
export async function getR2Folders(prefix?: string): Promise<R2FolderResult> {
	const params = prefix ? `?prefix=${encodeURIComponent(prefix)}` : "";
	return await apiRequest<R2FolderResult>("GET", `/api/r2/folders${params}`);
}

/**
 * 创建文件夹
 */
export async function createR2Folder(path: string): Promise<{ path: string }> {
	return await apiRequest<{ path: string }>("PUT", `/api/r2/folder/${encodeURIComponent(path)}`);
}

/**
 * 删除文件夹（递归删除所有内容）
 */
export async function deleteR2Folder(path: string): Promise<{ path: string; deletedCount: number }> {
	return await apiRequest<{ path: string; deletedCount: number }>("DELETE", `/api/r2/folder/${encodeURIComponent(path)}`);
}
