/**
 * 应用配置
 * 包含业务规则和常量配置
 */

export const appConfig = {
	// 用户默认配置
	user: {
		defaultStatus: 1, // 默认启用状态
		defaultAvatar: "/default-avatar.png",
		disabledStatus: 0, // 禁用状态
	},

	// 分页配置
	pagination: {
		defaultPageSize: 10,
		maxPageSize: 100,
	},

	// 菜单配置
	menu: {
		enabledStatus: 1, // 启用状态
		disabledStatus: 0, // 禁用状态
	},

	// 接口缓存配置
	cache: {
		enabled: true,           // 是否启用缓存
		defaultTTL: 2000,       // 默认缓存时间（毫秒）
		excludeRoutes: [         // 排除的路由（支持通配符）
			"/api/r2/*",         // 排除所有 R2 接口
			"/api/kv/*",         // 排除所有 KV 接口
		],
	},
} as const;

export type AppConfig = typeof appConfig;
