/**
 * 权限常量定义
 * 统一定义所有权限标识，前后端共享
 * 权限格式：模块:子模块:操作
 *
 * 命名规范：
 * - 标准CRUD操作: read/create/update/delete
 * - 特殊业务权限: 使用描述性操作名（如 assignRoles, resetSecret）
 */

/**
 * 权限常量
 * 使用 const assert 确保类型安全
 */
export const Permission = {
	// ==================== 系统管理模块 ====================
	// 用户管理
	SYSTEM_USER_READ: 'system:user:read',
	SYSTEM_USER_CREATE: 'system:user:create',
	SYSTEM_USER_UPDATE: 'system:user:update',
	SYSTEM_USER_DELETE: 'system:user:delete',
	SYSTEM_USER_ASSIGN_ROLES: 'system:user:assignRoles',
	SYSTEM_USER_ASSIGN_PERMISSIONS: 'system:user:assignPermissions',
	SYSTEM_USER_ASSIGN_ORGS: 'system:user:assignOrgs',

	// 角色管理
	SYSTEM_ROLE_READ: 'system:role:read',
	SYSTEM_ROLE_CREATE: 'system:role:create',
	SYSTEM_ROLE_UPDATE: 'system:role:update',
	SYSTEM_ROLE_DELETE: 'system:role:delete',
	SYSTEM_ROLE_ASSIGN_MENUS: 'system:role:assignMenus',
	SYSTEM_ROLE_CONFIG_PERMISSIONS: 'system:role:configPermissions',

	// 菜单管理
	SYSTEM_MENU_READ: 'system:menu:read',
	SYSTEM_MENU_CREATE: 'system:menu:create',
	SYSTEM_MENU_UPDATE: 'system:menu:update',
	SYSTEM_MENU_DELETE: 'system:menu:delete',

	// 组织管理（org → organization）
	SYSTEM_ORGANIZATION_READ: 'system:organization:read',
	SYSTEM_ORGANIZATION_CREATE: 'system:organization:create',
	SYSTEM_ORGANIZATION_UPDATE: 'system:organization:update',
	SYSTEM_ORGANIZATION_DELETE: 'system:organization:delete',

	// SQL 查询工具（仅超级管理员）
	SYSTEM_SQL_QUERY: 'system:sql:query',

	// ==================== OAuth 客户端管理模块 ====================
	OAUTH_CLIENT_READ: 'oauth:client:read',
	OAUTH_CLIENT_CREATE: 'oauth:client:create',
	OAUTH_CLIENT_UPDATE: 'oauth:client:update',
	OAUTH_CLIENT_DELETE: 'oauth:client:delete',
	OAUTH_CLIENT_RESET_SECRET: 'oauth:client:resetSecret',

	// OAuth 权限组管理
	OAUTH_GROUP_READ: 'oauth:group:read',
	OAUTH_GROUP_CREATE: 'oauth:group:create',
	OAUTH_GROUP_UPDATE: 'oauth:group:update',
	OAUTH_GROUP_DELETE: 'oauth:group:delete',

	// ==================== R2 图床模块（简化版）====================
	// 文件管理
	R2_FILE_VIEW: 'r2:file:view',
	R2_FILE_MANAGE: 'r2:file:manage',  // 合并上传和下载
	R2_FILE_DELETE: 'r2:file:delete',

	// 文件夹管理
	R2_FOLDER_VIEW: 'r2:folder:view',
	R2_FOLDER_CREATE: 'r2:folder:create',
	R2_FOLDER_DELETE: 'r2:folder:delete',

	// ==================== 内容管理模块 ====================
	// 文章管理
	CONTENT_ARTICLE_READ: 'content:article:read',
	CONTENT_ARTICLE_CREATE: 'content:article:create',
	CONTENT_ARTICLE_UPDATE: 'content:article:update',
	CONTENT_ARTICLE_DELETE: 'content:article:delete',
	CONTENT_ARTICLE_PUBLISH: 'content:article:publish',

	// 分类管理
	CONTENT_CATEGORY_READ: 'content:category:read',
	CONTENT_CATEGORY_CREATE: 'content:category:create',
	CONTENT_CATEGORY_UPDATE: 'content:category:update',
	CONTENT_CATEGORY_DELETE: 'content:category:delete',

	// ==================== 用户中心模块 ====================
	// 个人信息
	USER_PROFILE_READ: 'user:profile:read',
	USER_PROFILE_UPDATE: 'user:profile:update',
	USER_PASSWORD_UPDATE: 'user:password:update',

	// 通知消息
	USER_NOTIFICATION_READ: 'user:notification:read',
	USER_NOTIFICATION_MARK_READ: 'user:notification:markRead',

	// ==================== 仪表盘模块 ====================
	DASHBOARD_VIEW: 'dashboard:home:view',
	DASHBOARD_STATISTICS: 'dashboard:statistics',

	// ==================== 超级管理员通配符 ====================
	SUPER_ADMIN: '*:*:*',
} as const;

