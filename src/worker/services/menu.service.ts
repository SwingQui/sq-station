/**
 * 菜单业务逻辑层
 * 实现菜单相关的业务规则和流程
 */

import { MenuRepository, CreateMenuDto, UpdateMenuDto } from "../repositories/menu.repository";
import { buildMenuTree } from "../utils/tree";
import type { SysMenu } from "../types/database";

export class MenuService {
	constructor(private menuRepo: MenuRepository) {}

	/**
	 * 查询所有菜单（树形结构）
	 */
	async findAllTree(): Promise<SysMenu[]> {
		const menus = await this.menuRepo.findAll();
		return buildMenuTree(menus);
	}

	/**
	 * 查询所有菜单（列表）
	 */
	async findAll(): Promise<SysMenu[]> {
		return await this.menuRepo.findAll();
	}

	/**
	 * 根据 ID 查询菜单
	 */
	async findById(id: number): Promise<SysMenu | null> {
		const menu = await this.menuRepo.findById(id);
		if (!menu) {
			throw new Error("菜单不存在");
		}
		return menu;
	}

	/**
	 * 创建菜单
	 */
	async create(data: CreateMenuDto): Promise<number> {
		// 业务验证
		if (!data.menu_name || !data.menu_type) {
			throw new Error("菜单名称和类型不能为空");
		}

		// 如果指定了父菜单，检查父菜单是否存在
		if (data.parent_id && data.parent_id > 0) {
			const parentMenu = await this.menuRepo.findById(data.parent_id);
			if (!parentMenu) {
				throw new Error("父菜单不存在");
			}
		}

		return await this.menuRepo.create(data);
	}

	/**
	 * 更新菜单
	 */
	async update(id: number, data: UpdateMenuDto): Promise<void> {
		// 检查菜单是否存在
		const menu = await this.menuRepo.findById(id);
		if (!menu) {
			throw new Error("菜单不存在");
		}

		// 如果指定了父菜单，检查父菜单是否存在
		if (data.parent_id !== undefined && data.parent_id > 0) {
			// 不能将菜单设置为自己的子菜单
			if (data.parent_id === id) {
				throw new Error("不能将菜单设置为自己的父菜单");
			}
			const parentMenu = await this.menuRepo.findById(data.parent_id);
			if (!parentMenu) {
				throw new Error("父菜单不存在");
			}
		}

		await this.menuRepo.update(id, data);
	}

	/**
	 * 删除菜单
	 */
	async delete(id: number): Promise<void> {
		// 检查菜单是否存在
		const menu = await this.menuRepo.findById(id);
		if (!menu) {
			throw new Error("菜单不存在");
		}

		// 检查是否有子菜单
		const childCount = await this.menuRepo.countByParentId(id);
		if (childCount > 0) {
			throw new Error("存在子菜单，无法删除");
		}

		await this.menuRepo.delete(id);
	}

	/**
	 * 根据用户 ID 查询菜单（树形结构）
	 */
	async findByUserIdTree(userId: number, isAdmin: boolean): Promise<SysMenu[]> {
		let menus: SysMenu[];

		if (isAdmin) {
			// 超级管理员获取所有启用的菜单
			const allMenus = await this.menuRepo.findAll();
			menus = allMenus.filter(m => m.menu_status === 1);
		} else {
			// 普通用户按角色查询
			menus = await this.menuRepo.findByUserId(userId);
		}

		return buildMenuTree(menus);
	}

	/**
	 * 根据用户 ID 查询权限标识
	 */
	async findPermissionsByUserId(userId: number, isAdmin: boolean): Promise<string[]> {
		if (isAdmin) {
			// 超级管理员获取所有权限
			return await this.menuRepo.findAllPermissions();
		} else {
			// 普通用户按角色查询
			return await this.menuRepo.findPermissionsByUserId(userId);
		}
	}
}
