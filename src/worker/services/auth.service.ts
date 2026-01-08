/**
 * 认证业务逻辑层
 * 实现登录、登出、获取用户信息等认证相关业务
 */

import { UserRepository } from "../repositories/user.repository";
import { MenuRepository } from "../repositories/menu.repository";
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
	user: Omit<SysUser, "password" | "roles"> & { is_admin?: boolean; roles: string[] };
	permissions: string[];
	menus: SysMenu[];
}

export class AuthService {
	constructor(
		private userRepo: UserRepository,
		private menuRepo: MenuRepository
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
		if (user.status === appConfig.constants.status.disabled) {
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

		// 获取用户权限（从用户的角色中获取）
		const permissions = await this.menuRepo.findPermissionsByUserId(userId);
		const isAdmin = permissions.includes("*:*:*");

		// 解析用户角色字段
		let roles: string[] = [];
		if (user.roles) {
			try {
				roles = JSON.parse(user.roles);
			} catch (e) {
				console.error("Failed to parse user roles:", user.roles, e);
				roles = [];
			}
		}

		// 获取所有菜单（不过滤状态和可见性，用于权限检查）
		const allMenus = await this.menuRepo.findAll();

		// 为前端过滤侧边栏菜单
		let menuTree: SysMenu[];
		if (isAdmin) {
			// 超级管理员：显示所有启用的菜单（不受 menu_visible 影响）
			const enabledMenus = allMenus.filter(m => m.menu_status === 1);
			menuTree = this.buildMenuTree(enabledMenus);
		} else {
			// 普通用户：只显示可见且启用的菜单
			const visibleMenus = allMenus.filter(m => m.menu_visible === 1 && m.menu_status === 1);
			menuTree = this.buildMenuTree(visibleMenus);
		}

		// 返回用户信息（包含角色）
		const { roles: _roles, ...userWithoutRoles } = user;
		return {
			user: {
				...userWithoutRoles,
				roles,
				is_admin: isAdmin
			},
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
