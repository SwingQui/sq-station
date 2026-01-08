/**
 * 用户角色关联数据仓储层
 * 封装所有与 sys_user_role 表相关的数据库操作
 */

import { BaseRepository } from "./base.repository";
import type { SysRole } from "../core/types/database";

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

		// 查询角色的 role_key
		let roleKeys: string[] = [];
		if (roleIds.length > 0) {
			const placeholders = roleIds.map(() => "?").join(",");
			const keySql = `SELECT role_key FROM sys_role WHERE id IN (${placeholders})`;
			const keyResult = await this.executeQuery<{ role_key: string }>(keySql, roleIds);
			roleKeys = keyResult.results.map(r => r.role_key);

			// 插入新角色
			const sql = "INSERT INTO sys_user_role (user_id, role_id) VALUES (?, ?)";
			for (const roleId of roleIds) {
				await this.executeRun(sql, [userId, roleId]);
			}
		}

		// 同步更新 sys_user.roles 字段（JSON 数组）
		const rolesJson = JSON.stringify(roleKeys);
		await this.executeRun("UPDATE sys_user SET roles = ? WHERE id = ?", [rolesJson, userId]);
	}

	/**
	 * 为角色添加用户
	 */
	async addRoleForUser(userId: number, roleId: number): Promise<void> {
		// 插入关联表
		const sql = "INSERT INTO sys_user_role (user_id, role_id) VALUES (?, ?)";
		await this.executeRun(sql, [userId, roleId]);

		// 获取角色的 role_key
		const roleResult = await this.executeFirst<{ role_key: string }>("SELECT role_key FROM sys_role WHERE id = ?", [roleId]);
		if (!roleResult) {
			throw new Error("角色不存在");
		}

		// 获取用户当前的 roles
		const userResult = await this.executeFirst<{ roles: string | null }>("SELECT roles FROM sys_user WHERE id = ?", [userId]);
		if (!userResult) {
			throw new Error("用户不存在");
		}

		// 解析并添加新角色
		let currentRoles: string[] = [];
		if (userResult.roles) {
			try {
				currentRoles = JSON.parse(userResult.roles);
			} catch (e) {
				console.error("Failed to parse user roles:", userResult.roles, e);
			}
		}

		// 避免重复添加
		if (!currentRoles.includes(roleResult.role_key)) {
			currentRoles.push(roleResult.role_key);
			const rolesJson = JSON.stringify(currentRoles);
			await this.executeRun("UPDATE sys_user SET roles = ? WHERE id = ?", [rolesJson, userId]);
		}
	}

	/**
	 * 移除用户的角色
	 */
	async removeRoleFromUser(userId: number, roleId: number): Promise<void> {
		// 删除关联表记录
		const sql = "DELETE FROM sys_user_role WHERE user_id = ? AND role_id = ?";
		await this.executeRun(sql, [userId, roleId]);

		// 获取角色的 role_key
		const roleResult = await this.executeFirst<{ role_key: string }>("SELECT role_key FROM sys_role WHERE id = ?", [roleId]);
		if (!roleResult) {
			throw new Error("角色不存在");
		}

		// 获取用户当前的 roles
		const userResult = await this.executeFirst<{ roles: string | null }>("SELECT roles FROM sys_user WHERE id = ?", [userId]);
		if (!userResult) {
			throw new Error("用户不存在");
		}

		// 解析并移除角色
		let currentRoles: string[] = [];
		if (userResult.roles) {
			try {
				currentRoles = JSON.parse(userResult.roles);
			} catch (e) {
				console.error("Failed to parse user roles:", userResult.roles, e);
			}
		}

		// 过滤掉要移除的角色
		const newRoles = currentRoles.filter(r => r !== roleResult.role_key);
		const rolesJson = JSON.stringify(newRoles);
		await this.executeRun("UPDATE sys_user SET roles = ? WHERE id = ?", [rolesJson, userId]);
	}

	/**
	 * 删除用户的所有角色
	 */
	async removeAllRolesByUserId(userId: number): Promise<void> {
		const sql = "DELETE FROM sys_user_role WHERE user_id = ?";
		await this.executeRun(sql, [userId]);

		// 同步清空 sys_user.roles 字段
		await this.executeRun("UPDATE sys_user SET roles = '[]' WHERE id = ?", [userId]);
	}

	/**
	 * 删除角色的所有用户关联
	 */
	async removeAllUsersByRoleId(roleId: number): Promise<void> {
		// 先获取角色的 role_key
		const roleResult = await this.executeFirst<{ role_key: string }>("SELECT role_key FROM sys_role WHERE id = ?", [roleId]);
		if (!roleResult) {
			return; // 角色不存在，无需处理
		}

		const sql = "DELETE FROM sys_user_role WHERE role_id = ?";
		await this.executeRun(sql, [roleId]);

		// 从所有用户的 roles 字段中移除该角色
		// 获取所有拥有此角色的用户
		const usersResult = await this.executeQuery<{ id: number; roles: string }>(
			"SELECT id, roles FROM sys_user WHERE roles IS NOT NULL AND roles != '[]'"
		);

		for (const user of usersResult.results || []) {
			try {
				const roles = JSON.parse(user.roles) as string[];
				if (roles.includes(roleResult.role_key)) {
					const newRoles = roles.filter(r => r !== roleResult.role_key);
					const rolesJson = JSON.stringify(newRoles);
					await this.executeRun("UPDATE sys_user SET roles = ? WHERE id = ?", [rolesJson, user.id]);
				}
			} catch (e) {
				console.error("Failed to update user roles:", user.id, user.roles, e);
			}
		}
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
