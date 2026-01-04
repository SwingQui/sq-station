/**
 * 组织管理 API
 * 路径前缀: /api/organization
 */

import { apiRequest } from "../../utils/api/request";
import type {
	Organization,
	CreateOrganizationDto,
	UpdateOrganizationDto,
	Role,
} from "../../types";

// ==================== 组织管理 API ====================

/**
 * 获取所有组织
 */
export async function getOrganizationList(): Promise<Organization[]> {
	return await apiRequest<Organization[]>("GET", "/api/organization");
}

/**
 * 根据 ID 获取组织
 */
export async function getOrganization(id: number): Promise<Organization> {
	return await apiRequest<Organization>("GET", `/api/organization/${id}`);
}

/**
 * 创建组织
 */
export async function createOrganization(data: CreateOrganizationDto): Promise<{ id: number }> {
	return await apiRequest<{ id: number }>("POST", "/api/organization", data);
}

/**
 * 更新组织
 */
export async function updateOrganization(id: number, data: UpdateOrganizationDto): Promise<void> {
	return await apiRequest<void>("PUT", `/api/organization/${id}`, data);
}

/**
 * 删除组织
 */
export async function deleteOrganization(id: number): Promise<void> {
	return await apiRequest<void>("DELETE", `/api/organization/${id}`);
}

// ==================== 用户组织关联 API ====================

/**
 * 获取用户的组织列表
 */
export async function getUserOrganizations(userId: number): Promise<Organization[]> {
	return await apiRequest<Organization[]>("GET", `/api/user-organization/${userId}`);
}

/**
 * 为用户分配组织
 */
export async function assignUserOrganizations(userId: number, orgIds: number[]): Promise<void> {
	return await apiRequest<void>("PUT", `/api/user-organization/${userId}`, { orgIds });
}

// ==================== 组织角色关联 API ====================

/**
 * 获取组织的角色列表
 */
export async function getOrganizationRoles(orgId: number): Promise<Role[]> {
	return await apiRequest<Role[]>("GET", `/api/org-role/${orgId}`);
}

/**
 * 为组织分配角色
 */
export async function assignOrganizationRoles(orgId: number, roleIds: number[]): Promise<void> {
	return await apiRequest<void>("PUT", `/api/org-role/${orgId}`, { roleIds });
}
