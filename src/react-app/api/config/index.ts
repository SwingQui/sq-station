/**
 * 配置相关 API
 * 路径前缀: /api/config
  *
 * 架构分层：
 * 组件 → 二次封装 (本文件) → 一次封装 (api/index.ts) → 底层 (utils/core/request)
 */

import { request } from "@/api";

/**
 * 权限元数据接口
 */
export interface PermissionMetadata {
	key: string;
	name: string;
	description: string;
}

/**
 * 权限分组
 */
export interface PermissionGroup {
	name: string;
	permissions: PermissionMetadata[];
}

/**
 * 权限配置响应
 */
export interface PermissionsConfig {
	permissions: PermissionMetadata[];
	groups: PermissionGroup[];
	version: number;
}

/**
 * 获取权限元数据
 */
export async function getPermissionsConfig(): Promise<PermissionsConfig> {
	return await request<PermissionsConfig>("GET", "/api/config/permissions");
}

/**
 * 获取权限常量映射
 */
export async function getPermissionConstants(): Promise<{ constants: Record<string, string> }> {
	return await request<{ constants: Record<string, string> }>("GET", "/api/config/permissions/constants");
}
