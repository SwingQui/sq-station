/**
 * HTTP 请求封装
 * 自动注入 token，统一错误处理
 */

import { getToken, logout } from "./auth";

export interface RequestOptions {
	method?: "GET" | "POST" | "PUT" | "DELETE";
	headers?: Record<string, string>;
	body?: any;
	params?: Record<string, string>;
}

/**
 * 统一请求函数
 */
export async function request<T = any>(url: string, options: RequestOptions = {}): Promise<T> {
	const {
		method = "GET",
		headers = {},
		body,
		params,
	} = options;

	// 构建完整 URL
	let fullUrl = url;
	if (params) {
		const searchParams = new URLSearchParams(params);
		const queryString = searchParams.toString();
		if (queryString) {
			fullUrl += (url.includes("?") ? "&" : "?") + queryString;
		}
	}

	// 构建请求头
	const requestHeaders: Record<string, string> = {
		"Content-Type": "application/json",
		...headers,
	};

	// 自动注入 token
	const token = getToken();
	if (token) {
		requestHeaders["Authorization"] = `Bearer ${token}`;
	}

	// 构建请求配置
	const requestInit: RequestInit = {
		method,
		headers: requestHeaders,
	};

	if (body && method !== "GET") {
		requestInit.body = JSON.stringify(body);
	}

	try {
		const response = await fetch(fullUrl, requestInit);

		// 处理 401 未授权
		if (response.status === 401) {
			logout();
			// 跳转到登录页
			window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`;
			throw new Error("未登录或登录已过期");
		}

		// 解析响应
		const data = await response.json();

		// 检查业务错误
		if (!response.ok) {
			throw new Error(data.error || data.message || "请求失败");
		}

		return data;
	} catch (error: any) {
		if (error.message === "Failed to fetch") {
			throw new Error("网络连接失败，请检查网络");
		}
		throw error;
	}
}

/**
 * GET 请求
 */
export function get<T = any>(url: string, params?: Record<string, string>): Promise<T> {
	return request<T>(url, { method: "GET", params });
}

/**
 * POST 请求
 */
export function post<T = any>(url: string, body?: any): Promise<T> {
	return request<T>(url, { method: "POST", body });
}

/**
 * PUT 请求
 */
export function put<T = any>(url: string, body?: any): Promise<T> {
	return request<T>(url, { method: "PUT", body });
}

/**
 * DELETE 请求
 */
export function del<T = any>(url: string): Promise<T> {
	return request<T>(url, { method: "DELETE" });
}
