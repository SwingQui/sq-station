/**
 * API 客户端
 * 封装 request.ts，提供类型安全的 API 调用
 */

import { get, post, put, del } from "../utils/request";

/**
 * API 客户端类
 * 提供 type-safe 的 API 调用方法
 */
class ApiClient {
	/**
	 * GET 请求
	 */
	async get<T = any>(url: string, params?: Record<string, string>): Promise<T> {
		return get<T>(url, params);
	}

	/**
	 * POST 请求
	 */
	async post<T = any>(url: string, body?: any): Promise<T> {
		return post<T>(url, body);
	}

	/**
	 * PUT 请求
	 */
	async put<T = any>(url: string, body?: any): Promise<T> {
		return put<T>(url, body);
	}

	/**
	 * DELETE 请求
	 */
	async delete<T = any>(url: string): Promise<T> {
		return del<T>(url);
	}
}

// 导出单例实例
export const apiClient = new ApiClient();
