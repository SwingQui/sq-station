/**
 * 组织角色关联数据仓储层
 * 封装所有与 sys_org_role 表相关的数据库操作
 */

import { BaseRepository } from "./base.repository";
import type { SysRole } from "../core/types/database";

export class OrgRoleRepository extends BaseRepository {
	/**
	 * 根据组织 ID 查询角色列表
	 */
	async findRolesByOrgId(orgId: number): Promise<SysRole[]> {
		const sql = `
			SELECT r.*
			FROM sys_role r
			INNER JOIN sys_org_role ore ON r.id = ore.role_id
			WHERE ore.org_id = ?
			ORDER BY r.id
		`;
		const result = await this.executeQuery<SysRole>(sql, [orgId]);
		return result.results;
	}

	/**
	 * 为组织分配角色
	 */
	async updateOrgRoles(orgId: number, roleIds: number[]): Promise<void> {
		await this.executeRun("DELETE FROM sys_org_role WHERE org_id = ?", [orgId]);

		if (roleIds.length > 0) {
			const sql = "INSERT INTO sys_org_role (org_id, role_id) VALUES (?, ?)";
			for (const roleId of roleIds) {
				await this.executeRun(sql, [orgId, roleId]);
			}
		}
	}

	/**
	 * 删除组织的所有角色
	 */
	async removeAllRolesByOrgId(orgId: number): Promise<void> {
		const sql = `DELETE FROM sys_org_role WHERE org_id = ?`;
		await this.executeRun(sql, [orgId]);
	}

	/**
	 * 删除角色的所有组织关联
	 */
	async removeAllOrgsByRoleId(roleId: number): Promise<void> {
		const sql = `DELETE FROM sys_org_role WHERE role_id = ?`;
		await this.executeRun(sql, [roleId]);
	}
}
