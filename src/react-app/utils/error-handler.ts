/**
 * 统一的错误处理工具
 * 使用 Ant Design message 组件替代 alert
 */

import { message } from "antd";

// 防止重复提示
let lastMessage = "";
let lastTime = 0;
const MESSAGE_DEBOUNCE_MS = 1000; // 1秒内相同消息只显示一次

/**
 * 统一的错误处理
 * @param error 错误对象
 * @param defaultMessage 默认错误消息
 */
export function handleError(error: unknown, defaultMessage: string = "操作失败"): void {
	console.error(error);

	const errorMessage = error instanceof Error
		? error.message
		: defaultMessage;

	// 防止重复提示（1秒内相同消息只显示一次）
	const now = Date.now();
	if (errorMessage === lastMessage && now - lastTime < MESSAGE_DEBOUNCE_MS) {
		return;
	}
	lastMessage = errorMessage;
	lastTime = now;

	message.error(errorMessage);
}

/**
 * 统一的成功提示
 * @param msg 成功消息
 */
export function handleSuccess(msg: string): void {
	message.success(msg);
}

/**
 * 包装异步函数，自动处理错误和成功提示
 * @param fn 异步函数
 * @param options 配置选项
 * @returns 包装后的异步函数
 */
export function withAsyncHandler<T>(
	fn: () => Promise<T>,
	options?: {
		errorMessage?: string;
		successMessage?: string;
		onSuccess?: (result: T) => void;
		onError?: (error: unknown) => void;
	}
): () => Promise<void> {
	return async () => {
		try {
			const result = await fn();
			if (options?.successMessage) {
				handleSuccess(options.successMessage);
			}
			options?.onSuccess?.(result);
		} catch (error) {
			handleError(error, options?.errorMessage);
			options?.onError?.(error);
			throw error; // 重新抛出以便外部处理
		}
	};
}
