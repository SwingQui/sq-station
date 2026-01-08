/**
 * 用户信息管理
 * 从统一加密存储中读取用户信息
 */

import { getUser as getUserFromStorage } from "./storage";

/**
 * 用户信息接口
 */
export interface AuthUser {
	id: number;
	username: string;
	nickname?: string;
	avatar?: string;
	roles?: string[];
	is_admin?: boolean;
}

/**
 * 登录响应接口
 */
export interface LoginResponse {
	token: string;
	user: AuthUser;
}

/**
 * 获取用户信息（从统一存储）
 */
export function getUser(): AuthUser | null {
	return getUserFromStorage();
}
