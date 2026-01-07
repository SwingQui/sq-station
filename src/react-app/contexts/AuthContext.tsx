/**
 * 认证上下文
 * 提供全局认证状态和方法
 */

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import {
	AuthUser,
	getToken,
	setToken,
	getUser,
	setUser as setUserStorage,
	setPermissions,
	setMenus,
	logout as authLogout
} from "../utils/auth";
import { navigate } from "../utils/router";
import { clearMenuIndexCache } from "../utils/core/route/matcher";
import { login as apiLogin, getUserInfo } from "../api/auth";
import { handleError } from "../utils/error-handler";

interface AuthContextType {
	user: AuthUser | null;
	isLoading: boolean;
	isAuthenticated: boolean;
	login: (username: string, password: string) => Promise<void>;
	logout: () => void;
	refreshUser: () => Promise<void>;
	refreshMenus: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
	// 从 localStorage 初始化用户状态和加载状态
	const [user, setUser] = useState<AuthUser | null>(() => {
		return getUser();
	});
	const [isLoading, setIsLoading] = useState(() => {
		// 如果有用户数据，说明已从 localStorage 恢复，不需要 loading
		return !getUser();
	});

	// 检查 token 是否有效，无效则清除用户状态
	useEffect(() => {
		const token = getToken();
		if (!token) {
			// eslint-disable-next-line react-hooks/set-state-in-effect
			setUser(null);
		}
		setIsLoading(false);
	}, []);

	// 登录
	const login = async (username: string, password: string) => {
		try {
			// 使用 API 函数获取 token 和用户信息
			const result = await apiLogin(username, password);
			const { token, user } = result;

			console.log("[AuthContext] Login successful, token:", token ? "exists" : "missing");
			console.log("[AuthContext] User info:", user);

			// 保存到 localStorage
			setToken(token);
			setUserStorage(user);

			console.log("[AuthContext] Token saved to localStorage");
			console.log("[AuthContext] Token from localStorage:", getToken());

			// 获取用户权限和菜单（失败不影响登录流程）
			console.log("[AuthContext] Fetching /api/auth/me...");
			try {
				const meData = await getUserInfo();
				console.log("[AuthContext] /api/auth/me response:", meData);
				console.log("[AuthContext] Saving permissions:", meData.permissions);
				console.log("[AuthContext] Saving menus:", meData.menus);
				setPermissions(meData.permissions || []);
				setMenus(meData.menus || []);
				// 清除菜单索引缓存，以便重新构建
				clearMenuIndexCache();
			} catch {
				// 静默失败，不影响登录流程
				console.error("[AuthContext] Failed to fetch user permissions (silent)");
			}

			setUser(user);
		} catch (error) {
			handleError(error, "登录失败");
			throw error;
		}
	};

	// 登出
	const logout = () => {
		authLogout();
		setUser(null);

		// 使用 SPA 导航跳转到登录页
		navigate("/login", true);
	};

	// 刷新用户信息
	const refreshUser = async () => {
		const token = getToken();
		if (!token) {
			logout();
			return;
		}

		try {
			const meData = await getUserInfo();
			setUserStorage(meData.user);
			setPermissions(meData.permissions || []);
			setMenus(meData.menus || []);
			// 清除菜单索引缓存，以便重新构建
			clearMenuIndexCache();
			setUser(meData.user);
		} catch (error) {
			handleError(error, "刷新用户信息失败");
			logout();
		}
	};

	// 刷新菜单（数据库更新后调用）
	const refreshMenus = async () => {
		const token = getToken();
		if (!token) return;

		try {
			const meData = await getUserInfo();
			setPermissions(meData.permissions || []);
			setMenus(meData.menus || []);
			// 清除菜单索引缓存
			clearMenuIndexCache();
		} catch (error) {
			handleError(error, "刷新菜单失败");
			throw error;
		}
	};

	const value: AuthContextType = {
		user,
		isLoading,
		isAuthenticated: !!user,
		login,
		logout,
		refreshUser,
		refreshMenus,
	};

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
	const context = useContext(AuthContext);
	if (context === undefined) {
		throw new Error("useAuth must be used within an AuthProvider");
	}
	return context;
}
