/**
 * 服务层统一导出
 * 提供高内聚、低耦合的业务逻辑封装
 *
 * @module services
 * @description Service 层负责封装跨模块的业务逻辑，提供统一的错误处理和用户反馈
 *
 * 架构说明：
 * - API 层：直接调用后端接口，处理 HTTP 请求和响应
 * - Service 层：组合多个 API 调用，封装业务逻辑，处理错误和用户反馈
 * - 组件层：调用 Service 层，处理 UI 渲染和用户交互
 *
 * 优势：
 * - 业务逻辑集中管理，易于维护和复用
 * - 组件代码更简洁，专注于 UI
 * - 统一的错误处理和用户反馈
 * - 便于单元测试
 */

// ==================== 用户服务 ====================
export {
	fetchUsersWithOrg,
	createUserWithFeedback,
	updateUserWithFeedback,
	deleteUserWithFeedback,
	fetchUserRolesWithInfo,
	assignUserRolesWithFeedback,
	type UserWithOrgName,
} from "./user.service";

// ==================== 角色服务 ====================
export {
	createRoleWithFeedback,
	updateRoleWithFeedback,
	deleteRoleWithFeedback,
	fetchRoleMenuIds,
	assignRoleMenusWithFeedback,
} from "./role.service";

// ==================== 组织服务 ====================
export {
	fetchOrganizationTree,
	createOrganizationWithFeedback,
	updateOrganizationWithFeedback,
	deleteOrganizationWithFeedback,
	type OrganizationTreeNode,
} from "./organization.service";
