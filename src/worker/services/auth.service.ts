/**
 * 认证业务逻辑层
 * 实现登录、登出、获取用户信息等认证相关业务
 */

import { UserRepository } from "../repositories/user.repository";
import { MenuRepository } from "../repositories/menu.repository";
import { RoleRepository } from "../repositories/role.repository";
import { signToken } from "../utils/jwt";
import { verifyPasswordWithUsername } from "../utils/password";
import { appConfig } from "../config";
import type { SysUser, SysMenu, LoginUser } from "../core/types/database";

export interface LoginDto {
	username: string;
	password: string;
}

export interface LoginResult {
	token: string;
	user: LoginUser;
}

export interface UserInfoResult {
	user: Omit<SysUser, "password">;
	permissions: string[];
	menus: SysMenu[];
}

export class AuthService {
	constructor(
		private userRepo: UserRepository,
		private menuRepo: MenuRepository,
		private roleRepo: RoleRepository
	) {}

	/**
	 * 用户登录
	 */
	async login(data: LoginDto, jwtSecret: string, jwtExpiresIn: string): Promise<LoginResult> {
		const { username, password } = data;

		// 业务验证
		if (!username || !password) {
			throw new Error("用户名和密码不能为空");
		}

		// 查询用户
		const user = await this.userRepo.findByUsername(username);
		if (!user) {
			throw new Error("用户名或密码错误");
		}

		// 检查用户状态
		if (user.status === appConfig.user.disabledStatus) {
			throw new Error("账户已被禁用");
		}

		// 验证密码
		const isValid = await verifyPasswordWithUsername(password, username, user.password);
		if (!isValid) {
			throw new Error("用户名或密码错误");
		}

		// 生成 JWT token
		const token = await signToken(
			{
				userId: user.id,
				username: user.username
			},
			jwtSecret,
			jwtExpiresIn
		);

		// 返回用户信息和 token
		return {
			token,
			user: {
				id: user.id,
				username: user.username,
				nickname: user.nickname,
				avatar: user.avatar
			}
		};
	}

	/**
	 * 获取用户信息（包含权限和菜单）
	 */
	async getUserInfo(userId: number): Promise<UserInfoResult> {
		// 查询用户信息
		const user = await this.userRepo.findById(userId);
		if (!user) {
			throw new Error("用户不存在");
		}

		// 改为通过角色判断是否为超级管理员
		const isAdmin = await this.roleRepo.hasAdminRoleByUserId(userId);

		let permissions: string[];
		let menuTree: SysMenu[];

		if (isAdmin) {
			// 超级管理员获取所有权限和菜单
			const allPermissionsResult = await this.menuRepo.findAll();
			const enabledMenus = allPermissionsResult.filter(m => m.menu_status === appConfig.menu.enabledStatus);

			permissions = await this.menuRepo.findAllPermissions();
			menuTree = this.buildMenuTree(enabledMenus);
		} else {
			// 普通用户按角色查询
			permissions = await this.menuRepo.findPermissionsByUserId(userId);
			const menus = await this.menuRepo.findByUserId(userId);
			menuTree = this.buildMenuTree(menus);
		}

		return {
			user,
			permissions,
			menus: menuTree
		};
	}

	/**
	 * 刷新 Token
	 */
	async refreshToken(userId: number, username: string, jwtSecret: string, jwtExpiresIn: string): Promise<string> {
		// 检查用户是否存在
		const user = await this.userRepo.findById(userId);
		if (!user) {
			throw new Error("用户不存在");
		}

		// 生成新 token
		return await signToken(
			{
				userId,
				username
			},
			jwtSecret,
			jwtExpiresIn
		);
	}

	/**
	 * 构建菜单树
	 */
	private buildMenuTree(menus: SysMenu[]): SysMenu[] {
		const buildTree = (parentId: number = 0): SysMenu[] => {
			return menus
				.filter((m) => m.parent_id === parentId)
				.map((m) => ({
					...m,
					children: buildTree(m.id)
				}));
		};

		return buildTree();
	}
}
