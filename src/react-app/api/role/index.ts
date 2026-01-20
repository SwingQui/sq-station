/**
 * 角色管理 API
 * 路径前缀: /api/roles
  *
 * 架构分层：
 * 组件 → 二次封装 (本文件) → 一次封装 (api/index.ts) → 底层 (utils/core/request)
 */

import { request } from "@/api";
import type { Role, CreateRoleDto, UpdateRoleDto } from "../../types";

/**
 * 获取角色列表
 */
export async function getRoleList(): Promise<Role[]> {
	return await request<Role[]>("GET", "/api/roles");
}

/**
 * 获取单个角色
 */
export async function getRole(id: number): Promise<Role> {
	return await request<Role>("GET", `/api/roles/${id}`);
}

/**
 * 创建角色
 */
export async function createRole(data: CreateRoleDto): Promise<{ roleId: number }> {
	return await request("POST", "/api/roles", data);
}

/**
 * 更新角色
 */
export async function updateRole(id: number, data: UpdateRoleDto): Promise<void> {
	return await request("PUT", `/api/roles/${id}`, data);
}

/**
 * 删除角色
 */
export async function deleteRole(id: number): Promise<void> {
	return await request("DELETE", `/api/roles/${id}`);
}

/**
 * 获取角色的菜单列表
 */
export async function getRoleMenus(id: number): Promise<any[]> {
	return await request("GET", `/api/roles/${id}/menus`);
}

/**
 * 获取角色的菜单ID列表
 */
export async function getRoleMenuIds(id: number): Promise<number[]> {
	return await request("GET", `/api/roles/${id}/menuIds`);
}

/**
 * 为角色分配菜单
 */
export async function assignRoleMenus(id: number, menuIds: number[]): Promise<void> {
	return await request("PUT", `/api/roles/${id}/menus`, { menuIds });
}
