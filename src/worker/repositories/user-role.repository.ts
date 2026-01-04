/**
 * 用户角色关联数据仓储层
 * 封装所有与 sys_user_role 表相关的数据库操作
 */

import { BaseRepository } from "./base.repository";
import type { SysRole } from "../types/database";

export class UserRoleRepository extends BaseRepository {
	/**
	 * 根据用户 ID 查询角色列表
	 */
	async findRolesByUserId(userId: number): Promise<SysRole[]> {
		const sql = `
			SELECT r.*
			FROM sys_role r
			INNER JOIN sys_user_role ur ON r.id = ur.role_id
			WHERE ur.user_id = ?
			ORDER BY r.id
		`;
		const result = await this.executeQuery<SysRole>(sql, [userId]);
		return result.results;
	}

	/**
	 * 根据角色 ID 查询用户 ID 列表
	 */
	async findUserIdsByRoleId(roleId: number): Promise<number[]> {
		const sql = `
			SELECT user_id
			FROM sys_user_role
			WHERE role_id = ?
		`;
		const result = await this.executeQuery<{ user_id: number }>(sql, [roleId]);
		return result.results.map(r => r.user_id);
	}

	/**
	 * 为用户分配角色（先删除后插入）
	 */
	async updateUserRoles(userId: number, roleIds: number[]): Promise<void> {
		// 先删除原有角色
		await this.executeRun("DELETE FROM sys_user_role WHERE user_id = ?", [userId]);

		// 插入新角色
		if (roleIds.length > 0) {
			const sql = "INSERT INTO sys_user_role (user_id, role_id) VALUES (?, ?)";
			for (const roleId of roleIds) {
				await this.executeRun(sql, [userId, roleId]);
			}
		}
	}

	/**
	 * 为角色添加用户
	 */
	async addRoleForUser(userId: number, roleId: number): Promise<void> {
		const sql = "INSERT INTO sys_user_role (user_id, role_id) VALUES (?, ?)";
		await this.executeRun(sql, [userId, roleId]);
	}

	/**
	 * 移除用户的角色
	 */
	async removeRoleFromUser(userId: number, roleId: number): Promise<void> {
		const sql = "DELETE FROM sys_user_role WHERE user_id = ? AND role_id = ?";
		await this.executeRun(sql, [userId, roleId]);
	}

	/**
	 * 删除用户的所有角色
	 */
	async removeAllRolesByUserId(userId: number): Promise<void> {
		const sql = "DELETE FROM sys_user_role WHERE user_id = ?";
		await this.executeRun(sql, [userId]);
	}

	/**
	 * 删除角色的所有用户关联
	 */
	async removeAllUsersByRoleId(roleId: number): Promise<void> {
		const sql = "DELETE FROM sys_user_role WHERE role_id = ?";
		await this.executeRun(sql, [roleId]);
	}

	/**
	 * 检查用户是否拥有指定角色
	 */
	async hasRole(userId: number, roleId: number): Promise<boolean> {
		const sql = "SELECT COUNT(*) as count FROM sys_user_role WHERE user_id = ? AND role_id = ?";
		const result = await this.executeFirst<{ count: number }>(sql, [userId, roleId]);
		return (result?.count ?? 0) > 0;
	}
}
