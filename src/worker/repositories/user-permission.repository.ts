/**
 * 用户权限仓储层
 * 封装所有与 sys_user_permission 表相关的数据库操作
 */

import { BaseRepository } from "./base.repository";

export interface UserPermission {
	id: number;
	user_id: number;
	permission: string;
	created_at: string;
	created_by: number | null;
}

export class UserPermissionRepository extends BaseRepository {
	/**
	 * 获取用户直接权限列表
	 */
	async findByUserId(userId: number): Promise<string[]> {
		const sql = "SELECT permission FROM sys_user_permission WHERE user_id = ?";
		const result = await this.executeQuery<{ permission: string }>(sql, [userId]);
		return result.results.map(r => r.permission);
	}

	/**
	 * 获取用户权限详情
	 */
	async findDetailsByUserId(userId: number): Promise<UserPermission[]> {
		const sql = "SELECT * FROM sys_user_permission WHERE user_id = ?";
		const result = await this.executeQuery<UserPermission>(sql, [userId]);
		return result.results;
	}

	/**
	 * 为用户分配直接权限（先删除现有权限，再批量插入）
	 */
	async assignPermissions(
		userId: number,
		permissions: string[],
		createdBy: number
	): Promise<void> {
		// 先删除现有权限
		await this.executeRun("DELETE FROM sys_user_permission WHERE user_id = ?", [userId]);

		// 批量插入新权限
		if (permissions.length > 0) {
			for (const permission of permissions) {
				const sql = `
					INSERT INTO sys_user_permission (user_id, permission, created_by)
					VALUES (?, ?, ?)
				`;
				await this.executeRun(sql, [userId, permission, createdBy]);
			}
		}
	}

	/**
	 * 删除用户直接权限
	 */
	async removeByUserId(userId: number): Promise<void> {
		await this.executeRun("DELETE FROM sys_user_permission WHERE user_id = ?", [userId]);
	}

	/**
	 * 删除指定权限
	 */
	async remove(userId: number, permission: string): Promise<void> {
		const sql = "DELETE FROM sys_user_permission WHERE user_id = ? AND permission = ?";
		await this.executeRun(sql, [userId, permission]);
	}

	/**
	 * 检查用户是否拥有指定权限
	 */
	async hasPermission(userId: number, permission: string): Promise<boolean> {
		const sql = "SELECT COUNT(*) as count FROM sys_user_permission WHERE user_id = ? AND permission = ?";
		const result = await this.executeFirst<{ count: number }>(sql, [userId, permission]);
		return (result?.count ?? 0) > 0;
	}

	/**
	 * 批量检查用户权限（返回拥有的权限列表）
	 */
	async filterUserPermissions(
		userId: number,
		permissions: string[]
	): Promise<string[]> {
		if (permissions.length === 0) return [];

		const placeholders = permissions.map(() => "?").join(",");
		const sql = `
			SELECT permission FROM sys_user_permission
			WHERE user_id = ? AND permission IN (${placeholders})
		`;
		const result = await this.executeQuery<{ permission: string }>(sql, [userId, ...permissions]);
		return result.results.map(r => r.permission);
	}
}
