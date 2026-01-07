/**
 * 组织服务层
 * 封装组织相关的业务逻辑
 */

import { getOrganizationList, createOrganization, updateOrganization, deleteOrganization } from "../api/organization";
import { handleError, handleSuccess } from "../utils/error-handler";
import type { CreateOrganizationDto, UpdateOrganizationDto, Organization } from "../types";

/**
 * 组织树节点
 */
export interface OrganizationTreeNode extends Organization {
	children: OrganizationTreeNode[];
}

/**
 * 获取组织树形结构
 * 将扁平的组织列表转换为树形结构
 */
export async function fetchOrganizationTree(): Promise<OrganizationTreeNode[]> {
	try {
		const orgs = await getOrganizationList();

		// 构建组织树
		const buildTree = (parentId: number | null = null): OrganizationTreeNode[] => {
			return orgs
				.filter(org => org.parent_id === parentId)
				.map(org => ({
					...org,
					children: buildTree(org.id)
				}));
		};

		return buildTree();
	} catch (error) {
		handleError(error, "加载组织数据失败");
		throw error;
	}
}

/**
 * 创建组织并显示成功提示
 */
export async function createOrganizationWithFeedback(data: CreateOrganizationDto) {
	try {
		const result = await createOrganization(data);
		handleSuccess("组织创建成功");
		return result;
	} catch (error) {
		handleError(error, "创建组织失败");
		throw error;
	}
}

/**
 * 更新组织并显示成功提示
 */
export async function updateOrganizationWithFeedback(id: number, data: UpdateOrganizationDto) {
	try {
		await updateOrganization(id, data);
		handleSuccess("组织更新成功");
	} catch (error) {
		handleError(error, "更新组织失败");
		throw error;
	}
}

/**
 * 删除组织并显示成功提示
 */
export async function deleteOrganizationWithFeedback(id: number) {
	try {
		await deleteOrganization(id);
		handleSuccess("组织删除成功");
	} catch (error) {
		handleError(error, "删除组织失败");
		throw error;
	}
}
