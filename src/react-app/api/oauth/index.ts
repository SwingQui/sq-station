/**
 * OAuth 客户端管理 API
 * 路径前缀: /api/oauth
 */

import { apiRequest } from "../../utils/core/request";

/**
 * OAuth 客户端类型
 * 权限完全由绑定的权限组决定，无自定义权限
 */
export interface OAuthClient {
	id: number;
	client_id: string;
	client_secret: string; // 仅在创建/重置时返回明文
	client_name: string;
	description: string | null;
	permission_group_ids: string; // JSON 字符串，权限组ID数组
	expires_in: number;
	status: number; // 0=禁用 1=正常
	created_at?: string;
	updated_at?: string;
}

/**
 * 创建客户端 DTO
 */
export interface CreateOAuthClientDto {
	client_name: string;
	description?: string;
	permission_group_ids: number[]; // 权限组ID数组（必填）
	expires_in?: number;
	status?: number;
}

/**
 * 更新客户端 DTO
 */
export interface UpdateOAuthClientDto {
	client_name?: string;
	description?: string;
	permission_group_ids?: number[]; // 权限组ID数组
	expires_in?: number;
	status?: number;
}

/**
 * 获取客户端列表
 */
export async function getOAuthClients(): Promise<OAuthClient[]> {
	return await apiRequest<OAuthClient[]>("GET", "/api/oauth/clients");
}

/**
 * 创建客户端
 */
export async function createOAuthClient(data: CreateOAuthClientDto): Promise<OAuthClient> {
	return await apiRequest<OAuthClient>("POST", "/api/oauth/clients", data);
}

/**
 * 更新客户端
 */
export async function updateOAuthClient(id: number, data: UpdateOAuthClientDto): Promise<void> {
	return await apiRequest("PUT", `/api/oauth/clients/${id}`, data);
}

/**
 * 删除客户端
 */
export async function deleteOAuthClient(id: number): Promise<void> {
	return await apiRequest("DELETE", `/api/oauth/clients/${id}`);
}

/**
 * 重置客户端密钥
 */
export async function resetOAuthClientSecret(id: number): Promise<{ client_secret: string }> {
	return await apiRequest<{ client_secret: string }>("POST", `/api/oauth/clients/${id}/reset-secret`);
}
