/**
 * 角色服务层
 * 封装角色相关的业务逻辑
 */

import { createRole, updateRole, deleteRole, getRoleMenuIds, assignRoleMenus } from "../api/role";
import { handleError, handleSuccess } from "../utils/error-handler";
import type { CreateRoleDto, UpdateRoleDto } from "../types";

/**
 * 创建角色并显示成功提示
 */
export async function createRoleWithFeedback(data: CreateRoleDto) {
	try {
		const result = await createRole(data);
		handleSuccess("角色创建成功");
		return result;
	} catch (error) {
		handleError(error, "创建角色失败");
		throw error;
	}
}

/**
 * 更新角色并显示成功提示
 */
export async function updateRoleWithFeedback(id: number, data: UpdateRoleDto) {
	try {
		await updateRole(id, data);
		handleSuccess("角色更新成功");
	} catch (error) {
		handleError(error, "更新角色失败");
		throw error;
	}
}

/**
 * 删除角色并显示成功提示
 */
export async function deleteRoleWithFeedback(id: number) {
	try {
		await deleteRole(id);
		handleSuccess("角色删除成功");
	} catch (error) {
		handleError(error, "删除角色失败");
		throw error;
	}
}

/**
 * 获取角色菜单ID列表
 */
export async function fetchRoleMenuIds(roleId: number): Promise<number[]> {
	try {
		return await getRoleMenuIds(roleId);
	} catch (error) {
		handleError(error, "加载角色菜单失败");
		throw error;
	}
}

/**
 * 为角色分配菜单并显示成功提示
 */
export async function assignRoleMenusWithFeedback(roleId: number, menuIds: number[]) {
	try {
		await assignRoleMenus(roleId, menuIds);
		handleSuccess("菜单分配成功");
	} catch (error) {
		handleError(error, "分配菜单失败");
		throw error;
	}
}
