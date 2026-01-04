/**
 * 用户管理 API
 * 路径前缀: /api/users
 */

import { apiRequest } from "../../utils/api/request";
import type { User } from "../../types";

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
export async function createUser(data: any): Promise<{ userId: number }> {
	return await apiRequest("POST", "/api/users", data);
}

/**
 * 更新用户
 */
export async function updateUser(id: number, data: any): Promise<void> {
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
export async function getUserRoles(id: number): Promise<any[]> {
	return await apiRequest("GET", `/api/users/${id}/roles`);
}

/**
 * 为用户分配角色
 */
export async function assignUserRoles(id: number, roleIds: number[]): Promise<void> {
	return await apiRequest("PUT", `/api/users/${id}/roles`, { roleIds });
}
