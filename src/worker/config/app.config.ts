/**
 * 应用配置
 * 包含业务规则和常量配置
 */

export const appConfig = {
	// 超级管理员配置
	superAdmin: {
		id: 1,
		username: "admin",
	},

	// 用户默认配置
	user: {
		defaultStatus: 1, // 默认启用状态
		defaultAvatar: "/default-avatar.png",
	},

	// JWT 配置默认值
	jwt: {
		expiresIn: "24 * 60 * 60", // 24小时
		algorithm: "HS256",
	},

	// 分页配置
	pagination: {
		defaultPageSize: 10,
		maxPageSize: 100,
	},
} as const;

export type AppConfig = typeof appConfig;
