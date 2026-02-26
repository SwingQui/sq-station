/**
 * 站点工具 API
 * 路径前缀: /api/frontend/tools
 *
 * 架构分层：
 * 组件 → 二次封装 (本文件) → 一次封装 (api/index.ts) → 底层 (utils/core/request)
 *
 * 下载说明：
 * - 下载接口：/api/frontend/tools/download/{platform}?name={fileName}
 * - 上传时文件保存为：原文件名-时间戳.ext（如 test-1709000000000.txt）
 * - 下载时使用原始文件名查询，返回原始文件名
 */

import { request } from "@/api";
import { getToken } from "../../utils/auth";

export interface Tool {
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

export interface UploadResult {
	fileKey: string;
	originalName: string;
	timestampedName: string;
	fileSize: number;
}

/**
 * 获取工具列表（公开）
 */
export async function getToolsList(): Promise<Tool[]> {
	return await request<Tool[]>("GET", "/api/frontend/tools");
}

/**
 * 获取工具列表（管理端）
 */
export async function getToolsManageList(): Promise<Tool[]> {
	return await request<Tool[]>("GET", "/api/frontend/tools/manage");
}

/**
 * 下载工具文件
 * 通过原始文件名下载
 * @param platform 平台：windows 或 android
 * @param fileName 原始文件名（如 test.txt）
 */
export async function downloadToolFile(
	platform: "windows" | "android",
	fileName: string
): Promise<void> {
	const response = await fetch(`/api/frontend/tools/download/${platform}?name=${encodeURIComponent(fileName)}`);

	if (!response.ok) {
		const errData = await response.json().catch(() => ({ msg: "下载失败" }));
		throw new Error(errData.msg || "下载失败");
	}

	// 获取文件内容
	const blob = await response.blob();

	// 创建下载链接
	const url = window.URL.createObjectURL(blob);
	const link = document.createElement("a");
	link.href = url;
	link.download = fileName;
	document.body.appendChild(link);
	link.click();

	// 清理
	document.body.removeChild(link);
	window.URL.revokeObjectURL(url);
}

/**
 * 创建工具（不再需要 tool_key）
 */
export async function createTool(data: {
	tool_name: string;
	description?: string;
	icon?: string;
	sort_order?: number;
}): Promise<{ id: number }> {
	return await request("POST", "/api/frontend/tools", data);
}

/**
 * 更新工具
 */
export async function updateTool(id: number, data: {
	tool_name: string;
	description?: string;
	icon?: string;
	sort_order?: number;
	status?: number;
}): Promise<void> {
	return await request("PUT", `/api/frontend/tools/${id}`, data);
}

/**
 * 删除工具
 */
export async function deleteTool(id: number): Promise<void> {
	return await request("DELETE", `/api/frontend/tools/${id}`);
}

/**
 * 上传工具文件
 */
export async function uploadToolFile(
	toolId: number,
	file: File,
	platform: "windows" | "android"
): Promise<UploadResult> {
	const formData = new FormData();
	formData.append("file", file);
	formData.append("platform", platform);

	const token = getToken();
	const response = await fetch(`/api/frontend/tools/${toolId}/upload`, {
		method: "POST",
		headers: {
			...(token ? { Authorization: `Bearer ${token}` } : {}),
		},
		body: formData,
	});

	if (!response.ok) {
		const errData = await response.json();
		throw new Error(errData.msg || "上传失败");
	}

	const result = await response.json();
	return result.data;
}

/**
 * 删除工具文件
 */
export async function deleteToolFile(
	toolId: number,
	platform: "windows" | "android"
): Promise<void> {
	return await request("DELETE", `/api/frontend/tools/${toolId}/file/${platform}`);
}

/**
 * 格式化文件大小
 */
export function formatFileSize(bytes: number | null): string {
	if (!bytes) return "0 B";
	const k = 1024;
	const sizes = ["B", "KB", "MB", "GB"];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}
