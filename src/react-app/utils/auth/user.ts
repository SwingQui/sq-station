/**
 * 用户信息管理
 * 负责用户信息的存储和获取
 */

const USER_KEY = "auth_user";

/**
 * 认证用户接口
 */
export interface AuthUser {
	id: number;
	username: string;
	nickname?: string;
	avatar?: string;
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
 * 保存用户信息
 */
export function setUser(user: AuthUser): void {
	localStorage.setItem(USER_KEY, JSON.stringify(user));
}

/**
 * 获取用户信息
 */
export function getUser(): AuthUser | null {
	const userStr = localStorage.getItem(USER_KEY);
	if (!userStr) return null;
	try {
		return JSON.parse(userStr);
	} catch {
		return null;
	}
}

/**
 * 移除用户信息
 */
export function removeUser(): void {
	localStorage.removeItem(USER_KEY);
}
