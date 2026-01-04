/**
 * 认证授权 API
 * 路径前缀: /api/auth
 */

import { apiRequest } from "../../utils/api/request";

/**
 * 用户登录
 */
export async function login(username: string, password: string) {
	return await apiRequest("POST", "/api/auth/login", { username, password });
}

/**
 * 用户登出
 */
export async function logout(): Promise<void> {
	return await apiRequest("POST", "/api/auth/logout");
}

/**
 * 获取当前用户信息
 */
export async function getUserInfo(): Promise<{
	user: any;
	permissions: string[];
	menus: any[];
}> {
	return await apiRequest("GET", "/api/auth/me");
}

/**
 * 刷新令牌
 */
export async function refreshToken() {
	return await apiRequest("POST", "/api/auth/refresh");
}
