/**
 * 角色数据仓储层
 * 封装所有与 sys_role 表相关的数据库操作
 */

import { BaseRepository } from "./base.repository";
import type { SysRole } from "../core/types/database";

export interface CreateRoleDto {
	role_name: string;
	role_key: string;
	sort_order?: number;
	status?: number;
	remark?: string | null;
}

export interface UpdateRoleDto {
	role_name: string;
	role_key: string;
	sort_order?: number;
	status?: number;
	remark?: string | null;
}

export class RoleRepository extends BaseRepository {
	/**
	 * 查询所有角色
	 */
	async findAll(): Promise<SysRole[]> {
		const sql = `
			SELECT * FROM sys_role
			ORDER BY sort_order
		`;
		const result = await this.executeQuery<SysRole>(sql);
		return result.results;
	}

	/**
	 * 根据 ID 查询角色
	 */
	async findById(id: number): Promise<SysRole | null> {
		const sql = `
			SELECT * FROM sys_role
			WHERE id = ?
		`;
		return await this.executeFirst<SysRole>(sql, [id]);
	}

	/**
	 * 根据 role_key 查询角色
	 */
	async findByRoleKey(roleKey: string): Promise<SysRole | null> {
		const sql = `
			SELECT * FROM sys_role
			WHERE role_key = ?
		`;
		return await this.executeFirst<SysRole>(sql, [roleKey]);
	}

	/**
	 * 创建角色
	 */
	async create(data: CreateRoleDto): Promise<number> {
		const sql = `
			INSERT INTO sys_role (role_name, role_key, sort_order, status, remark)
			VALUES (?, ?, ?, ?, ?)
		`;
		const result = await this.executeRun(sql, [
			data.role_name,
			data.role_key,
			data.sort_order ?? 0,
			data.status ?? 1,
			data.remark || null
		]);
		return result.meta.last_row_id!;
	}

	/**
	 * 更新角色
	 */
	async update(id: number, data: UpdateRoleDto): Promise<void> {
		const sql = `
			UPDATE sys_role
			SET role_name = ?, role_key = ?, sort_order = ?, status = ?, remark = ?, updated_at = CURRENT_TIMESTAMP
			WHERE id = ?
		`;
		await this.executeRun(sql, [
			data.role_name,
			data.role_key,
			data.sort_order ?? 0,
			data.status ?? 1,
			data.remark || null,
			id
		]);
	}

	/**
	 * 删除角色
	 */
	async delete(id: number): Promise<void> {
		const sql = "DELETE FROM sys_role WHERE id = ?";
		await this.executeRun(sql, [id]);
	}

	/**
	 * 检查角色名称是否存在
	 */
	async existsByRoleName(roleName: string): Promise<boolean> {
		const sql = "SELECT COUNT(*) as count FROM sys_role WHERE role_name = ?";
		const result = await this.executeFirst<{ count: number }>(sql, [roleName]);
		return (result?.count ?? 0) > 0;
	}

	/**
	 * 检查角色名称是否存在（排除指定 ID）
	 */
	async existsByRoleNameExcludeId(roleName: string, excludeId: number): Promise<boolean> {
		const sql = "SELECT COUNT(*) as count FROM sys_role WHERE role_name = ? AND id != ?";
		const result = await this.executeFirst<{ count: number }>(sql, [roleName, excludeId]);
		return (result?.count ?? 0) > 0;
	}

	/**
	 * 检查角色标识是否存在
	 */
	async existsByRoleKey(roleKey: string): Promise<boolean> {
		const sql = "SELECT COUNT(*) as count FROM sys_role WHERE role_key = ?";
		const result = await this.executeFirst<{ count: number }>(sql, [roleKey]);
		return (result?.count ?? 0) > 0;
	}

	/**
	 * 检查角色标识是否存在（排除指定 ID）
	 */
	async existsByRoleKeyExcludeId(roleKey: string, excludeId: number): Promise<boolean> {
		const sql = "SELECT COUNT(*) as count FROM sys_role WHERE role_key = ? AND id != ?";
		const result = await this.executeFirst<{ count: number }>(sql, [roleKey, excludeId]);
		return (result?.count ?? 0) > 0;
	}

	/**
	 * 检查用户是否拥有超级管理员角色
	 */
	async hasAdminRoleByUserId(userId: number): Promise<boolean> {
		const sql = `
			SELECT COUNT(*) as count
			FROM sys_role r
			INNER JOIN sys_user_role ur ON r.id = ur.role_id
			WHERE ur.user_id = ? AND r.is_admin = 1
		`;
		const result = await this.executeFirst<{ count: number }>(sql, [userId]);
		return (result?.count ?? 0) > 0;
	}
}
