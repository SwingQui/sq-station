/**
 * 角色服务
 */

import { apiClient } from "./apiClient";
import type {
	Role,
	CreateRoleDto,
	UpdateRoleDto,
} from "./types";

/**
 * 获取角色列表
 */
export async function getRoleList(): Promise<Role[]> {
	return apiClient.get<Role[]>("/api/roles");
}

/**
 * 获取单个角色
 */
export async function getRole(id: number): Promise<Role> {
	return apiClient.get<Role>(`/api/roles/${id}`);
}

/**
 * 创建角色
 */
export async function createRole(data: CreateRoleDto): Promise<number> {
	const response = await apiClient.post<{ roleId: number }>("/api/roles", data);
	return response.roleId;
}

/**
 * 更新角色
 */
export async function updateRole(id: number, data: UpdateRoleDto): Promise<void> {
	await apiClient.put(`/api/roles/${id}`, data);
}

/**
 * 删除角色
 */
export async function deleteRole(id: number): Promise<void> {
	await apiClient.delete(`/api/roles/${id}`);
}

/**
 * 获取角色的菜单列表
 */
export async function getRoleMenus(id: number): Promise<any[]> {
	return apiClient.get<any[]>(`/api/roles/${id}/menus`);
}

/**
 * 分配角色菜单
 */
export async function assignRoleMenus(roleId: number, menuIds: number[]): Promise<void> {
	await apiClient.put(`/api/roles/${roleId}/menus`, { menuIds });
}

export const roleService = {
	list: getRoleList,
	get: getRole,
	create: createRole,
	update: updateRole,
	delete: deleteRole,
	getMenus: getRoleMenus,
	assignMenus: assignRoleMenus,
};
