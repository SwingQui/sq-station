/**
 * 用户业务逻辑层
 * 实现用户相关的业务规则和流程
 */

import { UserRepository, CreateUserDto, UpdateUserDto } from "../repositories/user.repository";
import { UserRoleRepository } from "../repositories/user-role.repository";
import { RoleRepository } from "../repositories/role.repository";
import { UserPermissionRepository } from "../repositories/user-permission.repository";
import { UserOrganizationRepository } from "../repositories/user-organization.repository";
import { hashPasswordWithUsername } from "../utils/password";
import type { SysUser, SysRole } from "../core/types/database";

export class UserService {
	constructor(
		private userRepo: UserRepository,
		private userRoleRepo: UserRoleRepository,
		private roleRepo: RoleRepository,
		private userPermRepo: UserPermissionRepository,
		private userOrgRepo: UserOrganizationRepository
	) {}

	/**
	 * 查询所有用户
	 */
	async findAll(): Promise<Omit<SysUser, "password">[]> {
		return await this.userRepo.findAll();
	}

	/**
	 * 根据 ID 查询用户
	 */
	async findById(id: number): Promise<Omit<SysUser, "password"> | null> {
		const user = await this.userRepo.findById(id);
		if (!user) {
			throw new Error("用户不存在");
		}
		return user;
	}

	/**
	 * 根据 ID 查询用户（包含密码，用于认证）
	 */
	async findByIdWithPassword(id: number): Promise<SysUser | null> {
		return await this.userRepo.findByIdWithPassword(id);
	}

	/**
	 * 根据用户名查询用户
	 */
	async findByUsername(username: string): Promise<SysUser | null> {
		return await this.userRepo.findByUsername(username);
	}

	/**
	 * 创建用户
	 */
	async create(data: CreateUserDto): Promise<number> {
		// 业务验证
		if (!data.username || !data.password) {
			throw new Error("用户名和密码不能为空");
		}

		// 检查用户名是否已存在
		const existingUser = await this.userRepo.findByUsername(data.username);
		if (existingUser) {
			throw new Error("用户名已存在");
		}

		// 密码加密
		const hashedPassword = await hashPasswordWithUsername(data.password, data.username);

		return await this.userRepo.create({
			...data,
			password: hashedPassword
		});
	}

	/**
	 * 更新用户
	 */
	async update(id: number, data: UpdateUserDto): Promise<void> {
		// 检查用户是否存在
		const user = await this.userRepo.findById(id);
		if (!user) {
			throw new Error("用户不存在");
		}

		// 业务规则：不能修改拥有超级管理员角色的用户
		const isAdmin = await this.roleRepo.hasAdminRoleByUserId(id);
		if (isAdmin) {
			throw new Error("不能修改拥有超级管理员权限的用户");
		}

		// 检查用户名是否被其他用户占用
		if (data.username) {
			const exists = await this.userRepo.existsByUsernameExcludeId(data.username, id);
			if (exists) {
				throw new Error("用户名已存在");
			}
		}

		// 如果提供了密码，需要加密
		let updateData = { ...data };
		if (data.password && data.password.trim()) {
			updateData.password = await hashPasswordWithUsername(data.password, data.username);
		} else {
			// 移除空密码
			delete updateData.password;
		}

		await this.userRepo.update(id, updateData);
	}

	/**
	 * 删除用户
	 */
	async delete(id: number): Promise<void> {
		// 业务规则：不能删除拥有超级管理员角色的用户
		const isAdmin = await this.roleRepo.hasAdminRoleByUserId(id);
		if (isAdmin) {
			throw new Error("不能删除拥有超级管理员权限的用户");
		}

		// 检查用户是否存在
		const user = await this.userRepo.findById(id);
		if (!user) {
			throw new Error("用户不存在");
		}

		// 删除用户角色关联
		await this.userRoleRepo.removeAllRolesByUserId(id);

		// 删除用户直接权限
		await this.userPermRepo.removeByUserId(id);

		// 删除用户组织关联
		await this.userOrgRepo.removeAllOrgsByUserId(id);

		// 删除用户
		await this.userRepo.delete(id);
	}

	/**
	 * 获取用户的角色列表
	 */
	async getRoles(userId: number): Promise<SysRole[]> {
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

		await this.userRoleRepo.updateUserRoles(userId, roleIds);
	}

	/**
	 * 检查用户是否为超级管理员
	 */
	async isSuperAdmin(userId: number): Promise<boolean> {
		return await this.roleRepo.hasAdminRoleByUserId(userId);
	}
}
