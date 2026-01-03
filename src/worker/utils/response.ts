/**
 * 统一API响应格式工具
 */

export interface ApiResponse<T = any> {
	code: number;
	data: T;
	msg: string;
}

/**
 * 成功响应
 * @param data 返回数据
 * @param msg 提示信息
 */
export function success<T>(data: T, msg = "操作成功"): ApiResponse<T> {
	return { code: 200, data, msg };
}

/**
 * 失败响应
 * @param code 错误码
 * @param msg 错误信息
 */
export function fail(code = 500, msg = "操作失败"): ApiResponse<null> {
	return { code, data: null, msg };
}

/**
 * 参数错误响应
 */
export function badRequest(msg = "参数错误"): ApiResponse<null> {
	return fail(400, msg);
}

/**
 * 未找到响应
 */
export function notFound(msg = "资源不存在"): ApiResponse<null> {
	return fail(404, msg);
}

/**
 * 未授权响应
 */
export function unauthorized(msg = "未授权"): ApiResponse<null> {
	return fail(401, msg);
}

/**
 * 服务器错误响应
 */
export function serverError(msg = "服务器错误"): ApiResponse<null> {
	return fail(500, msg);
}
