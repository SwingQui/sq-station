/**
 * 角色菜单关联业务逻辑层
 * 实现角色菜单分配等业务
 */

import { RoleRepository } from "../repositories/role.repository";
import { MenuRepository } from "../repositories/menu.repository";
import { RoleMenuRepository } from "../repositories/role-menu.repository";
import type { SysMenu } from "../types/database";

export class RoleMenuService {
	constructor(
		private roleRepo: RoleRepository,
		private menuRepo: MenuRepository,
		private roleMenuRepo: RoleMenuRepository
	) {}

	/**
	 * 获取角色的菜单列表
	 */
	async getMenusByRoleId(roleId: number): Promise<SysMenu[]> {
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
	async getMenuIdsByRoleId(roleId: number): Promise<number[]> {
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

		// 验证所有菜单是否存在
		for (const menuId of menuIds) {
			const menu = await this.menuRepo.findById(menuId);
			if (!menu) {
				throw new Error(`菜单 ID ${menuId} 不存在`);
			}
		}

		await this.roleMenuRepo.updateRoleMenus(roleId, menuIds);
	}

	/**
	 * 为角色添加菜单
	 */
	async addMenu(roleId: number, menuId: number): Promise<void> {
		// 检查角色是否存在
		const role = await this.roleRepo.findById(roleId);
		if (!role) {
			throw new Error("角色不存在");
		}

		// 检查菜单是否存在
		const menu = await this.menuRepo.findById(menuId);
		if (!menu) {
			throw new Error("菜单不存在");
		}

		// 检查是否已存在关联
		const exists = await this.roleMenuRepo.hasMenu(roleId, menuId);
		if (exists) {
			throw new Error("角色已拥有该菜单");
		}

		await this.roleMenuRepo.addMenuForRole(roleId, menuId);
	}

	/**
	 * 移除角色的菜单
	 */
	async removeMenu(roleId: number, menuId: number): Promise<void> {
		// 检查角色是否存在
		const role = await this.roleRepo.findById(roleId);
		if (!role) {
			throw new Error("角色不存在");
		}

		// 检查关联是否存在
		const exists = await this.roleMenuRepo.hasMenu(roleId, menuId);
		if (!exists) {
			throw new Error("角色未拥有该菜单");
		}

		await this.roleMenuRepo.removeMenuFromRole(roleId, menuId);
	}
}
