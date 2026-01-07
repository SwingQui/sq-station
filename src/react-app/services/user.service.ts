/**
 * 用户服务层
 * 封装用户相关的业务逻辑
 * 提供跨模块的业务逻辑封装和统一的错误处理
 */

import { getUserList, createUser, updateUser, deleteUser, getUserRoles, assignUserRoles } from "../api/user";
import { getOrganizationList } from "../api/organization";
import { handleError, handleSuccess } from "../utils/error-handler";
import type { CreateUserDto, UpdateUserDto, UserRoleDto } from "../types";

/**
 * 用户详情（带组织名称）
 */
export interface UserWithOrgName {
	id: number;
	username: string;
	nickname: string | null;
	email: string | null;
	phone: string | null;
	avatar: string | null;
	status: number;
	organization_id?: number;
	orgName?: string;
	created_at: string;
	updated_at?: string;
}

/**
 * 获取用户列表（带组织名称）
 * 组合用户和组织数据，提供更完整的业务信息
 */
export async function fetchUsersWithOrg(): Promise<UserWithOrgName[]> {
	try {
		const [users, orgs] = await Promise.all([
			getUserList(),
			getOrganizationList()
		]);

		// 组合数据，添加组织名称
		return users.map(user => ({
			...user,
			orgName: orgs.find(o => o.id === user.organization_id)?.org_name || '未分配'
		}));
	} catch (error) {
		handleError(error, "加载用户数据失败");
		throw error;
	}
}

/**
 * 创建用户并显示成功提示
 */
export async function createUserWithFeedback(data: CreateUserDto) {
	try {
		const result = await createUser(data);
		handleSuccess("用户创建成功");
		return result;
	} catch (error) {
		handleError(error, "创建用户失败");
		throw error;
	}
}

/**
 * 更新用户并显示成功提示
 */
export async function updateUserWithFeedback(id: number, data: UpdateUserDto) {
	try {
		await updateUser(id, data);
		handleSuccess("用户更新成功");
	} catch (error) {
		handleError(error, "更新用户失败");
		throw error;
	}
}

/**
 * 删除用户并显示成功提示
 */
export async function deleteUserWithFeedback(id: number) {
	try {
		await deleteUser(id);
		handleSuccess("用户删除成功");
	} catch (error) {
		handleError(error, "删除用户失败");
		throw error;
	}
}

/**
 * 获取用户角色列表（带角色信息）
 */
export async function fetchUserRolesWithInfo(userId: number): Promise<UserRoleDto[]> {
	try {
		return await getUserRoles(userId);
	} catch (error) {
		handleError(error, "加载用户角色失败");
		throw error;
	}
}

/**
 * 为用户分配角色并显示成功提示
 */
export async function assignUserRolesWithFeedback(userId: number, roleIds: number[]) {
	try {
		await assignUserRoles(userId, roleIds);
		handleSuccess("角色分配成功");
	} catch (error) {
		handleError(error, "分配角色失败");
		throw error;
	}
}
