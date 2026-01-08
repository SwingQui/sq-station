/**
 * OAuth 权限组相关 API
 * 路径前缀: /api/oauth/permission-groups
 */

import { apiRequest } from "../../utils/core/request";

/**
 * OAuth 权限组类型
 */
export interface OAuthPermissionGroup {
	id: number;
	group_key: string;
	group_name: string;
	description: string | null;
	permissions: string; // JSON 字符串
	sort_order: number;
	status: number;
	created_at?: string;
	updated_at?: string;
}

/**
 * 创建权限组 DTO
 */
export interface CreatePermissionGroupDto {
	group_key: string;
	group_name: string;
	description?: string;
	permissions: string[];
	sort_order?: number;
	status?: number;
}

/**
 * 更新权限组 DTO
 */
export interface UpdatePermissionGroupDto {
	group_key?: string;
	group_name?: string;
	description?: string;
	permissions?: string[];
	sort_order?: number;
	status?: number;
}

/**
 * 获取权限组列表
 */
export async function getPermissionGroups(): Promise<OAuthPermissionGroup[]> {
	return await apiRequest<OAuthPermissionGroup[]>("GET", "/api/oauth/permission-groups");
}

/**
 * 获取单个权限组
 */
export async function getPermissionGroup(id: number): Promise<OAuthPermissionGroup> {
	return await apiRequest<OAuthPermissionGroup>("GET", `/api/oauth/permission-groups/${id}`);
}

/**
 * 创建权限组
 */
export async function createPermissionGroup(data: CreatePermissionGroupDto): Promise<{ id: number }> {
	return await apiRequest<{ id: number }>("POST", "/api/oauth/permission-groups", data);
}

/**
 * 更新权限组
 */
export async function updatePermissionGroup(id: number, data: UpdatePermissionGroupDto): Promise<void> {
	return await apiRequest("PUT", `/api/oauth/permission-groups/${id}`, data);
}

/**
 * 删除权限组
 */
export async function deletePermissionGroup(id: number): Promise<void> {
	return await apiRequest("DELETE", `/api/oauth/permission-groups/${id}`);
}
