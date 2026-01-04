/**
 * 角色管理 API
 * 路径前缀: /api/roles
 */

import { apiRequest } from "../../utils/api/request";
import type { Role } from "../../types";

/**
 * 获取角色列表
 */
export async function getRoleList(): Promise<Role[]> {
	return await apiRequest<Role[]>("GET", "/api/roles");
}

/**
 * 获取单个角色
 */
export async function getRole(id: number): Promise<Role> {
	return await apiRequest<Role>("GET", `/api/roles/${id}`);
}

/**
 * 创建角色
 */
export async function createRole(data: any): Promise<{ roleId: number }> {
	return await apiRequest("POST", "/api/roles", data);
}

/**
 * 更新角色
 */
export async function updateRole(id: number, data: any): Promise<void> {
	return await apiRequest("PUT", `/api/roles/${id}`, data);
}

/**
 * 删除角色
 */
export async function deleteRole(id: number): Promise<void> {
	return await apiRequest("DELETE", `/api/roles/${id}`);
}

/**
 * 获取角色的菜单列表
 */
export async function getRoleMenus(id: number): Promise<any[]> {
	return await apiRequest("GET", `/api/roles/${id}/menus`);
}

/**
 * 获取角色的菜单ID列表
 */
export async function getRoleMenuIds(id: number): Promise<number[]> {
	return await apiRequest("GET", `/api/roles/${id}/menuIds`);
}

/**
 * 为角色分配菜单
 */
export async function assignRoleMenus(id: number, menuIds: number[]): Promise<void> {
	return await apiRequest("PUT", `/api/roles/${id}/menus`, { menuIds });
}
