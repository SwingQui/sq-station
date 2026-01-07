/**
 * HTTP 请求封装
 * 自动注入 token，统一错误处理
 * 处理 {code, data, msg} 格式的API响应
 */

import { getToken, logout } from "../../auth";
import { navigate } from "../../router";
import { handleError } from "../../error-handler";

export interface RequestOptions {
	method?: "GET" | "POST" | "PUT" | "DELETE";
	headers?: Record<string, string>;
	body?: any;
	params?: Record<string, string>;
	silent?: boolean;  // 是否静默（不显示 Toast）
	showErrorMessage?: boolean;  // 是否自动显示错误（默认 true）
}

/**
 * API 响应格式
 */
export interface ApiResult<T = any> {
	code: number;
	data: T;
	msg: string;
}

/**
 * 统一请求函数（原始版本，不防抖）
 * 自动处理 {code, data, msg} 格式
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
			// 使用 SPA 导航跳转到登录页
			navigate(`/login?redirect=${encodeURIComponent(window.location.pathname)}`, true);
			throw new Error("未登录或登录已过期");
		}

		// 解析响应
		const result: ApiResult<T> = await response.json();

		// 检查业务状态码
		if (result.code !== 200) {
			throw new Error(result.msg || "请求失败");
		}

		// 返回 data 部分
		return result.data;
	} catch (error: any) {
		if (error.message === "Failed to fetch") {
			error = new Error("网络连接失败，请检查网络");
		}
		// 集成统一错误处理：Toast + 控制台
		// 只有当 showErrorMessage 不为 false 时才自动显示错误
		if (!options.silent && options.showErrorMessage !== false) {
			handleError(error, "请求失败");
		}
		throw error;
	}
}

/**
 * 统一的 API 请求封装
 * 简化 API 调用：apiRequest(method, url, data)
 * @param method HTTP 方法 (GET/POST/PUT/DELETE)
 * @param url 请求 URL
 * @param data 请求数据 (POST/PUT 使用)，或查询参数 (GET 使用)
 * @returns Promise<T> 返回数据
 */
export async function apiRequest<T = any>(
	method: string,
	url: string,
	data?: any
): Promise<T> {
	// 根据 HTTP 方法决定如何处理 data
	const normalizedMethod = method.toUpperCase() as "GET" | "POST" | "PUT" | "DELETE";

	if (normalizedMethod === "GET") {
		// GET 请求：data 作为查询参数
		return request<T>(url, { method: "GET", params: data });
	} else if (normalizedMethod === "DELETE") {
		// DELETE 请求：不传递 body
		return request<T>(url, { method: "DELETE" });
	} else {
		// POST/PUT 请求：data 作为请求体
		return request<T>(url, { method: normalizedMethod, body: data });
	}
}

// ==================== 导出原始请求函数 ====================
export { request as rawRequest };

/**
 * GET 请求（原始版本，不防抖）
 */
export function get<T = any>(url: string, params?: Record<string, string>): Promise<T> {
	return request<T>(url, { method: "GET", params });
}

/**
 * POST 请求（原始版本，不防抖）
 */
export function post<T = any>(url: string, body?: any): Promise<T> {
	return request<T>(url, { method: "POST", body });
}

/**
 * PUT 请求（原始版本，不防抖）
 */
export function put<T = any>(url: string, body?: any): Promise<T> {
	return request<T>(url, { method: "PUT", body });
}

/**
 * DELETE 请求（原始版本，不防抖）
 */
export function del<T = any>(url: string): Promise<T> {
	return request<T>(url, { method: "DELETE" });
}

// ==================== 导出防抖版本（默认使用） ====================
export {
	debouncedRequest as requestWithDebounce,
	debouncedGet as getWithDebounce,
	debouncedPost as postWithDebounce,
	debouncedPut as putWithDebounce,
	debouncedDel as delWithDebounce,
} from "./debounce";
