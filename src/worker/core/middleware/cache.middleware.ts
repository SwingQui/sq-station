/**
 * 接口缓存中间件
 * 对 GET 请求进行缓存，提高响应速度
 */

import type { Context, Next } from "hono";
import { appConfig } from "../../config/app.config";
import { cacheService } from "../cache/cache.service";

/**
 * 检查路径是否匹配排除规则
 */
function isExcludedPath(path: string, excludeRoutes: readonly string[]): boolean {
	for (const pattern of excludeRoutes) {
		// 将通配符 * 转换为正则表达式
		const regexPattern = pattern
			.replace(/\*/g, ".*")
			.replace(/\//g, "\\/");
		const regex = new RegExp(`^${regexPattern}$`);
		if (regex.test(path)) {
			return true;
		}
	}
	return false;
}

/**
 * 缓存中间件
 */
export async function cacheMiddleware(c: Context, next: Next) {
	// 仅处理 GET 请求
	if (c.req.method !== "GET") {
		return next();
	}

	// 检查缓存是否启用
	if (!appConfig.cache.enabled) {
		return next();
	}

	const path = c.req.path;
	const queryParams = new URLSearchParams(c.req.query());

	// 检查是否在排除列表中
	if (isExcludedPath(path, appConfig.cache.excludeRoutes)) {
		return next();
	}

	// 尝试获取缓存
	const cachedData = cacheService.get(path, queryParams);
	if (cachedData) {
		// 返回缓存数据
		return c.json(JSON.parse(cachedData));
	}

	// 执行后续处理
	await next();

	// 只缓存成功的响应
	if (c.res.status === 200 && c.res.headers.get("Content-Type")?.includes("application/json")) {
		// 克隆响应体
		const responseBody = c.res.clone().text();

		// 等待响应体读取完成后再缓存
		responseBody.then((data) => {
			cacheService.set(path, queryParams, data, appConfig.cache.defaultTTL);
		});
	}
}

/**
 * 清除缓存中间件（用于数据变更后清除相关缓存）
 */
export function clearCacheMiddleware(path: string) {
	return async (_c: Context, next: Next) => {
		await next();
		// 请求处理完成后清除缓存
		cacheService.clear(path);
	};
}
