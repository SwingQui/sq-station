/**
 * 请求缓存管理
 * 用于API防抖功能
 */

export interface CacheEntry {
	promise: Promise<any>;
	timestamp: number;
}

/**
 * 生成标准化的缓存键
 * 规范化URL、参数和请求体，确保相同请求生成相同键
 */
export function generateCacheKey(
	method: string,
	url: string,
	params?: Record<string, string>,
	body?: any
): string {
	// 规范化URL（移除查询字符串）
	const normalizedUrl = url.split("?")[0];

	// 对于GET/HEAD，只缓存URL + params
	if (method === "GET" || method === "HEAD") {
		if (params) {
			const sortedParams = Object.keys(params)
				.sort()
				.map((k) => `${k}=${params[k]}`)
				.join("&");
			return `${method}:${normalizedUrl}:${sortedParams}`;
		}
		return `${method}:${normalizedUrl}`;
	}

	// 对于POST/PUT/DELETE，规范化请求体（按键排序）
	if (body) {
		const normalizedBody = normalizeBody(body);
		return `${method}:${normalizedUrl}:${normalizedBody}`;
	}

	return `${method}:${normalizedUrl}`;
}

/**
 * 规范化请求体
 * 对象按键排序后序列化，确保相同对象生成相同字符串
 */
function normalizeBody(body: any): string {
	if (body === null || body === undefined) {
		return "";
	}

	if (typeof body === "string") {
		return body;
	}

	if (typeof body === "object") {
		// 按键排序后序列化
		const sortedKeys = Object.keys(body).sort();
		const sortedObj: any = {};
		for (const key of sortedKeys) {
			sortedObj[key] = body[key];
		}
		return JSON.stringify(sortedObj);
	}

	return String(body);
}

export class RequestCache {
	private cache = new Map<string, CacheEntry>();
	private readonly debounceTime: number;

	constructor(debounceTime = 2000) {
		this.debounceTime = debounceTime;
	}

	/**
	 * 生成缓存键（使用规范化函数）
	 */
	generateKey(url: string, method: string, body?: any, params?: Record<string, string>): string {
		return generateCacheKey(method, url, params, body);
	}

	/**
	 * 获取缓存（如果未过期）
	 */
	get(key: string): Promise<any> | null {
		const entry = this.cache.get(key);
		if (!entry) return null;

		// 检查是否过期
		if (Date.now() - entry.timestamp > this.debounceTime) {
			this.cache.delete(key);
			return null;
		}

		return entry.promise;
	}

	/**
	 * 设置缓存（自动过期）
	 */
	set(key: string, promise: Promise<any>): void {
		this.cache.set(key, {
			promise,
			timestamp: Date.now(),
		});

		// 自动清理
		setTimeout(() => {
			this.cache.delete(key);
		}, this.debounceTime);
	}

	/**
	 * 清空缓存
	 */
	clear(): void {
		this.cache.clear();
	}
}
