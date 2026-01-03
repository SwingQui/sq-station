/**
 * 动态路由匹配器
 * 基于数据库菜单配置实现动态路由
 */

import { getMenus, getPermissions } from "./auth";
import { loadComponent } from "./routeRegistry";

/**
 * 菜单项接口（来自数据库 sys_menu 表）
 */
export interface MenuItem {
	id: number;
	parent_id: number;
	menu_name: string;
	menu_type: string; // M=目录, C=菜单, F=按钮
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
 * 路由匹配结果
 */
export interface RouteMatch {
	component: React.ComponentType | null;
	menuInfo: MenuItem | null;
	hasPermission: boolean;
	requiresAuth: boolean;
	isLoading: boolean;
}

/**
 * 系统级路由（不需要认证，不需要数据库配置）
 */
const SYSTEM_ROUTES: Record<string, () => Promise<{ default: React.ComponentType }>> = {
	"/login": () => import("../pages/Login"),
	"/": () => import("../pages/Home"),
};

/**
 * 判断是否为系统路由
 */
export function isSystemRoute(path: string): boolean {
	const cleanPath = path.split('?')[0];
	return SYSTEM_ROUTES.hasOwnProperty(cleanPath);
}

/**
 * 菜单扁平化索引缓存
 */
let menuFlatIndex: Map<string, MenuItem> | null = null;

/**
 * 构建菜单扁平化索引（O(1) 查找）
 */
export function buildMenuFlatIndex(): Map<string, MenuItem> {
	const menus = getMenus();
	const index = new Map<string, MenuItem>();

	function flatten(items: MenuItem[]) {
		for (const item of items) {
			// 只索引有路由路径的菜单项（menu_type = C）
			if (item.route_path && item.menu_type === "C") {
				index.set(item.route_path, item);
			}
			// 递归处理子菜单
			if (item.children && item.children.length > 0) {
				flatten(item.children);
			}
		}
	}

	flatten(menus);
	menuFlatIndex = index;
	return index;
}

/**
 * 获取菜单扁平化索引
 */
export function getMenuFlatIndex(): Map<string, MenuItem> {
	if (!menuFlatIndex) {
		return buildMenuFlatIndex();
	}
	return menuFlatIndex;
}

/**
 * 清除菜单索引缓存（在菜单更新后调用）
 */
export function clearMenuIndexCache(): void {
	menuFlatIndex = null;
}

/**
 * 根据路径查找菜单
 */
export function findMenuByPath(path: string): MenuItem | null {
	const index = getMenuFlatIndex();
	return index.get(path) || null;
}

/**
 * 检查路由权限
 */
export function hasRoutePermission(path: string): boolean {
	const menu = findMenuByPath(path);

	// 未知路由，拒绝访问
	if (!menu) return false;

	// 没有权限要求，允许访问
	if (!menu.permission) return true;

	// 检查用户是否有该权限
	return getPermissions().includes(menu.permission);
}

/**
 * 判断路由是否需要认证
 * 前台路由（/）不需要认证，后台路由（/system/*）需要认证
 */
export function requiresAuth(path: string): boolean {
	// 登录页不需要认证
	if (path === "/login") return false;

	// 后台路由需要认证
	return path.startsWith("/system");
}

/**
 * 异步匹配路由并加载组件
 */
export async function matchRoute(path: string): Promise<RouteMatch> {
	// 去除查询参数，只保留路径部分
	const cleanPath = path.split('?')[0];

	// 优先处理系统路由
	if (SYSTEM_ROUTES[cleanPath]) {
		const { default: component } = await SYSTEM_ROUTES[cleanPath]();
		return {
			component,
			menuInfo: {
				menu_name: cleanPath === "/login" ? "登录" : "首页",
			} as MenuItem,
			hasPermission: true,
			requiresAuth: false,
			isLoading: false,
		};
	}

	// 查找菜单配置
	const menuInfo = findMenuByPath(cleanPath);

	// 路由不存在
	if (!menuInfo) {
		return {
			component: null,
			menuInfo: null,
			hasPermission: false,
			requiresAuth: requiresAuth(path),
			isLoading: false,
		};
	}

	// 检查权限
	const hasPermission = hasRoutePermission(cleanPath);

	if (!hasPermission) {
		return {
			component: null,
			menuInfo,
			hasPermission: false,
			requiresAuth: true,
			isLoading: false,
		};
	}

	// 加载组件
	if (!menuInfo.component_path) {
		return {
			component: null,
			menuInfo,
			hasPermission: true,
			requiresAuth: true,
			isLoading: false,
		};
	}

	const component = await loadComponent(menuInfo.component_path);

	return {
		component,
		menuInfo,
		hasPermission: true,
		requiresAuth: true,
		isLoading: false,
	};
}

/**
 * 获取所有注册的路由路径
 */
export function getAllRoutePaths(): string[] {
	const index = getMenuFlatIndex();
	return Array.from(index.keys()).sort();
}

/**
 * 检查路由是否存在
 */
export function routeExists(path: string): boolean {
	return getMenuFlatIndex().has(path);
}
