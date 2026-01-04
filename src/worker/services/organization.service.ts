/**
 * 组织业务逻辑层
 * 实现组织相关的业务规则和流程
 */

import { OrganizationRepository, CreateOrgDto, UpdateOrgDto } from "../repositories/organization.repository";
import type { SysOrganization } from "../core/types/database";

export class OrganizationService {
	constructor(private orgRepo: OrganizationRepository) {}

	/**
	 * 查询所有组织
	 */
	async findAll(): Promise<SysOrganization[]> {
		return await this.orgRepo.findAll();
	}

	/**
	 * 根据 ID 查询组织
	 */
	async findById(id: number): Promise<SysOrganization | null> {
		const org = await this.orgRepo.findById(id);
		if (!org) {
			throw new Error("组织不存在");
		}
		return org;
	}

	/**
	 * 创建组织
	 */
	async create(data: CreateOrgDto): Promise<number> {
		// 业务验证
		if (!data.org_name || !data.org_code) {
			throw new Error("组织名称和编码不能为空");
		}

		// 检查组织名称是否已存在
		const existsByName = await this.orgRepo.existsByOrgName(data.org_name);
		if (existsByName) {
			throw new Error("组织名称已存在");
		}

		// 检查组织编码是否已存在
		const existsByCode = await this.orgRepo.existsByOrgCode(data.org_code);
		if (existsByCode) {
			throw new Error("组织编码已存在");
		}

		return await this.orgRepo.create(data);
	}

	/**
	 * 更新组织
	 */
	async update(id: number, data: UpdateOrgDto): Promise<void> {
		// 检查组织是否存在
		const org = await this.orgRepo.findById(id);
		if (!org) {
			throw new Error("组织不存在");
		}

		// 检查组织名称是否被其他组织占用
		if (data.org_name) {
			const exists = await this.orgRepo.existsByOrgName(data.org_name);
			if (exists && data.org_name !== org.org_name) {
				throw new Error("组织名称已存在");
			}
		}

		// 检查组织编码是否被其他组织占用
		if (data.org_code) {
			const exists = await this.orgRepo.existsByOrgCode(data.org_code);
			if (exists && data.org_code !== org.org_code) {
				throw new Error("组织编码已存在");
			}
		}

		await this.orgRepo.update(id, data);
	}

	/**
	 * 删除组织
	 */
	async delete(id: number): Promise<void> {
		// 检查组织是否存在
		const org = await this.orgRepo.findById(id);
		if (!org) {
			throw new Error("组织不存在");
		}

		await this.orgRepo.delete(id);
	}
}
