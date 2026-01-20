/**
 * 菜单和权限元数据管理
 * 从统一加密存储中读取菜单数据
 */

import { handleError } from "../error-handler";
import { getMenus as getMenusFromStorage } from "./storage";
import { getPermissionsConfig } from "@/api/config";

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
 * 获取菜单列表（从统一存储）
 */
export function getMenus(): any[] {
	return getMenusFromStorage();
}

/**
 * 权限元数据接口（兼容旧代码）
 */
export interface PermissionMeta {
	name: string;
	module: string;
	description?: string;
}

/**
 * 权限配置（兼容旧代码）
 */
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
		const data = await getPermissionsConfig();

		// 转换为旧代码期望的格式
		const transformedData: PermissionConfig = {
			permissions: {},
			groups: {},
			version: data.version,
		};

		// 转换 permissions 数组为对象（以 key 为索引）
		data.permissions.forEach((p) => {
			transformedData.permissions[p.key] = {
				name: p.name,
				module: "", // 暂时为空，下面会填充
				description: p.description,
			};
		});

		// 转换 groups 并填充 module 信息
		data.groups.forEach((g) => {
			transformedData.groups[g.name] = g.permissions.map((p) => p.key);

			// 填充 module 信息
			g.permissions.forEach((p) => {
				if (transformedData.permissions[p.key]) {
					transformedData.permissions[p.key].module = g.name;
				}
			});
		});

		// 缓存到 localStorage
		localStorage.setItem(PERMISSION_META_KEY, JSON.stringify(transformedData));
		return transformedData;
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
