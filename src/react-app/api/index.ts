/**
 * API 一次封装 - 通用请求方法
 *
 * 架构分层：
 * 组件 → 二次封装 (api/user/index.ts) → 一次封装 (本文件) → 底层 (utils/core/request)
 */

import { apiRequest as rawApiRequest } from "@/utils/core/request";

/**
 * 一次封装：通用请求方法
 * 统一的请求接口，支持 method、url、data 模式
 *
 * @param method - HTTP 方法 (GET/POST/PUT/DELETE)
 * @param url - 请求地址
 * @param data - 请求数据（GET 作为查询参数，其他作为请求体）
 * @returns Promise<T> 返回数据
 *
 * @example
 * // 获取用户列表
 * const users = await request<User[]>("GET", "/api/users");
 *
 * // 创建用户
 * await request("POST", "/api/users", { username: "admin", password: "123456" });
 *
 * // 更新用户
 * await request("PUT", "/api/users/1", { nickname: "新昵称" });
 *
 * // 删除用户
 * await request("DELETE", "/api/users/1");
 */
export async function request<T = any>(
	method: "GET" | "POST" | "PUT" | "DELETE",
	url: string,
	data?: any
): Promise<T> {
	return await rawApiRequest<T>(method, url, data);
}

/**
 * 导出便捷方法（可选）
 * 二次封装可以直接使用 request()，也可以使用这些便捷方法
 */
export const api = {
	get: <T = any>(url: string, params?: any) => request<T>("GET", url, params),
	post: <T = any>(url: string, data?: any) => request<T>("POST", url, data),
	put: <T = any>(url: string, data?: any) => request<T>("PUT", url, data),
	del: <T = any>(url: string) => request<T>("DELETE", url),
};
