/**
 * 菜单和权限元数据管理
 * 负责菜单的存储、获取和权限元数据的管理
 */

import { handleError } from "../error-handler";

const MENUS_KEY = "auth_menus";
const PERMISSION_META_KEY = "permission_meta";

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
			throw new Error(`HTTP ${response.status}: ${response.statusText}`);
		}
		const result = await response.json();
		if (result.code === 200 && result.data) {
			// 缓存到 localStorage
			localStorage.setItem(PERMISSION_META_KEY, JSON.stringify(result.data));
			return result.data;
		}
		throw new Error(result.msg || "获取权限配置失败");
	} catch (error) {
		handleError(error, "获取权限配置失败");
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

// 导出 getPermissions 供 permission.ts 使用
export function getPermissions(): string[] {
	const PERMISSIONS_KEY = "auth_permissions";
	const permsStr = localStorage.getItem(PERMISSIONS_KEY);
	if (!permsStr) return [];
	try {
		return JSON.parse(permsStr);
	} catch {
		return [];
	}
}
