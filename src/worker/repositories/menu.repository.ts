/**
 * 菜单数据仓储层
 * 封装所有与 sys_menu 表相关的数据库操作
 */

import { BaseRepository } from "./base.repository";
import type { SysMenu } from "../core/types/database";

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

		// 确保所有值都不是 undefined（D1 不支持 undefined）
		const params = [
			data.parent_id != null ? data.parent_id : 0,
			data.menu_name ?? "",
			data.menu_type ?? "",
			data.route_path != null ? data.route_path : null,
			data.component_path != null ? data.component_path : null,
			data.redirect != null ? data.redirect : null,
			data.query_param != null ? data.query_param : null,
			data.is_frame != null ? data.is_frame : 0,
			data.is_cache != null ? data.is_cache : 0,
			data.menu_visible != null ? data.menu_visible : 0,
			data.menu_status != null ? data.menu_status : 1,
			data.icon != null ? data.icon : null,
			data.sort_order != null ? data.sort_order : 0,
			data.permission != null ? data.permission : null,
			id
		];

		await this.executeRun(sql, params);
	}

	/**
	 * 删除菜单
	 */
	async delete(id: number): Promise<void> {
		const sql = "DELETE FROM sys_menu WHERE id = ?";
		await this.executeRun(sql, [id]);
	}

	/**
	 * 根据用户 ID 查询菜单（合并直接角色 + 组织角色菜单）
	 */
	async findByUserId(userId: number): Promise<SysMenu[]> {
		const sql = `
			SELECT DISTINCT m.*
			FROM sys_menu m
			WHERE m.menu_status = 1
			AND (
				-- 用户直接角色的菜单
				m.id IN (
					SELECT rm.menu_id
					FROM sys_role_menu rm
					INNER JOIN sys_user_role ur ON rm.role_id = ur.role_id
					WHERE ur.user_id = ?
				)
				OR
				-- 用户所属组织的角色菜单
				m.id IN (
					SELECT rm.menu_id
					FROM sys_role_menu rm
					INNER JOIN sys_org_role ore ON rm.role_id = ore.role_id
					INNER JOIN sys_user_organization uo ON ore.org_id = uo.org_id
					WHERE uo.user_id = ?
				)
			)
			ORDER BY m.sort_order ASC
		`;
		const result = await this.executeQuery<SysMenu>(sql, [userId, userId]);
		return result.results;
	}

	/**
	 * 根据用户 ID 查询所有菜单（不过滤状态和可见性，用于权限检查）
	 */
	async findAllMenusByUserId(userId: number): Promise<SysMenu[]> {
		const sql = `
			SELECT DISTINCT m.*
			FROM sys_menu m
			WHERE (
				-- 用户直接角色的菜单
				m.id IN (
					SELECT rm.menu_id
					FROM sys_role_menu rm
					INNER JOIN sys_user_role ur ON rm.role_id = ur.role_id
					WHERE ur.user_id = ?
				)
				OR
				-- 用户所属组织的角色菜单
				m.id IN (
					SELECT rm.menu_id
					FROM sys_role_menu rm
					INNER JOIN sys_org_role ore ON rm.role_id = ore.role_id
					INNER JOIN sys_user_organization uo ON ore.org_id = uo.org_id
					WHERE uo.user_id = ?
				)
			)
			ORDER BY m.sort_order ASC
		`;
		const result = await this.executeQuery<SysMenu>(sql, [userId, userId]);
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
	 * 根据用户 ID 查询权限标识（用户直接权限 + 用户角色权限 + 组织直接权限）
	 */
	async findPermissionsByUserId(userId: number): Promise<string[]> {
		// 使用 Set 合并所有权限（自动去重）
		const allPermissions = new Set<string>();

		// 1. 获取用户的直接权限（从 sys_user_permission 表）
		const directPermsSql = `
			SELECT permission FROM sys_user_permission WHERE user_id = ?
		`;
		const directResult = await this.executeQuery<{ permission: string }>(directPermsSql, [userId]);
		for (const row of directResult.results || []) {
			allPermissions.add(row.permission);
		}

		// 2. 获取用户角色的权限（从 sys_role 表）
		const userSql = "SELECT roles FROM sys_user WHERE id = ?";
		const userResult = await this.executeFirst<{ roles: string }>(userSql, [userId]);

		if (userResult && userResult.roles) {
			try {
				const userRoles = JSON.parse(userResult.roles) as string[];
				if (userRoles.length > 0) {
					const placeholders = userRoles.map(() => "?").join(",");
					const sql = `
						SELECT DISTINCT permissions FROM sys_role
						WHERE role_key IN (${placeholders}) AND status = 1
					`;
					const results = await this.executeQuery<{ permissions: string }>(sql, userRoles);

					// 合并角色权限到 Set
					for (const row of results.results || []) {
						try {
							const perms = JSON.parse(row.permissions || "[]") as string[];
							perms.forEach(p => allPermissions.add(p));
						} catch (e) {
							console.error("Failed to parse role permissions:", row.permissions, e);
						}
					}
				}
			} catch (e) {
				console.error("Failed to parse user roles:", userResult.roles, e);
			}
		}

		// 3. 获取用户所在组织的直接权限（从 sys_org_permission 表）
		const orgPermSql = `
			SELECT DISTINCT op.permission
			FROM sys_org_permission op
			INNER JOIN sys_user_organization uo ON op.org_id = uo.org_id
			WHERE uo.user_id = ?
		`;
		const orgPermResult = await this.executeQuery<{ permission: string }>(orgPermSql, [userId]);
		for (const row of orgPermResult.results || []) {
			allPermissions.add(row.permission);
		}

		return Array.from(allPermissions);
	}

	/**
	 * 递归查找所有子菜单ID
	 */
	async findChildMenuIds(parentId: number): Promise<number[]> {
		const sql = "SELECT id FROM sys_menu WHERE parent_id = ?";
		const result = await this.executeQuery<{ id: number }>(sql, [parentId]);
		const childIds = result.results.map(r => r.id);

		// 递归查找孙级菜单
		let allChildIds = [...childIds];
		for (const childId of childIds) {
			const grandChildIds = await this.findChildMenuIds(childId);
			allChildIds = allChildIds.concat(grandChildIds);
		}

		return allChildIds;
	}

	/**
	 * 更新子菜单状态（仅更新目录和菜单，不更新按钮）
	 */
	async updateChildMenuStatus(childIds: number[], status: number): Promise<void> {
		if (childIds.length === 0) return;

		const placeholders = childIds.map(() => "?").join(",");
		const sql = `
			UPDATE sys_menu
			SET menu_status = ?, updated_at = CURRENT_TIMESTAMP
			WHERE id IN (${placeholders})
			AND menu_type IN ('M', 'C')
		`;

		await this.executeRun(sql, [status, ...childIds]);
	}

	/**
	 * 更新菜单（带级联禁用）
	 * 当禁用目录时，自动禁用所有子菜单（按钮权限除外）
	 */
	async updateWithCascade(id: number, data: UpdateMenuDto): Promise<void> {
		// 检查是否是禁用目录
		if (data.menu_status === 0) {
			const currentMenu = await this.findById(id);
			if (currentMenu && currentMenu.menu_type === 'M') {
				// 查找所有子菜单
				const childMenuIds = await this.findChildMenuIds(id);
				// 禁用所有子菜单（除了按钮）
				await this.updateChildMenuStatus(childMenuIds, 0);
			}
		}

		// 更新主菜单
		await this.update(id, data);
	}
}
