/**
 * 前端认证工具
 *
 * 权限管理说明：
 * - 权限列表从后端 API 获取，登录时存储在 localStorage
 * - 权限元数据（名称、分组）从 /api/config/permissions 获取
 * - 前端使用权限常量避免硬编码权限字符串
 */

const TOKEN_KEY = "auth_token";
const USER_KEY = "auth_user";
const PERMISSIONS_KEY = "auth_permissions";
const MENUS_KEY = "auth_menus";
const PERMISSION_META_KEY = "permission_meta";

export interface AuthUser {
	id: number;
	username: string;
	nickname?: string;
	avatar?: string;
	is_admin?: boolean;
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
	if (!permsStr) {
		console.log("[Auth] No permissions in localStorage");
		return [];
	}
	try {
		const perms = JSON.parse(permsStr);
		console.log("[Auth] Loaded permissions:", perms);
		return perms;
	} catch (e) {
		console.error("[Auth] Failed to parse permissions:", permsStr, e);
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
 * 检查是否为超级管理员（拥有 *:*:* 通配符权限）
 */
export function isSuperAdmin(): boolean {
	const permissions = getPermissions();
	const isAdmin = permissions.includes("*:*:*");
	console.log("[Auth] isSuperAdmin:", isAdmin, "permissions:", permissions);
	return isAdmin;
}

/**
 * 检查是否有指定权限
 */
export function hasPermission(permission: string): boolean {
	// 超级管理员拥有所有权限
	if (isSuperAdmin()) return true;

	const permissions = getPermissions();
	return permissions.includes(permission);
}

/**
 * 检查是否有任一权限
 */
export function hasAnyPermission(permissions: string[]): boolean {
	// 超级管理员拥有所有权限
	if (isSuperAdmin()) return true;

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

/**
 * 菜单项接口（与 routeMatcher.ts 保持一致）
 */
export interface MenuItem {
	id: number;
	parent_id: number;
	menu_name: string;
	menu_type: string;
	route_path: string | null;
	component_path: string | null;
	permission: string | null;
	icon?: string;
	sort_order: number;
	menu_status: number;
	menu_visible: number;
	children?: MenuItem[];
	[key: string]: unknown;
}

/**
 * 查找菜单（扁平化查找）
 */
export function findMenuByPath(path: string): MenuItem | null {
	const menus = getMenus();

	function search(items: MenuItem[]): MenuItem | null {
		for (const item of items) {
			// 检查当前项
			if (item.route_path === path && item.menu_type === "C") {
				return item;
			}
			// 递归检查子项
			if (item.children && item.children.length > 0) {
				const found = search(item.children);
				if (found) return found;
			}
		}
		return null;
	}

	return search(menus);
}

/**
 * 检查路由权限
 */
export function hasRoutePermission(path: string): boolean {
	// 超级管理员拥有所有路由权限
	if (isSuperAdmin()) return true;

	const menu = findMenuByPath(path);

	// 未知路由，拒绝访问
	if (!menu) return false;

	// 禁用的菜单不能访问（menu_status = 0）
	if (menu.menu_status === 0) return false;

	// 隐藏的菜单（menu_visible = 0）如果有权限可以访问
	// 没有权限要求，允许访问
	if (!menu.permission) return true;

	// 检查用户是否有该权限
	return hasPermission(menu.permission);
}

/**
 * 权限元数据接口
 */
export interface PermissionMeta {
	name: string;
	module: string;
	description?: string;
}

export interface PermissionConfig {
	permissions: Record<string, PermissionMeta>;
	groups: Record<string, string[]>;
	version: number;
}

/**
 * 从 API 获取权限元数据
 * 用于前端权限配置界面
 */
export async function fetchPermissionMeta(): Promise<PermissionConfig | null> {
	try {
		const response = await fetch("/api/config/permissions");
		if (!response.ok) {
			console.error("Failed to fetch permission meta:", response.status);
			return null;
		}
		const result = await response.json();
		if (result.success) {
			// 缓存到 localStorage
			localStorage.setItem(PERMISSION_META_KEY, JSON.stringify(result.data));
			return result.data;
		}
		return null;
	} catch (e) {
		console.error("Error fetching permission meta:", e);
		return null;
	}
}

/**
 * 获取缓存的权限元数据
 */
export function getPermissionMeta(): PermissionConfig | null {
	const metaStr = localStorage.getItem(PERMISSION_META_KEY);
	if (!metaStr) return null;
	try {
		return JSON.parse(metaStr);
	} catch {
		return null;
	}
}

/**
 * 获取权限显示名称
 */
export function getPermissionName(permission: string): string {
	const meta = getPermissionMeta();
	if (meta?.permissions?.[permission]) {
		return meta.permissions[permission].name;
	}
	return permission;
}

/**
 * 获取权限所属模块
 */
export function getPermissionModule(permission: string): string {
	const meta = getPermissionMeta();
	if (meta?.permissions?.[permission]) {
		return meta.permissions[permission].module;
	}
	return "其他";
}

/**
 * 按模块获取权限列表
 */
export function getPermissionsByModule(moduleName: string): string[] {
	const meta = getPermissionMeta();
	if (!meta?.groups) return [];
	return meta.groups[moduleName] || [];
}

/**
 * 获取所有模块列表
 */
export function getAllModules(): string[] {
	const meta = getPermissionMeta();
	if (!meta?.groups) return [];
	return Object.keys(meta.groups);
}
