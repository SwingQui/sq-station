/**
 * 权限管理
 * 从统一加密存储中读取权限
 */

import { findMenuByPath } from "../core/route/matcher";
import { getPermissions as getPermissionsFromStorage, isSuperAdmin } from "./storage";

/**
 * 获取权限列表（从统一存储）
 */
export function getPermissionsList(): string[] {
	return getPermissionsFromStorage();
}

/**
 * 检查是否有指定权限
 */
export function hasPermission(permission: string): boolean {
	// 超级管理员拥有所有权限
	if (isSuperAdmin()) return true;

	const permissions = getPermissionsList();
	return permissions.includes(permission);
}

/**
 * 检查是否有任一权限
 */
export function hasAnyPermission(permissions: string[]): boolean {
	// 超级管理员拥有所有权限
	if (isSuperAdmin()) return true;

	const userPermissions = getPermissionsList();
	return permissions.some(p => userPermissions.includes(p));
}

/**
 * 检查路由权限
 * 使用 route/matcher 中的 findMenuByPath（使用缓存索引，性能更好）
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

// 重新导出 isSuperAdmin 从 storage.ts
export { isSuperAdmin };
