/**
 * 应用标准化错误类型
 * 提供可区分的错误类别，便于错误处理和类型守卫
 */

/**
 * 认证错误 (401)
 */
export class AuthenticationError extends Error {
	readonly statusCode: number;
	readonly isAuthError = true;

	constructor(message: string = "未登录或登录已过期", statusCode: number = 401) {
		super(message);
		this.name = "AuthenticationError";
		this.statusCode = statusCode;
	}
}

/**
 * 网络错误
 */
export class NetworkError extends Error {
	readonly isNetworkError = true;

	constructor(message: string = "网络连接失败") {
		super(message);
		this.name = "NetworkError";
	}
}

/**
 * 超时错误
 */
export class TimeoutError extends Error {
	readonly isTimeoutError = true;

	constructor(message: string = "请求超时") {
		super(message);
		this.name = "TimeoutError";
	}
}

/**
 * 类型守卫：检查是否为认证错误
 */
export function isAuthenticationError(error: unknown): error is AuthenticationError {
	return (
		error instanceof Error &&
		"isAuthError" in error &&
		(error as AuthenticationError).isAuthError === true
	);
}

/**
 * 类型守卫：检查是否为网络错误
 */
export function isNetworkError(error: unknown): error is NetworkError {
	return (
		error instanceof Error &&
		"isNetworkError" in error &&
		(error as NetworkError).isNetworkError === true
	);
}

/**
 * 类型守卫：检查是否为超时错误
 */
export function isTimeoutError(error: unknown): error is TimeoutError {
	return (
		error instanceof Error &&
		"isTimeoutError" in error &&
		(error as TimeoutError).isTimeoutError === true
	);
}
