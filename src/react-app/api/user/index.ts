/**
 * 用户管理 API
 * 路径前缀: /api/users
 */

import { apiRequest } from "../../utils/core/request";
import type { User, CreateUserDto, UpdateUserDto, UserRoleDto } from "../../types";

/**
 * 获取用户列表
 */
export async function getUserList(): Promise<User[]> {
	return await apiRequest<User[]>("GET", "/api/users");
}

/**
 * 获取单个用户
 */
export async function getUser(id: number): Promise<User> {
	return await apiRequest<User>("GET", `/api/users/${id}`);
}

/**
 * 创建用户
 */
export async function createUser(data: CreateUserDto): Promise<{ userId: number }> {
	return await apiRequest("POST", "/api/users", data);
}

/**
 * 更新用户
 */
export async function updateUser(id: number, data: UpdateUserDto): Promise<void> {
	return await apiRequest("PUT", `/api/users/${id}`, data);
}

/**
 * 删除用户
 */
export async function deleteUser(id: number): Promise<void> {
	return await apiRequest("DELETE", `/api/users/${id}`);
}

/**
 * 获取用户的角色列表
 */
export async function getUserRoles(id: number): Promise<UserRoleDto[]> {
	return await apiRequest("GET", `/api/users/${id}/roles`);
}

/**
 * 为用户分配角色
 */
export async function assignUserRoles(id: number, roleIds: number[]): Promise<void> {
	return await apiRequest("PUT", `/api/users/${id}/roles`, { roleIds });
}

/**
 * 获取用户的直接权限列表
 */
export async function getUserDirectPermissions(id: number): Promise<string[]> {
	return await apiRequest<string[]>("GET", `/api/permissions/${id}/direct-permissions`);
}

/**
 * 获取用户的所有权限（角色 + 直接权限）
 */
export async function getUserPermissions(id: number): Promise<string[]> {
	return await apiRequest<string[]>("GET", `/api/permissions/${id}/permissions`);
}

/**
 * 为用户分配直接权限
 */
export async function assignUserPermissions(id: number, permissions: string[]): Promise<void> {
	return await apiRequest("PUT", `/api/permissions/${id}/permissions`, { permissions });
}
