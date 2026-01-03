/**
 * 用户服务
 */

import { apiClient } from "./apiClient";
import type {
	User,
	CreateUserDto,
	UpdateUserDto,
} from "./types";

/**
 * 获取用户列表
 */
export async function getUserList(): Promise<User[]> {
	return apiClient.get<User[]>("/api/users");
}

/**
 * 获取单个用户
 */
export async function getUser(id: number): Promise<User> {
	return apiClient.get<User>(`/api/users/${id}`);
}

/**
 * 创建用户
 */
export async function createUser(data: CreateUserDto): Promise<number> {
	const response = await apiClient.post<{ userId: number }>("/api/users", data);
	return response.userId;
}

/**
 * 更新用户
 */
export async function updateUser(id: number, data: UpdateUserDto): Promise<void> {
	await apiClient.put(`/api/users/${id}`, data);
}

/**
 * 删除用户
 */
export async function deleteUser(id: number): Promise<void> {
	await apiClient.delete(`/api/users/${id}`);
}

/**
 * 获取用户的角色列表
 */
export async function getUserRoles(id: number): Promise<any[]> {
	return apiClient.get<any[]>(`/api/users/${id}/roles`);
}

/**
 * 分配用户角色
 */
export async function assignUserRoles(userId: number, roleIds: number[]): Promise<void> {
	await apiClient.put(`/api/users/${userId}/roles`, { roleIds });
}

export const userService = {
	list: getUserList,
	get: getUser,
	create: createUser,
	update: updateUser,
	delete: deleteUser,
	getRoles: getUserRoles,
	assignRoles: assignUserRoles,
};
