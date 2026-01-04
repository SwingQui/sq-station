/**
 * 用户组织关联数据仓储层
 * 封装所有与 sys_user_organization 表相关的数据库操作
 */

import { BaseRepository } from "./base.repository";
import type { SysOrganization } from "../core/types/database";

export class UserOrganizationRepository extends BaseRepository {
	/**
	 * 根据用户 ID 查询组织列表
	 */
	async findOrgsByUserId(userId: number): Promise<SysOrganization[]> {
		const sql = `
			SELECT o.*
			FROM sys_organization o
			INNER JOIN sys_user_organization uo ON o.id = uo.org_id
			WHERE uo.user_id = ?
			ORDER BY o.sort_order
		`;
		const result = await this.executeQuery<SysOrganization>(sql, [userId]);
		return result.results;
	}

	/**
	 * 根据组织 ID 查询用户 ID 列表
	 */
	async findUserIdsByOrgId(orgId: number): Promise<number[]> {
		const sql = `SELECT user_id FROM sys_user_organization WHERE org_id = ?`;
		const result = await this.executeQuery<{ user_id: number }>(sql, [orgId]);
		return result.results.map(r => r.user_id);
	}

	/**
	 * 为用户分配组织
	 */
	async updateUserOrgs(userId: number, orgIds: number[]): Promise<void> {
		await this.executeRun("DELETE FROM sys_user_organization WHERE user_id = ?", [userId]);

		if (orgIds.length > 0) {
			const sql = "INSERT INTO sys_user_organization (user_id, org_id) VALUES (?, ?)";
			for (const orgId of orgIds) {
				await this.executeRun(sql, [userId, orgId]);
			}
		}
	}

	/**
	 * 删除用户的所有组织
	 */
	async removeAllOrgsByUserId(userId: number): Promise<void> {
		const sql = `DELETE FROM sys_user_organization WHERE user_id = ?`;
		await this.executeRun(sql, [userId]);
	}

	/**
	 * 删除组织的所有用户关联
	 */
	async removeAllUsersByOrgId(orgId: number): Promise<void> {
		const sql = `DELETE FROM sys_user_organization WHERE org_id = ?`;
		await this.executeRun(sql, [orgId]);
	}
}
