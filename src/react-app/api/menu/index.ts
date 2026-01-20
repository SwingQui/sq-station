/**
 * 菜单管理 API
 * 路径前缀: /api/menus
  *
 * 架构分层：
 * 组件 → 二次封装 (本文件) → 一次封装 (api/index.ts) → 底层 (utils/core/request)
 */

import { request } from "@/api";
import type { Menu } from "../../types";

/**
 * 获取菜单列表（树形结构）
 */
export async function getMenuList(): Promise<Menu[]> {
	return await request<Menu[]>("GET", "/api/menus");
}

/**
 * 获取单个菜单
 */
export async function getMenu(id: number): Promise<Menu> {
	return await request<Menu>("GET", `/api/menus/${id}`);
}

/**
 * 创建菜单
 */
export async function createMenu(data: any): Promise<{ menuId: number }> {
	return await request("POST", "/api/menus", data);
}

/**
 * 更新菜单
 */
export async function updateMenu(id: number, data: any): Promise<void> {
	return await request("PUT", `/api/menus/${id}`, data);
}

/**
 * 删除菜单
 */
export async function deleteMenu(id: number): Promise<void> {
	return await request("DELETE", `/api/menus/${id}`);
}
