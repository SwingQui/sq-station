/**
 * 数据库类型定义
 */

// ============================================
// 通用类型
// ============================================

/** 数据库查询结果 */
export interface DbResult<T> {
	results: T[];
	success: boolean;
	meta?: {
		duration?: number;
		rows_read?: number;
		rows_written?: number;
	};
}

/** 数据库执行结果 */
export interface DbExecResult {
	success: boolean;
	meta: {
		row_id?: number | null;
		changes?: number | null;
		last_row_id?: number | null;
	};
}

// ============================================
// 用户表 (sys_user)
// ============================================

export interface SysUser {
	id: number;
	username: string;
	password: string;
	nickname: string | null;
	avatar: string | null;
	email: string | null;
	phone: string | null;
	status: number; // 1=启用, 0=禁用
	created_at?: string;
	updated_at?: string;
}

// ============================================
// 角色表 (sys_role)
// ============================================

export interface SysRole {
	id: number;
	role_name: string;
	role_key: string;
	role_sort: number;
	status: number; // 1=启用, 0=禁用
	remark: string | null;
	created_at?: string;
	updated_at?: string;
}

// ============================================
// 菜单表 (sys_menu)
// ============================================

export interface SysMenu {
	id: number;
	parent_id: number;
	menu_name: string;
	icon: string | null;
	menu_type: string; // M=目录, C=菜单, F=按钮
	route_path: string | null;
	component_path: string | null;
	permission: string | null;
	query_param: string | null;
	is_frame: number;
	sort_order: number;
	menu_visible: number; // 1=显示, 0=隐藏
	menu_status: number; // 1=启用, 0=禁用
	created_at?: string;
	updated_at?: string;
	children?: SysMenu[];
}

// ============================================
// 用户角色关联表 (sys_user_role)
// ============================================

export interface SysUserRole {
	user_id: number;
	role_id: number;
}

// ============================================
// 角色菜单关联表 (sys_role_menu)
// ============================================

export interface SysRoleMenu {
	role_id: number;
	menu_id: number;
}

// ============================================
// 登录用户信息
// ============================================

export interface LoginUser {
	id: number;
	username: string;
	nickname: string | null;
	avatar: string | null;
}

// ============================================
// SQL 查询结果类型
// ============================================

export type SqlRow = Record<string, string | number | null>;

export interface SqlQueryResult {
	columns: string[];
	rows: unknown[][];
}
