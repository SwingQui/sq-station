/**
 * 用户角色关联业务逻辑层
 * 实现用户角色分配等业务
 */

import { UserRepository } from "../repositories/user.repository";
import { RoleRepository } from "../repositories/role.repository";
import { UserRoleRepository } from "../repositories/user-role.repository";
import type { SysRole } from "../types/database";

export class UserRoleService {
	constructor(
		private userRepo: UserRepository,
		private roleRepo: RoleRepository,
		private userRoleRepo: UserRoleRepository
	) {}

	/**
	 * 获取用户的角色列表
	 */
	async getRolesByUserId(userId: number): Promise<SysRole[]> {
		// 检查用户是否存在
		const user = await this.userRepo.findById(userId);
		if (!user) {
			throw new Error("用户不存在");
		}

		return await this.userRoleRepo.findRolesByUserId(userId);
	}

	/**
	 * 为用户分配角色
	 */
	async assignRoles(userId: number, roleIds: number[]): Promise<void> {
		// 检查用户是否存在
		const user = await this.userRepo.findById(userId);
		if (!user) {
			throw new Error("用户不存在");
		}

		// 验证所有角色是否存在
		for (const roleId of roleIds) {
			const role = await this.roleRepo.findById(roleId);
			if (!role) {
				throw new Error(`角色 ID ${roleId} 不存在`);
			}
		}

		await this.userRoleRepo.updateUserRoles(userId, roleIds);
	}

	/**
	 * 为用户添加角色
	 */
	async addRole(userId: number, roleId: number): Promise<void> {
		// 检查用户是否存在
		const user = await this.userRepo.findById(userId);
		if (!user) {
			throw new Error("用户不存在");
		}

		// 检查角色是否存在
		const role = await this.roleRepo.findById(roleId);
		if (!role) {
			throw new Error("角色不存在");
		}

		// 检查是否已存在关联
		const exists = await this.userRoleRepo.hasRole(userId, roleId);
		if (exists) {
			throw new Error("用户已拥有该角色");
		}

		await this.userRoleRepo.addRoleForUser(userId, roleId);
	}

	/**
	 * 移除用户的角色
	 */
	async removeRole(userId: number, roleId: number): Promise<void> {
		// 检查用户是否存在
		const user = await this.userRepo.findById(userId);
		if (!user) {
			throw new Error("用户不存在");
		}

		// 检查关联是否存在
		const exists = await this.userRoleRepo.hasRole(userId, roleId);
		if (!exists) {
			throw new Error("用户未拥有该角色");
		}

		await this.userRoleRepo.removeRoleFromUser(userId, roleId);
	}
}