/**
 * 权限类型
 */
export type PermissionKey = typeof Permission[keyof typeof Permission];

/**
 * 权限元数据
 * 用于前端显示权限名称、所属模块等
 */
export const PermissionMeta: Record<PermissionKey, { name: string; module: string; description?: string }> = {
	// 系统管理 - 用户管理
	[Permission.SYSTEM_USER_READ]: { name: '查看用户', module: '系统管理', description: '查看用户列表和详情（包含导出）' },
	[Permission.SYSTEM_USER_CREATE]: { name: '新增用户', module: '系统管理', description: '创建新用户' },
	[Permission.SYSTEM_USER_UPDATE]: { name: '编辑用户', module: '系统管理', description: '编辑用户信息' },
	[Permission.SYSTEM_USER_DELETE]: { name: '删除用户', module: '系统管理', description: '删除用户' },
	[Permission.SYSTEM_USER_ASSIGN_ROLES]: { name: '分配角色', module: '系统管理', description: '为用户分配角色' },
	[Permission.SYSTEM_USER_ASSIGN_PERMISSIONS]: { name: '分配权限', module: '系统管理', description: '为用户分配直接权限' },
	[Permission.SYSTEM_USER_ASSIGN_ORGS]: { name: '分配组织', module: '系统管理', description: '为用户分配组织' },

	// 系统管理 - 角色管理
	[Permission.SYSTEM_ROLE_READ]: { name: '查看角色', module: '系统管理', description: '查看角色列表和详情（包含导出）' },
	[Permission.SYSTEM_ROLE_CREATE]: { name: '新增角色', module: '系统管理', description: '创建新角色' },
	[Permission.SYSTEM_ROLE_UPDATE]: { name: '编辑角色', module: '系统管理', description: '编辑角色信息' },
	[Permission.SYSTEM_ROLE_DELETE]: { name: '删除角色', module: '系统管理', description: '删除角色' },
	[Permission.SYSTEM_ROLE_ASSIGN_MENUS]: { name: '分配菜单', module: '系统管理', description: '为角色分配菜单权限' },
	[Permission.SYSTEM_ROLE_CONFIG_PERMISSIONS]: { name: '配置权限', module: '系统管理', description: '配置角色的权限列表' },

	// 系统管理 - 菜单管理
	[Permission.SYSTEM_MENU_READ]: { name: '查看菜单', module: '系统管理', description: '查看菜单列表和详情' },
	[Permission.SYSTEM_MENU_CREATE]: { name: '新增菜单', module: '系统管理', description: '创建新菜单' },
	[Permission.SYSTEM_MENU_UPDATE]: { name: '编辑菜单', module: '系统管理', description: '编辑菜单信息' },
	[Permission.SYSTEM_MENU_DELETE]: { name: '删除菜单', module: '系统管理', description: '删除菜单' },

	// 系统管理 - 组织管理
	[Permission.SYSTEM_ORGANIZATION_READ]: { name: '查看组织', module: '系统管理', description: '查看组织列表和详情（包含导出）' },
	[Permission.SYSTEM_ORGANIZATION_CREATE]: { name: '新增组织', module: '系统管理', description: '创建新组织' },
	[Permission.SYSTEM_ORGANIZATION_UPDATE]: { name: '编辑组织', module: '系统管理', description: '编辑组织信息' },
	[Permission.SYSTEM_ORGANIZATION_DELETE]: { name: '删除组织', module: '系统管理', description: '删除组织' },

	// 系统管理 - SQL 查询
	[Permission.SYSTEM_SQL_QUERY]: { name: 'SQL 查询', module: '系统管理', description: '执行 SQL 查询（仅超级管理员）' },

	// OAuth - 客户端管理
	[Permission.OAUTH_CLIENT_READ]: { name: '查看客户端', module: 'OAuth', description: '查看客户端列表' },
	[Permission.OAUTH_CLIENT_CREATE]: { name: '新增客户端', module: 'OAuth', description: '创建新客户端' },
	[Permission.OAUTH_CLIENT_UPDATE]: { name: '编辑客户端', module: 'OAuth', description: '编辑客户端信息' },
	[Permission.OAUTH_CLIENT_DELETE]: { name: '删除客户端', module: 'OAuth', description: '删除客户端' },
	[Permission.OAUTH_CLIENT_RESET_SECRET]: { name: '重置密钥', module: 'OAuth', description: '重置客户端密钥' },

	// OAuth - 权限组管理
	[Permission.OAUTH_GROUP_READ]: { name: '查看权限组', module: 'OAuth', description: '查看权限组列表' },
	[Permission.OAUTH_GROUP_CREATE]: { name: '新增权限组', module: 'OAuth', description: '创建新权限组' },
	[Permission.OAUTH_GROUP_UPDATE]: { name: '编辑权限组', module: 'OAuth', description: '编辑权限组信息' },
	[Permission.OAUTH_GROUP_DELETE]: { name: '删除权限组', module: 'OAuth', description: '删除权限组' },

	// R2 - 文件管理
	[Permission.R2_FILE_VIEW]: { name: '查看文件', module: 'R2', description: '查看文件列表和详情' },
	[Permission.R2_FILE_MANAGE]: { name: '文件管理', module: 'R2', description: '上传和下载文件' },
	[Permission.R2_FILE_DELETE]: { name: '删除文件', module: 'R2', description: '删除文件' },

	// R2 - 文件夹管理
	[Permission.R2_FOLDER_VIEW]: { name: '查看文件夹', module: 'R2', description: '查看文件夹列表' },
	[Permission.R2_FOLDER_CREATE]: { name: '创建文件夹', module: 'R2', description: '创建新文件夹' },
	[Permission.R2_FOLDER_DELETE]: { name: '删除文件夹', module: 'R2', description: '删除文件夹' },

	// 内容管理 - 文章管理
	[Permission.CONTENT_ARTICLE_READ]: { name: '查看文章', module: '内容管理', description: '查看文章列表和详情' },
	[Permission.CONTENT_ARTICLE_CREATE]: { name: '新增文章', module: '内容管理', description: '创建新文章' },
	[Permission.CONTENT_ARTICLE_UPDATE]: { name: '编辑文章', module: '内容管理', description: '编辑文章内容' },
	[Permission.CONTENT_ARTICLE_DELETE]: { name: '删除文章', module: '内容管理', description: '删除文章' },
	[Permission.CONTENT_ARTICLE_PUBLISH]: { name: '发布文章', module: '内容管理', description: '发布/取消发布文章' },

	// 内容管理 - 分类管理
	[Permission.CONTENT_CATEGORY_READ]: { name: '查看分类', module: '内容管理', description: '查看分类列表' },
	[Permission.CONTENT_CATEGORY_CREATE]: { name: '新增分类', module: '内容管理', description: '创建新分类' },
	[Permission.CONTENT_CATEGORY_UPDATE]: { name: '编辑分类', module: '内容管理', description: '编辑分类信息' },
	[Permission.CONTENT_CATEGORY_DELETE]: { name: '删除分类', module: '内容管理', description: '删除分类' },

	// 用户中心
	[Permission.USER_PROFILE_READ]: { name: '查看个人信息', module: '用户中心', description: '查看个人资料' },
	[Permission.USER_PROFILE_UPDATE]: { name: '编辑个人信息', module: '用户中心', description: '修改个人资料' },
	[Permission.USER_PASSWORD_UPDATE]: { name: '修改密码', module: '用户中心', description: '修改登录密码' },
	[Permission.USER_NOTIFICATION_READ]: { name: '通知列表', module: '用户中心', description: '查看通知消息' },
	[Permission.USER_NOTIFICATION_MARK_READ]: { name: '标记通知已读', module: '用户中心', description: '标记通知为已读' },

	// 仪表盘
	[Permission.DASHBOARD_VIEW]: { name: '查看仪表盘', module: '仪表盘', description: '访问仪表盘页面' },
	[Permission.DASHBOARD_STATISTICS]: { name: '查看统计数据', module: '仪表盘', description: '查看系统统计数据' },

	// 超级管理员
	[Permission.SUPER_ADMIN]: { name: '超级管理员', module: '系统', description: '拥有所有权限' },
};

