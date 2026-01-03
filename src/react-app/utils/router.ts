/**
 * SPA路由工具
 * 提供统一的路由跳转方法，避免页面刷新
 */

type RouteChangeListener = (path: string) => void;
const listeners: Set<RouteChangeListener> = new Set();

/**
 * 注册路由变化监听器
 * @param listener 路由变化回调函数
 * @returns 取消监听的函数
 */
export function onRouteChange(listener: RouteChangeListener): () => void {
	listeners.add(listener);
	return () => listeners.delete(listener);
}

/**
 * 通知所有监听器
 */
function notifyListeners(path: string): void {
	listeners.forEach((listener) => listener(path));
}

/**
 * 导航到指定路径（不刷新页面）
 * @param path 目标路径
 * @param replace 是否替换当前历史记录（默认false）
 */
export function navigate(path: string, replace = false): void {
	if (replace) {
		window.history.replaceState({}, "", path);
	} else {
		window.history.pushState({}, "", path);
	}
	notifyListeners(path);
}

/**
 * 返回上一页
 */
export function back(): void {
	window.history.back();
}

/**
 * 获取当前路径
 */
export function getPath(): string {
	return window.location.pathname;
}

/**
 * 解析查询参数
 */
export function getQueryParams(): Record<string, string> {
	const params = new URLSearchParams(window.location.search);
	const result: Record<string, string> = {};
	params.forEach((value, key) => {
		result[key] = value;
	});
	return result;
}
