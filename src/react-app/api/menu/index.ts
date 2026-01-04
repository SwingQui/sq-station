/**
 * 菜单管理 API
 * 路径前缀: /api/menus
 */

import { apiRequest } from "../../utils/api/request";
import type { Menu } from "../../types";

/**
 * 获取菜单列表（树形结构）
 */
export async function getMenuList(): Promise<Menu[]> {
	return await apiRequest<Menu[]>("GET", "/api/menus");
}

/**
 * 获取单个菜单
 */
export async function getMenu(id: number): Promise<Menu> {
	return await apiRequest<Menu>("GET", `/api/menus/${id}`);
}

/**
 * 创建菜单
 */
export async function createMenu(data: any): Promise<{ menuId: number }> {
	return await apiRequest("POST", "/api/menus", data);
}

/**
 * 更新菜单
 */
export async function updateMenu(id: number, data: any): Promise<void> {
	return await apiRequest("PUT", `/api/menus/${id}`, data);
}

/**
 * 删除菜单
 */
export async function deleteMenu(id: number): Promise<void> {
	return await apiRequest("DELETE", `/api/menus/${id}`);
}
