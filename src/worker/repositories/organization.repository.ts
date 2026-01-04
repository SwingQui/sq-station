/**
 * 组织数据仓储层
 * 封装所有与 sys_organization 表相关的数据库操作
 */

import { BaseRepository } from "./base.repository";
import type { SysOrganization } from "../core/types/database";

export interface CreateOrgDto {
	org_name: string;
	org_code: string;
	sort_order?: number;
	status?: number;
	remark?: string | null;
}

export interface UpdateOrgDto {
	org_name?: string;
	org_code?: string;
	sort_order?: number;
	status?: number;
	remark?: string | null;
}

export class OrganizationRepository extends BaseRepository {
	/**
	 * 查询所有组织
	 */
	async findAll(): Promise<SysOrganization[]> {
		const sql = `SELECT * FROM sys_organization ORDER BY sort_order`;
		const result = await this.executeQuery<SysOrganization>(sql);
		return result.results;
	}

	/**
	 * 根据 ID 查询组织
	 */
	async findById(id: number): Promise<SysOrganization | null> {
		const sql = `SELECT * FROM sys_organization WHERE id = ?`;
		return await this.executeFirst<SysOrganization>(sql, [id]);
	}

	/**
	 * 创建组织
	 */
	async create(data: CreateOrgDto): Promise<number> {
		const sql = `
			INSERT INTO sys_organization (org_name, org_code, sort_order, status, remark)
			VALUES (?, ?, ?, ?, ?)
		`;
		const result = await this.executeRun(sql, [
			data.org_name,
			data.org_code,
			data.sort_order ?? 0,
			data.status ?? 1,
			data.remark || null
		]);
		return result.meta.last_row_id!;
	}

	/**
	 * 更新组织
	 */
	async update(id: number, data: UpdateOrgDto): Promise<void> {
		const fields: string[] = [];
		const values: any[] = [];

		if (data.org_name !== undefined) {
			fields.push("org_name = ?");
			values.push(data.org_name);
		}
		if (data.org_code !== undefined) {
			fields.push("org_code = ?");
			values.push(data.org_code);
		}
		if (data.sort_order !== undefined) {
			fields.push("sort_order = ?");
			values.push(data.sort_order);
		}
		if (data.status !== undefined) {
			fields.push("status = ?");
			values.push(data.status);
		}
		if (data.remark !== undefined) {
			fields.push("remark = ?");
			values.push(data.remark);
		}

		if (fields.length === 0) return;

		fields.push("updated_at = CURRENT_TIMESTAMP");
		values.push(id);

		const sql = `UPDATE sys_organization SET ${fields.join(', ')} WHERE id = ?`;
		await this.executeRun(sql, values);
	}

	/**
	 * 删除组织
	 */
	async delete(id: number): Promise<void> {
		const sql = `DELETE FROM sys_organization WHERE id = ?`;
		await this.executeRun(sql, [id]);
	}

	/**
	 * 检查组织名称是否存在
	 */
	async existsByOrgName(orgName: string): Promise<boolean> {
		const sql = `SELECT COUNT(*) as count FROM sys_organization WHERE org_name = ?`;
		const result = await this.executeFirst<{ count: number }>(sql, [orgName]);
		return (result?.count ?? 0) > 0;
	}

	/**
	 * 检查组织编码是否存在
	 */
	async existsByOrgCode(orgCode: string): Promise<boolean> {
		const sql = `SELECT COUNT(*) as count FROM sys_organization WHERE org_code = ?`;
		const result = await this.executeFirst<{ count: number }>(sql, [orgCode]);
		return (result?.count ?? 0) > 0;
	}
}
