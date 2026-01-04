/**
 * 通用类型定义
 */

// import type { Context } from "hono";

// ============================================
// 应用上下文类型
// ============================================

/** 认证用户信息 */
export interface AuthUser {
	userId: number;
	username: string;
	permissions: string[];
}

// ============================================
// HTTP 响应类型
// ============================================

/** 成功响应 */
export interface SuccessResponse<T = any> {
	code: 200;
	data: T;
	msg: string;
}

/** 失败响应 */
export interface FailResponse {
	code: number;
	data: null;
	msg: string;
}

// ============================================
// 分页类型
// ============================================

/** 分页参数 */
export interface PaginationParams {
	page: number;
	pageSize: number;
}

/** 分页响应 */
export interface PaginatedResponse<T> {
	items: T[];
	total: number;
	page: number;
	pageSize: number;
	totalPages: number;
}
