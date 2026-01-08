/**
 * 配置相关 API
 * 路径前缀: /api/config
 */

import { apiRequest } from "../../utils/core/request";

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
	return await apiRequest<PermissionsConfig>("GET", "/api/config/permissions");
}

/**
 * 获取权限常量映射
 */
export async function getPermissionConstants(): Promise<{ constants: Record<string, string> }> {
	return await apiRequest<{ constants: Record<string, string> }>("GET", "/api/config/permissions/constants");
}
