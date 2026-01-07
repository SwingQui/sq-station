/**
 * 组织权限数据仓储层
 * 封装所有与 sys_org_permission 表相关的数据库操作
 */

import { BaseRepository } from "./base.repository";

export class OrgPermissionRepository extends BaseRepository {
	/**
	 * 获取组织的权限列表
	 * @param orgId 组织ID
	 * @returns 权限字符串数组
	 */
	async findByOrgId(orgId: number): Promise<string[]> {
		const sql = "SELECT permission FROM sys_org_permission WHERE org_id = ?";
		const result = await this.executeQuery<{ permission: string }>(sql, [orgId]);
		return result.results.map(r => r.permission);
	}

	/**
	 * 为组织分配权限
	 * @param orgId 组织ID
	 * @param permissions 权限字符串数组
	 * @param createdBy 创建者ID
	 */
	async assignPermissions(orgId: number, permissions: string[], createdBy: number): Promise<void> {
		// 先删除现有权限
		await this.executeRun("DELETE FROM sys_org_permission WHERE org_id = ?", [orgId]);

		// 批量插入新权限
		for (const permission of permissions) {
			const sql = `
				INSERT INTO sys_org_permission (org_id, permission, created_by)
				VALUES (?, ?, ?)
			`;
			await this.executeRun(sql, [orgId, permission, createdBy]);
		}
	}

	/**
	 * 删除组织的所有权限
	 * @param orgId 组织ID
	 */
	async removeByOrgId(orgId: number): Promise<void> {
		await this.executeRun("DELETE FROM sys_org_permission WHERE org_id = ?", [orgId]);
	}
}
