/**
 * 角色业务逻辑层
 * 实现角色相关的业务规则和流程
 */

import { RoleRepository, CreateRoleDto, UpdateRoleDto } from "../repositories/role.repository";
import { RoleMenuRepository } from "../repositories/role-menu.repository";
import type { SysRole, SysMenu } from "../core/types/database";

export class RoleService {
	constructor(
		private roleRepo: RoleRepository,
		private roleMenuRepo: RoleMenuRepository
	) {}

	/**
	 * 查询所有角色
	 */
	async findAll(): Promise<SysRole[]> {
		return await this.roleRepo.findAll();
	}

	/**
	 * 根据 ID 查询角色
	 */
	async findById(id: number): Promise<SysRole | null> {
		const role = await this.roleRepo.findById(id);
		if (!role) {
			throw new Error("角色不存在");
		}
		return role;
	}

	/**
	 * 创建角色
	 */
	async create(data: CreateRoleDto): Promise<number> {
		// 业务验证
		if (!data.role_name || !data.role_key) {
			throw new Error("角色名称和权限标识不能为空");
		}

		// 检查角色名称是否已存在
		const existsByName = await this.roleRepo.existsByRoleName(data.role_name);
		if (existsByName) {
			throw new Error("角色名称已存在");
		}

		// 检查角色标识是否已存在
		const existsByKey = await this.roleRepo.existsByRoleKey(data.role_key);
		if (existsByKey) {
			throw new Error("角色标识已存在");
		}

		return await this.roleRepo.create(data);
	}

	/**
	 * 更新角色
	 */
	async update(id: number, data: UpdateRoleDto): Promise<void> {
		// 检查角色是否存在
		const role = await this.roleRepo.findById(id);
		if (!role) {
			throw new Error("角色不存在");
		}

		// 业务规则：ID=1 的超级管理员角色不能修改
		if (id === 1 || role.is_admin === 1) {
			throw new Error("系统管理员角色不能修改");
		}

		// 业务规则：不能修改超级管理员角色的 role_key
		if (data.role_key && role.is_admin === 1) {
			throw new Error("系统管理员角色的权限标识不能修改");
		}

		// 检查角色名称是否被其他角色占用
		if (data.role_name) {
			const exists = await this.roleRepo.existsByRoleNameExcludeId(data.role_name, id);
			if (exists) {
				throw new Error("角色名称已存在");
			}
		}

		// 检查角色标识是否被其他角色占用
		if (data.role_key) {
			const exists = await this.roleRepo.existsByRoleKeyExcludeId(data.role_key, id);
			if (exists) {
				throw new Error("角色标识已存在");
			}
		}

		await this.roleRepo.update(id, data);
	}

	/**
	 * 删除角色
	 */
	async delete(id: number): Promise<void> {
		// 业务规则：ID=1 的系统管理员角色不能删除
		if (id === 1) {
			throw new Error("系统管理员角色不能删除");
		}

		// 检查角色是否存在
		const role = await this.roleRepo.findById(id);
		if (!role) {
			throw new Error("角色不存在");
		}

		// 业务规则：不能删除超级管理员角色
		if (role.is_admin === 1) {
			throw new Error("系统管理员角色不能删除");
		}

		// 删除角色菜单关联
		await this.roleMenuRepo.removeAllMenusByRoleId(id);

		// 删除角色
		await this.roleRepo.delete(id);
	}

	/**
	 * 获取角色的菜单列表
	 */
	async getMenus(roleId: number): Promise<SysMenu[]> {
		// 检查角色是否存在
		const role = await this.roleRepo.findById(roleId);
		if (!role) {
			throw new Error("角色不存在");
		}

		return await this.roleMenuRepo.findMenusByRoleId(roleId);
	}

	/**
	 * 获取角色的菜单 ID 列表
	 */
	async getMenuIds(roleId: number): Promise<number[]> {
		// 检查角色是否存在
		const role = await this.roleRepo.findById(roleId);
		if (!role) {
			throw new Error("角色不存在");
		}

		return await this.roleMenuRepo.findMenuIdsByRoleId(roleId);
	}

	/**
	 * 为角色分配菜单
	 */
	async assignMenus(roleId: number, menuIds: number[]): Promise<void> {
		// 检查角色是否存在
		const role = await this.roleRepo.findById(roleId);
		if (!role) {
			throw new Error("角色不存在");
		}

		await this.roleMenuRepo.updateRoleMenus(roleId, menuIds);
	}
}
