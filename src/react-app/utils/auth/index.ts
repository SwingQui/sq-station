/**
 * 认证模块统一导出
 * 提供高内聚、低耦合的认证相关功能
 *
 * @module utils/auth
 * @description 按职责拆分为独立模块：
 * - token: Token 管理
 * - user: 用户信息管理
 * - permission: 权限检查
 * - menu: 菜单和权限元数据管理
 */

// ==================== Token 管理 ====================
export {
	setToken,
	getToken,
	removeToken,
	parseToken,
	isTokenExpired,
} from "./token";

// ==================== 用户信息管理 ====================
export {
	setUser,
	getUser,
	removeUser,
	type AuthUser,
	type LoginResponse,
} from "./user";

// ==================== 权限检查 ====================
export {
	setPermissions,
	getPermissionsList,
	removePermissions,
	isSuperAdmin,
	hasPermission,
	hasAnyPermission,
	hasRoutePermission,
} from "./permission";

// ==================== 菜单和权限元数据管理 ====================
export {
	setMenus,
	getMenus,
	removeMenus,
	fetchPermissionMeta,
	getPermissionMeta,
	getPermissionName,
	getPermissionModule,
	getPermissionsByModule,
	getAllModules,
	type MenuItem,
	type PermissionMeta,
	type PermissionConfig,
} from "./menu";

// ==================== 认证状态和登出 ====================

import { getToken } from "./token";
import { removeToken } from "./token";
import { removeUser } from "./user";
import { removePermissions } from "./permission";
import { removeMenus } from "./menu";

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
 * 登出
 * 清除所有认证相关的本地存储
 */
export function logout(): void {
	removeToken();
	removeUser();
	removePermissions();
	removeMenus();
}
