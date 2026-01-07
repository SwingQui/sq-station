/**
 * 权限管理
 * 负责权限的存储、检查和路由权限验证
 */

import { findMenuByPath } from "../core/route/matcher";

const PERMISSIONS_KEY = "auth_permissions";

/**
 * 保存权限列表
 */
export function setPermissions(permissions: string[]): void {
	localStorage.setItem(PERMISSIONS_KEY, JSON.stringify(permissions));
}

/**
 * 获取权限列表
 */
export function getPermissionsList(): string[] {
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
 * 检查是否为超级管理员（拥有 *:*:* 通配符权限）
 */
export function isSuperAdmin(): boolean {
	const permissions = getPermissionsList();
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
