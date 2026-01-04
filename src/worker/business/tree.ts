/**
 * 树构建工具函数
 */

import type { SysMenu } from "../core/types/database";

/**
 * 构建菜单树
 * @param menus 扁平的菜单列表
 * @param parentId 父节点 ID（默认 0）
 * @returns 树形结构的菜单列表
 */
export function buildMenuTree(menus: SysMenu[], parentId: number = 0): SysMenu[] {
	const result: SysMenu[] = [];

	for (const menu of menus) {
		// 修复 D1 数据库的 NULL 值问题 - 将字符串 "null" 转换为真正的 null
		if (menu.route_path === "null") menu.route_path = null;
		if (menu.component_path === "null") menu.component_path = null;
		if (menu.icon === "null") menu.icon = null;
		if (menu.permission === "null") menu.permission = null;
		if (menu.query_param === "null") menu.query_param = null;

		if (menu.parent_id === parentId) {
			const children = buildMenuTree(menus, menu.id);
			if (children.length > 0) {
				menu.children = children;
			}
			result.push(menu);
		}
	}

	return result;
}

/**
 * 通用树构建函数
 * @param items 扁平的节点列表
 * @param parentIdKey 父 ID 字段名
 * @param parentId 父节点 ID（默认 0）
 * @returns 树形结构的节点列表
 */
export function buildTree<T extends Record<string, unknown>>(
	items: T[],
	parentIdKey: string,
	parentId: number | string = 0
): T[] {
	const result: T[] = [];

	for (const item of items) {
		if ((item[parentIdKey] as number | string) === parentId) {
			const children = buildTree(items, parentIdKey, item.id as number | string);
			if (children.length > 0) {
				(item as Record<string, unknown>).children = children;
			}
			result.push(item);
		}
	}

	return result;
}
