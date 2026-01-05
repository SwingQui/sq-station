/**
 * 配置控制器
 * 提供系统配置相关的 API，如权限元数据等
 */

import { Hono } from "hono";
import type { Env, Variables } from "../index.d";
import { success } from "../utils/response";
import { PermissionMeta, PermissionGroups, Permission } from "../constants/permissions";

const app = new Hono<{ Bindings: Env; Variables: Variables }>();

/**
 * GET /api/config/permissions
 * 获取所有权限的元数据
 * 用于前端权限配置界面
 */
app.get("/permissions", (c) => {
	return c.json(success({
		permissions: PermissionMeta,
		groups: PermissionGroups,
		version: Date.now(), // 版本号，用于缓存失效
	}));
});

/**
 * GET /api/config/permissions/constants
 * 获取权限常量映射
 * 前端可以使用这些常量来避免硬编码权限字符串
 */
app.get("/permissions/constants", (c) => {
	return c.json(success({
		constants: Permission,
	}));
});

/**
 * GET /api/config
 * 获取系统配置
 */
app.get("/", (c) => {
	return c.json(success({
		appName: "SQ Station",
		version: "1.0.0",
		features: {
			permissionManagement: true,
			roleManagement: true,
			menuManagement: true,
			organizationManagement: true,
		},
	}));
});

export default app;
