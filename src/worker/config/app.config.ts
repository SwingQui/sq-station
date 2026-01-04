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
} as const;

export type AppConfig = typeof appConfig;
