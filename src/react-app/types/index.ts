/**
 * API 类型定义
 * 统一管理所有 API 相关的类型定义
 */

// ==================== 用户类型 ====================
export interface User {
	id: number;
	username: string;
	nickname: string | null;
	email: string | null;
	phone: string | null;
	avatar: string | null;
	status: number;
	remark: string | null;
	created_at: string;
	updated_at?: string;
	organization_id?: number;
}

/**
 * 用户角色关联类型
 */
export interface UserRoleDto {
	id: number;
	username: string;
	nickname?: string;
}

export interface CreateUserDto {
	username: string;
	password: string;
	nickname?: string;
	email?: string;
	phone?: string;
	avatar?: string;
	status?: number;
	remark?: string;
}

export interface UpdateUserDto {
	username: string;
	password?: string;
	nickname?: string;
	email?: string;
	phone?: string;
	avatar?: string;
	status?: number;
	remark?: string;
}

// ==================== 角色类型 ====================
export interface Role {
	id: number;
	role_name: string;
	role_key: string;
	sort_order: number;
	status: number;
	is_admin?: number;
	permissions?: string; // JSON 字符串数组，如 '["system:user:list","system:role:add"]'
	remark: string | null;
	created_at: string;
	updated_at?: string;
}

export interface CreateRoleDto {
	role_name: string;
	role_key: string;
	sort_order?: number;
	status?: number;
	permissions?: string;
	remark?: string;
}

export interface UpdateRoleDto {
	role_name: string;
	role_key: string;
	sort_order?: number;
	status?: number;
	permissions?: string;
	remark?: string;
}

// ==================== 菜单类型 ====================
export interface Menu {
	id: number;
	parent_id: number;
	menu_name: string;
	menu_type: "M" | "C" | "F"; // M=目录, C=菜单, F=按钮
	route_path: string | null;
	component_path: string | null;
	redirect: string | null;
	query_param: string | null;
	is_frame: number;
	is_cache: number;
	menu_visible: number;
	menu_status: number;
	icon: string | null;
	sort_order: number;
	permission: string | null;
	created_at: string;
	updated_at?: string;
	children?: Menu[];
}

export interface CreateMenuDto {
	parent_id?: number;
	menu_name: string;
	menu_type: "M" | "C" | "F";
	route_path?: string;
	component_path?: string;
	redirect?: string;
	query_param?: string;
	is_frame?: number;
	is_cache?: number;
	menu_visible?: number;
	menu_status?: number;
	icon?: string;
	sort_order?: number;
	permission?: string;
}

export interface UpdateMenuDto {
	parent_id?: number;
	menu_name: string;
	menu_type: "M" | "C" | "F";
	route_path?: string;
	component_path?: string;
	redirect?: string;
	query_param?: string;
	is_frame?: number;
	is_cache?: number;
	menu_visible?: number;
	menu_status?: number;
	icon?: string;
	sort_order?: number;
	permission?: string;
}

// ==================== 认证类型 ====================
export interface LoginDto {
	username: string;
	password: string;
}

export interface LoginResponse {
	token: string;
	user: {
		id: number;
		username: string;
		nickname: string | null;
	};
}

export interface UserInfoResponse {
	user: {
		id: number;
		username: string;
		nickname: string | null;
	};
	menus: Menu[];
	permissions: string[];
}

// ==================== 组织类型 ====================
export interface Organization {
	id: number;
	org_name: string;
	org_code: string;
	parent_id?: number;
	sort_order: number;
	status: number;
	remark: string | null;
	created_at?: string;
	updated_at?: string;
}

export interface CreateOrganizationDto {
	org_name: string;
	org_code: string;
	parent_id?: number;
	sort_order?: number;
	status?: number;
	remark?: string | null;
}

export interface UpdateOrganizationDto {
	org_name?: string;
	org_code?: string;
	parent_id?: number;
	sort_order?: number;
	status?: number;
	remark?: string | null;
}
