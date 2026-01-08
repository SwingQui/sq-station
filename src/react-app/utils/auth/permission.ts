/**
 * 权限管理
 * 负责权限的存储、检查和路由权限验证
 */

import { findMenuByPath } from "../core/route/matcher";
import { STORAGE_KEYS } from "@/config/app.config";

// 缓存权限列表，避免频繁读取 localStorage
let cachedPermissions: string[] | null = null;

/**
 * 保存权限列表
 */
export function setPermissions(permissions: string[]): void {
	localStorage.setItem(STORAGE_KEYS.PERMISSIONS, JSON.stringify(permissions));
	cachedPermissions = permissions; // 更新缓存
}

/**
 * 获取权限列表（使用缓存）
 */
export function getPermissionsList(): string[] {
	// 如果有缓存，直接返回
	if (cachedPermissions !== null) {
		return cachedPermissions;
	}

	const permsStr = localStorage.getItem(STORAGE_KEYS.PERMISSIONS);
	if (!permsStr) {
		return [];
	}
	try {
		const perms = JSON.parse(permsStr);
		cachedPermissions = perms; // 缓存权限列表
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
	localStorage.removeItem(STORAGE_KEYS.PERMISSIONS);
	cachedPermissions = null; // 清除缓存
}

/**
 * 检查是否为超级管理员（拥有 *:*:* 通配符权限）
 */
export function isSuperAdmin(): boolean {
	const permissions = getPermissionsList();
	return permissions.includes("*:*:*");
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
