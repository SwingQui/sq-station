/**
 * 组织管理 API
 * 路径前缀: /api/organization
 */

import { apiRequest } from "../../utils/core/request";
import type {
	Organization,
	CreateOrganizationDto,
	UpdateOrganizationDto,
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

// ==================== 组织权限关联 API ====================

/**
 * 获取组织的权限列表
 */
export async function getOrganizationPermissions(orgId: number): Promise<string[]> {
	return await apiRequest<string[]>("GET", `/api/organization/${orgId}/permissions`);
}

/**
 * 为组织分配权限
 */
export async function assignOrganizationPermissions(orgId: number, permissions: string[]): Promise<void> {
	return await apiRequest<void>("PUT", `/api/organization/${orgId}/permissions`, { permissions });
}
