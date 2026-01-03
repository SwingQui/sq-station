/**
 * 菜单服务
 */

import { apiClient } from "./apiClient";
import type {
	Menu,
	CreateMenuDto,
	UpdateMenuDto,
} from "./types";

/**
 * 获取菜单列表（树形结构）
 */
export async function getMenuList(): Promise<Menu[]> {
	return apiClient.get<Menu[]>("/api/menus");
}

/**
 * 获取单个菜单
 */
export async function getMenu(id: number): Promise<Menu> {
	return apiClient.get<Menu>(`/api/menus/${id}`);
}

/**
 * 创建菜单
 */
export async function createMenu(data: CreateMenuDto): Promise<number> {
	const response = await apiClient.post<{ menuId: number }>("/api/menus", data);
	return response.menuId;
}

/**
 * 更新菜单
 */
export async function updateMenu(id: number, data: UpdateMenuDto): Promise<void> {
	await apiClient.put(`/api/menus/${id}`, data);
}

/**
 * 删除菜单
 */
export async function deleteMenu(id: number): Promise<void> {
	await apiClient.delete(`/api/menus/${id}`);
}

export const menuService = {
	list: getMenuList,
	get: getMenu,
	create: createMenu,
	update: updateMenu,
	delete: deleteMenu,
};
