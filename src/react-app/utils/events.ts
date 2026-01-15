/**
 * 自定义事件系统
 * 用于在非 React 代码和 React 层之间通信
 *
 * @description
 * 当 request 层（非 React）需要触发 React 层的状态更新时，
 * 使用自定义事件进行解耦通信，避免直接调用 React API。
 */

/**
 * 认证相关事件名称
 */
export const AUTH_EVENTS = {
	/**
	 * 401 未授权事件
	 * 当 API 返回 401 时触发，AuthContext 监听此事件并执行登出
	 */
	UNAUTHORIZED: "auth:401",
} as const;

/**
 * 触发 401 未授权事件
 * 由 request/index.ts 在检测到 401 响应时调用
 */
export function dispatchAuth401(): void {
	const event = new CustomEvent(AUTH_EVENTS.UNAUTHORIZED);
	window.dispatchEvent(event);
}

/**
 * 添加 401 事件监听器
 * 由 AuthContext 使用，监听 401 事件并执行登出逻辑
 * @param callback 事件触发时的回调函数
 * @returns 清理函数，调用后移除监听器
 */
export function addAuth401Listener(callback: () => void): () => void {
	window.addEventListener(AUTH_EVENTS.UNAUTHORIZED, callback);
	// 返回清理函数
	return () => window.removeEventListener(AUTH_EVENTS.UNAUTHORIZED, callback);
}