/**
 * 按模块分组的权限
 * 用于前端权限配置界面
 */
export const PermissionGroups: Record<string, PermissionKey[]> = {
	'系统管理': [
		Permission.SYSTEM_USER_READ,
		Permission.SYSTEM_USER_CREATE,
		Permission.SYSTEM_USER_UPDATE,
		Permission.SYSTEM_USER_DELETE,
		Permission.SYSTEM_USER_ASSIGN_ROLES,
		Permission.SYSTEM_USER_ASSIGN_PERMISSIONS,
		Permission.SYSTEM_USER_ASSIGN_ORGS,
		Permission.SYSTEM_ROLE_READ,
		Permission.SYSTEM_ROLE_CREATE,
		Permission.SYSTEM_ROLE_UPDATE,
		Permission.SYSTEM_ROLE_DELETE,
		Permission.SYSTEM_ROLE_ASSIGN_MENUS,
		Permission.SYSTEM_ROLE_CONFIG_PERMISSIONS,
		Permission.SYSTEM_MENU_READ,
		Permission.SYSTEM_MENU_CREATE,
		Permission.SYSTEM_MENU_UPDATE,
		Permission.SYSTEM_MENU_DELETE,
		Permission.SYSTEM_ORGANIZATION_READ,
		Permission.SYSTEM_ORGANIZATION_CREATE,
		Permission.SYSTEM_ORGANIZATION_UPDATE,
		Permission.SYSTEM_ORGANIZATION_DELETE,
		Permission.SYSTEM_SQL_QUERY,
	],
	'OAuth': [
		Permission.OAUTH_CLIENT_READ,
		Permission.OAUTH_CLIENT_CREATE,
		Permission.OAUTH_CLIENT_UPDATE,
		Permission.OAUTH_CLIENT_DELETE,
		Permission.OAUTH_CLIENT_RESET_SECRET,
		Permission.OAUTH_GROUP_READ,
		Permission.OAUTH_GROUP_CREATE,
		Permission.OAUTH_GROUP_UPDATE,
		Permission.OAUTH_GROUP_DELETE,
	],
	'R2': [
		Permission.R2_FILE_VIEW,
		Permission.R2_FILE_MANAGE,
		Permission.R2_FILE_DELETE,
		Permission.R2_FOLDER_VIEW,
		Permission.R2_FOLDER_CREATE,
		Permission.R2_FOLDER_DELETE,
	],
	'内容管理': [
		Permission.CONTENT_ARTICLE_READ,
		Permission.CONTENT_ARTICLE_CREATE,
		Permission.CONTENT_ARTICLE_UPDATE,
		Permission.CONTENT_ARTICLE_DELETE,
		Permission.CONTENT_ARTICLE_PUBLISH,
		Permission.CONTENT_CATEGORY_READ,
		Permission.CONTENT_CATEGORY_CREATE,
		Permission.CONTENT_CATEGORY_UPDATE,
		Permission.CONTENT_CATEGORY_DELETE,
	],
	'用户中心': [
		Permission.USER_PROFILE_READ,
		Permission.USER_PROFILE_UPDATE,
		Permission.USER_PASSWORD_UPDATE,
		Permission.USER_NOTIFICATION_READ,
		Permission.USER_NOTIFICATION_MARK_READ,
	],
	'仪表盘': [
		Permission.DASHBOARD_VIEW,
		Permission.DASHBOARD_STATISTICS,
	],
};

/**
 * 检查是否为超级管理员权限
 */
export function isSuperAdminPermission(permission: string): boolean {
	return permission === Permission.SUPER_ADMIN;
}

/**
 * 检查权限是否匹配（支持通配符）
 * @param userPermission 用户拥有的权限
 * @param requiredPermission 需要的权限
 */
export function matchPermission(userPermission: string, requiredPermission: string): boolean {
	// 超级管理员通配符
	if (userPermission === Permission.SUPER_ADMIN) {
		return true;
	}

	// 完全匹配
	if (userPermission === requiredPermission) {
		return true;
	}

	// 支持通配符匹配（如 system:user:* 匹配 system:user:read）
	const userParts = userPermission.split(':');
	const requiredParts = requiredPermission.split(':');

	for (let i = 0; i < userParts.length; i++) {
		if (userParts[i] === '*') {
			return true;
		}
		if (userParts[i] !== requiredParts[i]) {
			return false;
		}
	}

	return true;
}
