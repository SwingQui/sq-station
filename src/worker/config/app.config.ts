/**
 * 应用配置
 *
 * @description
 * Worker 服务端应用配置，包含业务规则、缓存策略、请求超时等配置。
 * 此配置仅影响 Worker 服务端行为，不影响前端应用。
 *
 * @scope
 * - 作用范围：Worker 服务端 (src/worker)
 * - 不影响：前端 React 应用 (src/react-app)
 *
 * @usage
 * ```ts
 * import { appConfig } from '@/config';
 * const cacheTTL = appConfig.cache.defaultTTL;
 * ```
 */

export const appConfig = {
	/**
	 * 接口缓存配置
	 *
	 * @description
	 * 控制 API 响应的缓存策略，用于提高接口性能和减少数据库查询。
	 *
	 * @scope
	 * - 所有 API 响应的缓存中间件
	 * - src/worker/core/middleware/cache.middleware.ts
	 */
	cache: {
		enabled: true,           // 是否启用缓存
		defaultTTL: 2000,        // 默认缓存时间（毫秒）
		excludeRoutes: [         // 排除的路由（支持通配符）
			"/api/r2/*",         // 排除所有 R2 接口
			"/api/kv/*",         // 排除所有 KV 接口
		],
	},

	/**
	 * 请求超时配置
	 *
	 * @description
	 * 控制 API 请求的超时时间，用于处理长时间未响应的请求。
	 *
	 * @scope
	 * - 所有 API 请求的超时控制
	 * - 前端 fetch 请求的超时设置
	 */
	request: {
		timeout: 12000,          // 请求超时时间（毫秒），默认 12 秒
	},

	/**
	 * 业务常量配置
	 *
	 * @description
	 * 业务逻辑中使用的常量值，统一管理避免硬编码。
	 */
	constants: {
		// 状态值
		status: {
			enabled: 1,           // 启用状态
			disabled: 0,          // 禁用状态
		},
		// 分页默认值
		pagination: {
			defaultPageSize: 10,  // 默认每页数量
		},
	},

} as const;

export type AppConfig = typeof appConfig;
