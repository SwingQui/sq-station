/**
 * 认证服务
 */

import { apiClient } from "./apiClient";
import type { LoginDto, LoginResponse, UserInfoResponse } from "./types";
import { setToken, setUser, setPermissions, setMenus } from "../utils/auth";
import type { AuthUser } from "../utils/auth";

/**
 * 用户登录
 */
export async function login(data: LoginDto): Promise<LoginResponse> {
	const response = await apiClient.post<{ token: string; user: { id: number; username: string; nickname: string | null } }>("/api/auth/login", data);

	// 保存到本地存储 (转换 null 为 undefined)
	const authUser: AuthUser = {
		id: response.user.id,
		username: response.user.username,
		nickname: response.user.nickname ?? undefined,
	};
	setToken(response.token);
	setUser(authUser);

	return response;
}

/**
 * 获取当前用户信息（包含菜单和权限）
 */
export async function getUserInfo(): Promise<UserInfoResponse> {
	const response = await apiClient.get<UserInfoResponse>("/api/auth/me");

	// 保存到本地存储 (转换 null 为 undefined)
	if (response.user) {
		const authUser: AuthUser = {
			id: response.user.id,
			username: response.user.username,
			nickname: response.user.nickname ?? undefined,
		};
		setUser(authUser);
	}
	if (response.menus) setMenus(response.menus);
	if (response.permissions) setPermissions(response.permissions);

	return response;
}

/**
 * 用户登出
 */
export async function logout(): Promise<void> {
	await apiClient.post("/api/auth/logout");
}

export const authService = {
	login,
	getUserInfo,
	logout,
};
