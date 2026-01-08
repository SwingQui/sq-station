/**
 * 接口缓存服务
 * 用于缓存 GET 请求的响应数据
 */

interface CacheEntry {
	data: string;
	expiredAt: number;
}

export class CacheService {
	private cache: Map<string, CacheEntry> = new Map();

	/**
	 * 生成缓存键
	 */
	private generateCacheKey(path: string, queryParams: URLSearchParams): string {
		const sortedParams = Array.from(queryParams.entries())
			.sort(([a], [b]) => a.localeCompare(b))
			.map(([k, v]) => `${k}=${v}`)
			.join("&");
		return sortedParams ? `${path}?${sortedParams}` : path;
	}

	/**
	 * 获取缓存
	 */
	get(path: string, queryParams: URLSearchParams): string | null {
		const key = this.generateCacheKey(path, queryParams);
		const entry = this.cache.get(key);

		if (!entry) {
			console.log(`[缓存] 未命中: ${key}`);
			return null;
		}

		// 检查是否过期
		const now = Date.now();
		const remainingTime = entry.expiredAt - now;
		if (now > entry.expiredAt) {
			console.log(`[缓存] 已过期删除: ${key}`);
			this.cache.delete(key);
			return null;
		}

		console.log(`[缓存] 命中: ${key} (剩余 ${Math.round(remainingTime)}ms)`);
		return entry.data;
	}

	/**
	 * 设置缓存
	 */
	set(path: string, queryParams: URLSearchParams, data: string, ttl: number): void {
		const key = this.generateCacheKey(path, queryParams);
		this.cache.set(key, {
			data,
			expiredAt: Date.now() + ttl,
		});
		console.log(`[缓存] 已设置: ${key} (TTL: ${ttl}ms)`);
	}

	/**
	 * 清除指定路径的缓存
	 */
	clear(path: string): void {
		const keysToDelete: string[] = [];
		for (const key of this.cache.keys()) {
			if (key.startsWith(path)) {
				keysToDelete.push(key);
			}
		}
		keysToDelete.forEach(key => this.cache.delete(key));
	}

	/**
	 * 清除所有缓存
	 */
	clearAll(): void {
		this.cache.clear();
	}

	/**
	 * 清理过期缓存
	 */
	cleanup(): void {
		const now = Date.now();
		for (const [key, entry] of this.cache.entries()) {
			if (now > entry.expiredAt) {
				this.cache.delete(key);
			}
		}
	}

	/**
	 * 获取缓存统计
	 */
	getStats(): { size: number; keys: string[] } {
		return {
			size: this.cache.size,
			keys: Array.from(this.cache.keys()),
		};
	}
}

// 单例实例
export const cacheService = new CacheService();
