/**
 * 权限常量定义
 * 统一定义所有权限标识，前后端共享
 * 权限格式：模块:子模块:操作
 */

/**
 * 权限常量
 * 使用 const assert 确保类型安全
 */
export const Permission = {
	// ==================== 系统管理模块 ====================
	// 用户管理
	SYSTEM_USER_LIST: 'system:user:list',
	SYSTEM_USER_ADD: 'system:user:add',
	SYSTEM_USER_EDIT: 'system:user:edit',
	SYSTEM_USER_DELETE: 'system:user:delete',
	SYSTEM_USER_VIEW: 'system:user:view',
	SYSTEM_USER_ASSIGN_ROLES: 'system:user:assignRoles',
	SYSTEM_USER_ASSIGN_PERMISSIONS: 'system:user:assignPermissions',
	SYSTEM_USER_ASSIGN_ORGS: 'system:user:assignOrgs',

	// 角色管理
	SYSTEM_ROLE_LIST: 'system:role:list',
	SYSTEM_ROLE_ADD: 'system:role:add',
	SYSTEM_ROLE_EDIT: 'system:role:edit',
	SYSTEM_ROLE_DELETE: 'system:role:delete',
	SYSTEM_ROLE_VIEW: 'system:role:view',
	SYSTEM_ROLE_ASSIGN_MENUS: 'system:role:assignMenus',
	SYSTEM_ROLE_CONFIG_PERMISSIONS: 'system:role:configPermissions',

	// 菜单管理
	SYSTEM_MENU_LIST: 'system:menu:list',
	SYSTEM_MENU_ADD: 'system:menu:add',
	SYSTEM_MENU_EDIT: 'system:menu:edit',
	SYSTEM_MENU_DELETE: 'system:menu:delete',
	SYSTEM_MENU_VIEW: 'system:menu:view',

	// 组织管理
	SYSTEM_ORG_LIST: 'system:org:list',
	SYSTEM_ORG_ADD: 'system:org:add',
	SYSTEM_ORG_EDIT: 'system:org:edit',
	SYSTEM_ORG_DELETE: 'system:org:delete',
	SYSTEM_ORG_VIEW: 'system:org:view',

	// SQL 查询工具（仅超级管理员）
	SYSTEM_SQL_QUERY: 'system:sql:query',

	// ==================== 内容管理模块 ====================
	// 文章管理
	CONTENT_ARTICLE_LIST: 'content:article:list',
	CONTENT_ARTICLE_ADD: 'content:article:add',
	CONTENT_ARTICLE_EDIT: 'content:article:edit',
	CONTENT_ARTICLE_DELETE: 'content:article:delete',
	CONTENT_ARTICLE_VIEW: 'content:article:view',
	CONTENT_ARTICLE_PUBLISH: 'content:article:publish',

	// 分类管理
	CONTENT_CATEGORY_LIST: 'content:category:list',
	CONTENT_CATEGORY_ADD: 'content:category:add',
	CONTENT_CATEGORY_EDIT: 'content:category:edit',
	CONTENT_CATEGORY_DELETE: 'content:category:delete',

	// ==================== 用户中心模块 ====================
	// 个人信息
	USER_PROFILE_VIEW: 'user:profile:view',
	USER_PROFILE_EDIT: 'user:profile:edit',
	USER_PASSWORD_CHANGE: 'user:password:change',

	// 通知消息
	USER_NOTIFICATION_LIST: 'user:notification:list',
	USER_NOTIFICATION_READ: 'user:notification:read',

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
	[Permission.SYSTEM_USER_LIST]: { name: '用户列表', module: '系统管理', description: '查看用户列表' },
	[Permission.SYSTEM_USER_ADD]: { name: '新增用户', module: '系统管理', description: '创建新用户' },
	[Permission.SYSTEM_USER_EDIT]: { name: '编辑用户', module: '系统管理', description: '编辑用户信息' },
	[Permission.SYSTEM_USER_DELETE]: { name: '删除用户', module: '系统管理', description: '删除用户' },
	[Permission.SYSTEM_USER_VIEW]: { name: '查看用户', module: '系统管理', description: '查看用户详情' },
	[Permission.SYSTEM_USER_ASSIGN_ROLES]: { name: '分配角色', module: '系统管理', description: '为用户分配角色' },
	[Permission.SYSTEM_USER_ASSIGN_PERMISSIONS]: { name: '分配权限', module: '系统管理', description: '为用户分配直接权限' },
	[Permission.SYSTEM_USER_ASSIGN_ORGS]: { name: '分配组织', module: '系统管理', description: '为用户分配组织' },

	// 系统管理 - 角色管理
	[Permission.SYSTEM_ROLE_LIST]: { name: '角色列表', module: '系统管理', description: '查看角色列表' },
	[Permission.SYSTEM_ROLE_ADD]: { name: '新增角色', module: '系统管理', description: '创建新角色' },
	[Permission.SYSTEM_ROLE_EDIT]: { name: '编辑角色', module: '系统管理', description: '编辑角色信息' },
	[Permission.SYSTEM_ROLE_DELETE]: { name: '删除角色', module: '系统管理', description: '删除角色' },
	[Permission.SYSTEM_ROLE_VIEW]: { name: '查看角色', module: '系统管理', description: '查看角色详情' },
	[Permission.SYSTEM_ROLE_ASSIGN_MENUS]: { name: '分配菜单', module: '系统管理', description: '为角色分配菜单权限' },
	[Permission.SYSTEM_ROLE_CONFIG_PERMISSIONS]: { name: '配置权限', module: '系统管理', description: '配置角色的权限列表' },

	// 系统管理 - 菜单管理
	[Permission.SYSTEM_MENU_LIST]: { name: '菜单列表', module: '系统管理', description: '查看菜单列表' },
	[Permission.SYSTEM_MENU_ADD]: { name: '新增菜单', module: '系统管理', description: '创建新菜单' },
	[Permission.SYSTEM_MENU_EDIT]: { name: '编辑菜单', module: '系统管理', description: '编辑菜单信息' },
	[Permission.SYSTEM_MENU_DELETE]: { name: '删除菜单', module: '系统管理', description: '删除菜单' },
	[Permission.SYSTEM_MENU_VIEW]: { name: '查看菜单', module: '系统管理', description: '查看菜单详情' },

	// 系统管理 - 组织管理
	[Permission.SYSTEM_ORG_LIST]: { name: '组织列表', module: '系统管理', description: '查看组织列表' },
	[Permission.SYSTEM_ORG_ADD]: { name: '新增组织', module: '系统管理', description: '创建新组织' },
	[Permission.SYSTEM_ORG_EDIT]: { name: '编辑组织', module: '系统管理', description: '编辑组织信息' },
	[Permission.SYSTEM_ORG_DELETE]: { name: '删除组织', module: '系统管理', description: '删除组织' },
	[Permission.SYSTEM_ORG_VIEW]: { name: '查看组织', module: '系统管理', description: '查看组织详情' },

	// 系统管理 - SQL 查询
	[Permission.SYSTEM_SQL_QUERY]: { name: 'SQL 查询', module: '系统管理', description: '执行 SQL 查询（仅超级管理员）' },

	// 内容管理 - 文章管理
	[Permission.CONTENT_ARTICLE_LIST]: { name: '文章列表', module: '内容管理', description: '查看文章列表' },
	[Permission.CONTENT_ARTICLE_ADD]: { name: '新增文章', module: '内容管理', description: '创建新文章' },
	[Permission.CONTENT_ARTICLE_EDIT]: { name: '编辑文章', module: '内容管理', description: '编辑文章内容' },
	[Permission.CONTENT_ARTICLE_DELETE]: { name: '删除文章', module: '内容管理', description: '删除文章' },
	[Permission.CONTENT_ARTICLE_VIEW]: { name: '查看文章', module: '内容管理', description: '查看文章详情' },
	[Permission.CONTENT_ARTICLE_PUBLISH]: { name: '发布文章', module: '内容管理', description: '发布/取消发布文章' },

	// 内容管理 - 分类管理
	[Permission.CONTENT_CATEGORY_LIST]: { name: '分类列表', module: '内容管理', description: '查看分类列表' },
	[Permission.CONTENT_CATEGORY_ADD]: { name: '新增分类', module: '内容管理', description: '创建新分类' },
	[Permission.CONTENT_CATEGORY_EDIT]: { name: '编辑分类', module: '内容管理', description: '编辑分类信息' },
	[Permission.CONTENT_CATEGORY_DELETE]: { name: '删除分类', module: '内容管理', description: '删除分类' },

	// 用户中心
	[Permission.USER_PROFILE_VIEW]: { name: '查看个人信息', module: '用户中心', description: '查看个人资料' },
	[Permission.USER_PROFILE_EDIT]: { name: '编辑个人信息', module: '用户中心', description: '修改个人资料' },
	[Permission.USER_PASSWORD_CHANGE]: { name: '修改密码', module: '用户中心', description: '修改登录密码' },
	[Permission.USER_NOTIFICATION_LIST]: { name: '通知列表', module: '用户中心', description: '查看通知消息' },
	[Permission.USER_NOTIFICATION_READ]: { name: '标记通知已读', module: '用户中心', description: '标记通知为已读' },

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
		Permission.SYSTEM_USER_LIST,
		Permission.SYSTEM_USER_ADD,
		Permission.SYSTEM_USER_EDIT,
		Permission.SYSTEM_USER_DELETE,
		Permission.SYSTEM_USER_VIEW,
		Permission.SYSTEM_USER_ASSIGN_ROLES,
		Permission.SYSTEM_USER_ASSIGN_PERMISSIONS,
		Permission.SYSTEM_USER_ASSIGN_ORGS,
		Permission.SYSTEM_ROLE_LIST,
		Permission.SYSTEM_ROLE_ADD,
		Permission.SYSTEM_ROLE_EDIT,
		Permission.SYSTEM_ROLE_DELETE,
		Permission.SYSTEM_ROLE_VIEW,
		Permission.SYSTEM_ROLE_ASSIGN_MENUS,
		Permission.SYSTEM_ROLE_CONFIG_PERMISSIONS,
		Permission.SYSTEM_MENU_LIST,
		Permission.SYSTEM_MENU_ADD,
		Permission.SYSTEM_MENU_EDIT,
		Permission.SYSTEM_MENU_DELETE,
		Permission.SYSTEM_MENU_VIEW,
		Permission.SYSTEM_ORG_LIST,
		Permission.SYSTEM_ORG_ADD,
		Permission.SYSTEM_ORG_EDIT,
		Permission.SYSTEM_ORG_DELETE,
		Permission.SYSTEM_ORG_VIEW,
		Permission.SYSTEM_SQL_QUERY,
	],
	'内容管理': [
		Permission.CONTENT_ARTICLE_LIST,
		Permission.CONTENT_ARTICLE_ADD,
		Permission.CONTENT_ARTICLE_EDIT,
		Permission.CONTENT_ARTICLE_DELETE,
		Permission.CONTENT_ARTICLE_VIEW,
		Permission.CONTENT_ARTICLE_PUBLISH,
		Permission.CONTENT_CATEGORY_LIST,
		Permission.CONTENT_CATEGORY_ADD,
		Permission.CONTENT_CATEGORY_EDIT,
		Permission.CONTENT_CATEGORY_DELETE,
	],
	'用户中心': [
		Permission.USER_PROFILE_VIEW,
		Permission.USER_PROFILE_EDIT,
		Permission.USER_PASSWORD_CHANGE,
		Permission.USER_NOTIFICATION_LIST,
		Permission.USER_NOTIFICATION_READ,
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

	// 支持通配符匹配（如 system:user:* 匹配 system:user:list）
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
