/**
 * 前端认证工具
 */

const TOKEN_KEY = "auth_token";
const USER_KEY = "auth_user";
const PERMISSIONS_KEY = "auth_permissions";
const MENUS_KEY = "auth_menus";

export interface AuthUser {
	id: number;
	username: string;
	nickname?: string;
	avatar?: string;
}

export interface LoginResponse {
	token: string;
	user: AuthUser;
}

/**
 * 保存 token
 */
export function setToken(token: string): void {
	localStorage.setItem(TOKEN_KEY, token);
}

/**
 * 获取 token
 */
export function getToken(): string | null {
	return localStorage.getItem(TOKEN_KEY);
}

/**
 * 移除 token
 */
export function removeToken(): void {
	localStorage.removeItem(TOKEN_KEY);
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

/**
 * 保存权限列表
 */
export function setPermissions(permissions: string[]): void {
	localStorage.setItem(PERMISSIONS_KEY, JSON.stringify(permissions));
}

/**
 * 获取权限列表
 */
export function getPermissions(): string[] {
	const permsStr = localStorage.getItem(PERMISSIONS_KEY);
	if (!permsStr) return [];
	try {
		return JSON.parse(permsStr);
	} catch {
		return [];
	}
}

/**
 * 移除权限列表
 */
export function removePermissions(): void {
	localStorage.removeItem(PERMISSIONS_KEY);
}

/**
 * 保存菜单列表
 */
export function setMenus(menus: any[]): void {
	localStorage.setItem(MENUS_KEY, JSON.stringify(menus));
}

/**
 * 获取菜单列表
 */
export function getMenus(): any[] {
	const menusStr = localStorage.getItem(MENUS_KEY);
	if (!menusStr) return [];
	try {
		return JSON.parse(menusStr);
	} catch {
		return [];
	}
}

/**
 * 移除菜单列表
 */
export function removeMenus(): void {
	localStorage.removeItem(MENUS_KEY);
}

/**
 * 检查是否已登录
 */
export function isAuthenticated(): boolean {
	const token = getToken();
	if (!token) return false;

	// 简单检查 token 格式（JWT 应该有 3 个部分）
	const parts = token.split(".");
	return parts.length === 3;
}

/**
 * 检查是否有指定权限
 */
export function hasPermission(permission: string): boolean {
	const permissions = getPermissions();
	return permissions.includes(permission);
}

/**
 * 检查是否有任一权限
 */
export function hasAnyPermission(permissions: string[]): boolean {
	const userPermissions = getPermissions();
	return permissions.some(p => userPermissions.includes(p));
}

/**
 * 登出
 */
export function logout(): void {
	removeToken();
	removeUser();
	removePermissions();
	removeMenus();
}

/**
 * 解析 JWT token（不验证签名，仅用于获取过期时间）
 */
export function parseToken(token: string): any {
	try {
		const parts = token.split(".");
		if (parts.length !== 3) return null;

		const payload = parts[1];
		const decoded = atob(payload);
		return JSON.parse(decoded);
	} catch {
		return null;
	}
}

/**
 * 检查 token 是否过期
 */
export function isTokenExpired(token: string): boolean {
	const payload = parseToken(token);
	if (!payload || !payload.exp) return true;

	const now = Math.floor(Date.now() / 1000);
	return payload.exp < now;
}
