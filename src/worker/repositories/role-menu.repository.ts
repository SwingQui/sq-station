/**
 * 角色菜单关联数据仓储层
 * 封装所有与 sys_role_menu 表相关的数据库操作
 */

import { BaseRepository } from "./base.repository";
import type { SysMenu } from "../types/database";

export class RoleMenuRepository extends BaseRepository {
	/**
	 * 根据角色 ID 查询菜单列表
	 */
	async findMenusByRoleId(roleId: number): Promise<SysMenu[]> {
		const sql = `
			SELECT m.*
			FROM sys_menu m
			INNER JOIN sys_role_menu rm ON m.id = rm.menu_id
			WHERE rm.role_id = ?
			ORDER BY m.sort_order
		`;
		const result = await this.executeQuery<SysMenu>(sql, [roleId]);
		return result.results;
	}

	/**
	 * 根据角色 ID 查询菜单 ID 列表
	 */
	async findMenuIdsByRoleId(roleId: number): Promise<number[]> {
		const sql = `
			SELECT menu_id
			FROM sys_role_menu
			WHERE role_id = ?
		`;
		const result = await this.executeQuery<{ menu_id: number }>(sql, [roleId]);
		return result.results.map(r => r.menu_id);
	}

	/**
	 * 根据菜单 ID 查询角色 ID 列表
	 */
	async findRoleIdsByMenuId(menuId: number): Promise<number[]> {
		const sql = `
			SELECT role_id
			FROM sys_role_menu
			WHERE menu_id = ?
		`;
		const result = await this.executeQuery<{ role_id: number }>(sql, [menuId]);
		return result.results.map(r => r.role_id);
	}

	/**
	 * 为角色分配菜单（先删除后插入）
	 */
	async updateRoleMenus(roleId: number, menuIds: number[]): Promise<void> {
		// 先删除原有菜单
		await this.executeRun("DELETE FROM sys_role_menu WHERE role_id = ?", [roleId]);

		// 插入新菜单
		if (menuIds.length > 0) {
			const sql = "INSERT INTO sys_role_menu (role_id, menu_id) VALUES (?, ?)";
			for (const menuId of menuIds) {
				await this.executeRun(sql, [roleId, menuId]);
			}
		}
	}

	/**
	 * 为角色添加菜单
	 */
	async addMenuForRole(roleId: number, menuId: number): Promise<void> {
		const sql = "INSERT INTO sys_role_menu (role_id, menu_id) VALUES (?, ?)";
		await this.executeRun(sql, [roleId, menuId]);
	}

	/**
	 * 移除角色的菜单
	 */
	async removeMenuFromRole(roleId: number, menuId: number): Promise<void> {
		const sql = "DELETE FROM sys_role_menu WHERE role_id = ? AND menu_id = ?";
		await this.executeRun(sql, [roleId, menuId]);
	}

	/**
	 * 删除角色的所有菜单
	 */
	async removeAllMenusByRoleId(roleId: number): Promise<void> {
		const sql = "DELETE FROM sys_role_menu WHERE role_id = ?";
		await this.executeRun(sql, [roleId]);
	}

	/**
	 * 删除菜单的所有角色关联
	 */
	async removeAllRolesByMenuId(menuId: number): Promise<void> {
		const sql = "DELETE FROM sys_role_menu WHERE menu_id = ?";
		await this.executeRun(sql, [menuId]);
	}

	/**
	 * 检查角色是否拥有指定菜单
	 */
	async hasMenu(roleId: number, menuId: number): Promise<boolean> {
		const sql = "SELECT COUNT(*) as count FROM sys_role_menu WHERE role_id = ? AND menu_id = ?";
		const result = await this.executeFirst<{ count: number }>(sql, [roleId, menuId]);
		return (result?.count ?? 0) > 0;
	}
}
