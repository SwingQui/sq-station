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
		const response = await fetch("/api/auth/login", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ username, password }),
		});

		if (!response.ok) {
			const error = await response.json();
			throw new Error(error.msg || error.error || "登录失败");
		}

		const result = await response.json();

		// 新格式: {code: 200, data: {token, user}, msg}
		if (result.code !== 200) {
			throw new Error(result.msg || "登录失败");
		}

		const { token, user } = result.data;

		console.log("[AuthContext] Login successful, token:", token ? "exists" : "missing");
		console.log("[AuthContext] User info:", user);

		// 保存到 localStorage
		setToken(token);
		setUserStorage(user);

		console.log("[AuthContext] Token saved to localStorage");
		console.log("[AuthContext] Token from localStorage:", getToken());

		// 获取用户权限和菜单
		console.log("[AuthContext] Fetching /api/auth/me...");
		const meResponse = await fetch("/api/auth/me", {
			headers: { "Authorization": `Bearer ${token}` },
		});

		console.log("[AuthContext] /api/auth/me response status:", meResponse.status);

		if (meResponse.ok) {
			const meResult = await meResponse.json();
			console.log("[AuthContext] /api/auth/me response:", meResult);
			// 新格式: {code: 200, data: {user, permissions, menus}, msg}
			if (meResult.code === 200 && meResult.data) {
				console.log("[AuthContext] Saving permissions:", meResult.data.permissions);
				console.log("[AuthContext] Saving menus:", meResult.data.menus);
				setPermissions(meResult.data.permissions || []);
				setMenus(meResult.data.menus || []);
				// 清除菜单索引缓存，以便重新构建
				clearMenuIndexCache();
			}
		} else {
			console.error("Failed to get user info:", meResponse.status, meResponse.statusText);
			const errorText = await meResponse.text();
			console.error("Error response:", errorText);
		}

		setUser(user);
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

		const response = await fetch("/api/auth/me", {
			headers: { "Authorization": `Bearer ${token}` },
		});

		if (!response.ok) {
			logout();
			return;
		}

		const result = await response.json();

		// 新格式: {code: 200, data: {user, permissions, menus}, msg}
		if (result.code !== 200 || !result.data) {
			logout();
			return;
		}

		const { user, permissions, menus } = result.data;
		setUserStorage(user);
		setPermissions(permissions || []);
		setMenus(menus || []);
		// 清除菜单索引缓存，以便重新构建
		clearMenuIndexCache();

		setUser(user);
	};

	// 刷新菜单（数据库更新后调用）
	const refreshMenus = async () => {
		const token = getToken();
		if (!token) return;

		const response = await fetch("/api/auth/me", {
			headers: { "Authorization": `Bearer ${token}` },
		});

		if (response.ok) {
			const result = await response.json();
			if (result.code === 200 && result.data) {
				setPermissions(result.data.permissions || []);
				setMenus(result.data.menus || []);
				// 清除菜单索引缓存
				clearMenuIndexCache();
			}
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
