/**
 * 防抖请求封装
 * 对相同请求进行2秒防抖
 */

import { request, RequestOptions } from "./request";
import { RequestCache, generateCacheKey } from "./requestCache";

const cache = new RequestCache(2000);

/**
 * 防抖请求函数
 * 对相同请求（URL、方法、参数完全相同）在2秒内只发送一次
 */
export async function debouncedRequest<T = any>(
	url: string,
	options: RequestOptions = {}
): Promise<T> {
	const { method = "GET", body, params } = options;
	const key = generateCacheKey(method, url, params, body);

	// 检查缓存
	const cachedPromise = cache.get(key);
	if (cachedPromise) {
		console.debug("[Debounce] Cache hit:", key);
		return cachedPromise;
	}

	// 创建新请求
	const promise = request<T>(url, options);
	cache.set(key, promise);

	return promise;
}

/**
 * 防抖 GET 请求
 */
export function debouncedGet<T = any>(
	url: string,
	params?: Record<string, string>
): Promise<T> {
	return debouncedRequest<T>(url, { method: "GET", params });
}

/**
 * 防抖 POST 请求
 */
export function debouncedPost<T = any>(url: string, body?: any): Promise<T> {
	return debouncedRequest<T>(url, { method: "POST", body });
}

/**
 * 防抖 PUT 请求
 */
export function debouncedPut<T = any>(url: string, body?: any): Promise<T> {
	return debouncedRequest<T>(url, { method: "PUT", body });
}

/**
 * 防抖 DELETE 请求
 */
export function debouncedDel<T = any>(url: string): Promise<T> {
	return debouncedRequest<T>(url, { method: "DELETE" });
}
