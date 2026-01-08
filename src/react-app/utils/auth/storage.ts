/**
 * 统一加密存储模块
 * 使用 AES 加密存储用户认证信息，提供内存缓存优化性能
 */

import CryptoJS from "crypto-js";
import { SECURITY, STORAGE_KEYS } from "@/config/app.config";

/**
 * 用户信息接口
 */
export interface AuthUser {
	id: number;
	username: string;
	nickname?: string;
	avatar?: string;
	roles?: string[];
	is_admin?: boolean;
}

/**
 * 存储的用户信息结构
 */
export interface StoredUserInfo {
	user: AuthUser;
	permissions: string[];
	menus: any[];
	timestamp: number;
}

// 内存缓存
let cachedInfo: StoredUserInfo | null = null;
let cacheUserId: number | null = null;
let storageListener: ((event: StorageEvent) => void) | null = null;

/**
 * 加密数据
 */
function encrypt(data: string): string {
	return CryptoJS.AES.encrypt(data, SECURITY.ENCRYPTION_KEY).toString();
}

/**
 * 解密数据
 */
function decrypt(data: string): string {
	const bytes = CryptoJS.AES.decrypt(data, SECURITY.ENCRYPTION_KEY);
	return bytes.toString(CryptoJS.enc.Utf8);
}

/**
 * 存储 Token（明文）
 */
export function setToken(token: string): void {
	console.log("[Storage] Setting token to localStorage:", STORAGE_KEYS.TOKEN);
	localStorage.setItem(STORAGE_KEYS.TOKEN, token);
}

/**
 * 获取 Token
 */
export function getToken(): string | null {
	const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
	console.log("[Storage] Getting token from localStorage:", STORAGE_KEYS.TOKEN, "found:", !!token);
	return token;
}

/**
 * 移除 Token
 */
export function removeToken(): void {
	console.log("[Storage] Removing token from localStorage:", STORAGE_KEYS.TOKEN);
	localStorage.removeItem(STORAGE_KEYS.TOKEN);
}

/**
 * 存储用户信息（加密）
 */
export function setUserInfo(data: Omit<StoredUserInfo, "timestamp">): void {
	console.log("[Storage] 加密前数据:", data);
	const info: StoredUserInfo = { ...data, timestamp: Date.now() };
	const encrypted = encrypt(JSON.stringify(info));
	console.log("[Storage] 加密后数据:", encrypted);
	localStorage.setItem(STORAGE_KEYS.USER_INFO, encrypted);
	cachedInfo = info;
	cacheUserId = info.user.id;
}

/**
 * 获取用户信息（解密）
 */
export function getUserInfo(): StoredUserInfo | null {
	// 检查内存缓存
	if (cachedInfo && cacheUserId) {
		return cachedInfo;
	}

	const encrypted = localStorage.getItem(STORAGE_KEYS.USER_INFO);
	if (!encrypted) {
		console.log("[Storage] No user info found in localStorage:", STORAGE_KEYS.USER_INFO);
		return null;
	}

	try {
		console.log("[Storage] Decrypting user info from localStorage");
		const decrypted = decrypt(encrypted);
		const info: StoredUserInfo = JSON.parse(decrypted);
		cachedInfo = info;
		cacheUserId = info.user.id;
		console.log("[Storage] Decrypted user info:", info);
		return info;
	} catch (e) {
		console.error("[Storage] Failed to decrypt user info:", e);
		return null;
	}
}

/**
 * 获取用户信息（从缓存）
 */
export function getUser(): AuthUser | null {
	const info = getUserInfo();
	return info?.user || null;
}

/**
 * 获取权限列表
 */
export function getPermissions(): string[] {
	const info = getUserInfo();
	return info?.permissions || [];
}

/**
 * 获取菜单列表
 */
export function getMenus(): any[] {
	const info = getUserInfo();
	return info?.menus || [];
}

/**
 * 检查是否是超级管理员
 */
export function isSuperAdmin(): boolean {
	const permissions = getPermissions();
	return permissions.includes("*:*:*");
}

/**
 * 清除用户信息
 */
export function clearUserInfo(): void {
	console.log("[Storage] Clearing user info from localStorage:", STORAGE_KEYS.USER_INFO);
	localStorage.removeItem(STORAGE_KEYS.USER_INFO);
	cachedInfo = null;
	cacheUserId = null;
}

/**
 * 启用多 tab 同步
 */
export function enableStorageSync(): void {
	if (storageListener) return; // 已经启用

	storageListener = (event: StorageEvent) => {
		if (event.key === STORAGE_KEYS.USER_INFO && event.newValue) {
			// 清除缓存，强制从 localStorage 重新读取
			cachedInfo = null;
			cacheUserId = null;
			console.log("[Storage] Synced user info from storage event");
			// 触发页面重新渲染或通知
			window.dispatchEvent(new CustomEvent("auth-info-changed"));
		}
	};

	window.addEventListener("storage", storageListener);
	console.log("[Storage] Enabled storage sync for multi-tab support");
}

/**
 * 销毁存储监听
 */
export function destroyStorageSync(): void {
	if (storageListener) {
		window.removeEventListener("storage", storageListener);
		storageListener = null;
		console.log("[Storage] Destroyed storage sync listener");
	}
}
