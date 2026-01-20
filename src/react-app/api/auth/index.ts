/**
 * 认证授权 API
 * 路径前缀: /api/auth
  *
 * 架构分层：
 * 组件 → 二次封装 (本文件) → 一次封装 (api/index.ts) → 底层 (utils/core/request)
 */

import { request } from "@/api";

/**
 * 用户登录
 */
export async function login(username: string, password: string) {
	return await request("POST", "/api/auth/login", { username, password });
}

/**
 * 用户登出
 */
export async function logout(): Promise<void> {
	return await request("POST", "/api/auth/logout");
}

/**
 * 获取当前用户信息
 */
export async function getUserInfo(): Promise<{
	user: any;
	permissions: string[];
	menus: any[];
}> {
	return await request("GET", "/api/auth/me");
}

/**
 * 刷新令牌
 */
export async function refreshToken() {
	return await request("POST", "/api/auth/refresh");
}
