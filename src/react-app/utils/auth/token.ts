/**
 * Token 管理
 * 负责 JWT token 的存储、解析和验证
 */

const TOKEN_KEY = "auth_token";

/**
 * 保存 token
 */
export function setToken(token: string): void {
	localStorage.setItem(TOKEN_KEY, token);
}

/**
 * 获取 token
 */
export function getToken(): string | null {
	return localStorage.getItem(TOKEN_KEY);
}

/**
 * 移除 token
 */
export function removeToken(): void {
	localStorage.removeItem(TOKEN_KEY);
}

/**
 * 解析 JWT token（不验证签名，仅用于获取过期时间）
 */
export function parseToken(token: string): any {
	try {
		const parts = token.split(".");
		if (parts.length !== 3) return null;

		const payload = parts[1];
		const decoded = atob(payload);
		return JSON.parse(decoded);
	} catch {
		return null;
	}
}

/**
 * 检查 token 是否过期
 */
export function isTokenExpired(token: string): boolean {
	const payload = parseToken(token);
	if (!payload || !payload.exp) return true;

	const now = Math.floor(Date.now() / 1000);
	return payload.exp < now;
}
