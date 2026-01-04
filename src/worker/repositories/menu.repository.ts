/**
 * 菜单数据仓储层
 * 封装所有与 sys_menu 表相关的数据库操作
 */

import { BaseRepository } from "./base.repository";
import type { SysMenu } from "../types/database";

export interface CreateMenuDto {
	parent_id?: number;
	menu_name: string;
	menu_type: string;
	route_path?: string | null;
	component_path?: string | null;
	redirect?: string | null;
	query_param?: string | null;
	is_frame?: number;
	is_cache?: number;
	menu_visible?: number;
	menu_status?: number;
	icon?: string | null;
	sort_order?: number;
	permission?: string | null;
}

export interface UpdateMenuDto {
	parent_id?: number;
	menu_name: string;
	menu_type: string;
	route_path?: string | null;
	component_path?: string | null;
	redirect?: string | null;
	query_param?: string | null;
	is_frame?: number;
	is_cache?: number;
	menu_visible?: number;
	menu_status?: number;
	icon?: string | null;
	sort_order?: number;
	permission?: string | null;
}

export class MenuRepository extends BaseRepository {
	/**
	 * 查询所有菜单
	 */
	async findAll(): Promise<SysMenu[]> {
		const sql = `
			SELECT * FROM sys_menu
			ORDER BY sort_order
		`;
		const result = await this.executeQuery<SysMenu>(sql);
		return result.results;
	}

	/**
	 * 根据 ID 查询菜单
	 */
	async findById(id: number): Promise<SysMenu | null> {
		const sql = `
			SELECT * FROM sys_menu
			WHERE id = ?
		`;
		return await this.executeFirst<SysMenu>(sql, [id]);
	}

	/**
	 * 查询指定父菜单下的子菜单数量
	 */
	async countByParentId(parentId: number): Promise<number> {
		const sql = "SELECT COUNT(*) as count FROM sys_menu WHERE parent_id = ?";
		const result = await this.executeFirst<{ count: number }>(sql, [parentId]);
		return result?.count ?? 0;
	}

	/**
	 * 创建菜单
	 */
	async create(data: CreateMenuDto): Promise<number> {
		const sql = `
			INSERT INTO sys_menu (
				parent_id, menu_name, menu_type, route_path, component_path, redirect,
				query_param, is_frame, is_cache, menu_visible, menu_status, icon, sort_order, permission
			)
			VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
		`;
		const result = await this.executeRun(sql, [
			data.parent_id ?? 0,
			data.menu_name,
			data.menu_type,
			data.route_path || null,
			data.component_path || null,
			data.redirect || null,
			data.query_param || null,
			data.is_frame ?? 0,
			data.is_cache ?? 0,
			data.menu_visible ?? 0,
			data.menu_status ?? 1,
			data.icon || null,
			data.sort_order ?? 0,
			data.permission || null
		]);
		return result.meta.last_row_id!;
	}

	/**
	 * 更新菜单
	 */
	async update(id: number, data: UpdateMenuDto): Promise<void> {
		const sql = `
			UPDATE sys_menu
			SET parent_id = ?, menu_name = ?, menu_type = ?, route_path = ?, component_path = ?,
			    redirect = ?, query_param = ?, is_frame = ?, is_cache = ?, menu_visible = ?,
			    menu_status = ?, icon = ?, sort_order = ?, permission = ?, updated_at = CURRENT_TIMESTAMP
			WHERE id = ?
		`;
		await this.executeRun(sql, [
			data.parent_id ?? 0,
			data.menu_name,
			data.menu_type,
			data.route_path || null,
			data.component_path || null,
			data.redirect || null,
			data.query_param || null,
			data.is_frame ?? 0,
			data.is_cache ?? 0,
			data.menu_visible ?? 0,
			data.menu_status ?? 1,
			data.icon || null,
			data.sort_order ?? 0,
			data.permission || null,
			id
		]);
	}

	/**
	 * 删除菜单
	 */
	async delete(id: number): Promise<void> {
		const sql = "DELETE FROM sys_menu WHERE id = ?";
		await this.executeRun(sql, [id]);
	}

	/**
	 * 根据用户 ID 查询菜单
	 */
	async findByUserId(userId: number): Promise<SysMenu[]> {
		const sql = `
			SELECT DISTINCT m.*
			FROM sys_menu m
			INNER JOIN sys_role_menu rm ON m.id = rm.menu_id
			INNER JOIN sys_user_role ur ON rm.role_id = ur.role_id
			WHERE ur.user_id = ? AND m.menu_status = 1
			ORDER BY m.sort_order ASC
		`;
		const result = await this.executeQuery<SysMenu>(sql, [userId]);
		return result.results;
	}

	/**
	 * 根据角色 ID 查询菜单
	 */
	async findByRoleId(roleId: number): Promise<SysMenu[]> {
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
	 * 查询所有菜单权限标识
	 */
	async findAllPermissions(): Promise<string[]> {
		const sql = `
			SELECT DISTINCT permission
			FROM sys_menu
			WHERE permission IS NOT NULL AND permission != ''
		`;
		const result = await this.executeQuery<{ permission: string }>(sql);
		return result.results.map(r => r.permission);
	}

	/**
	 * 根据用户 ID 查询权限标识
	 */
	async findPermissionsByUserId(userId: number): Promise<string[]> {
		const sql = `
			SELECT DISTINCT m.permission
			FROM sys_menu m
			INNER JOIN sys_role_menu rm ON m.id = rm.menu_id
			INNER JOIN sys_user_role ur ON rm.role_id = ur.role_id
			WHERE ur.user_id = ? AND m.permission IS NOT NULL AND m.permission != ''
		`;
		const result = await this.executeQuery<{ permission: string }>(sql, [userId]);
		return result.results.map(r => r.permission);
	}
}
