/**
 * 认证上下文
 * 提供全局认证状态和方法
 */

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { AuthUser, LoginResponse } from "../utils/auth";
import { navigate } from "../utils/router";

interface AuthContextType {
	user: AuthUser | null;
	isLoading: boolean;
	isAuthenticated: boolean;
	login: (username: string, password: string) => Promise<void>;
	logout: () => void;
	refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
	const [user, setUser] = useState<AuthUser | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	// 初始化：从 localStorage 恢复用户信息
	useEffect(() => {
		const token = localStorage.getItem("auth_token");
		const userStr = localStorage.getItem("auth_user");

		if (token && userStr) {
			try {
				setUser(JSON.parse(userStr));
			} catch (e) {
				console.error("Failed to parse user from localStorage", e);
			}
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
			throw new Error(error.error || "登录失败");
		}

		const data: LoginResponse = await response.json();

		// 保存到 localStorage
		localStorage.setItem("auth_token", data.token);
		localStorage.setItem("auth_user", JSON.stringify(data.user));

		// 获取用户权限和菜单
		const meResponse = await fetch("/api/auth/me", {
			headers: { "Authorization": `Bearer ${data.token}` },
		});

		if (meResponse.ok) {
			const meData = await meResponse.json();
			localStorage.setItem("auth_permissions", JSON.stringify(meData.permissions));
			localStorage.setItem("auth_menus", JSON.stringify(meData.menus));
		}

		setUser(data.user);
	};

	// 登出
	const logout = () => {
		localStorage.removeItem("auth_token");
		localStorage.removeItem("auth_user");
		localStorage.removeItem("auth_permissions");
		localStorage.removeItem("auth_menus");
		setUser(null);

		// 使用 SPA 导航跳转到登录页
		navigate("/login", true);
	};

	// 刷新用户信息
	const refreshUser = async () => {
		const token = localStorage.getItem("auth_token");
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

		const data = await response.json();
		localStorage.setItem("auth_user", JSON.stringify(data.user));
		localStorage.setItem("auth_permissions", JSON.stringify(data.permissions));
		localStorage.setItem("auth_menus", JSON.stringify(data.menus));

		setUser(data.user);
	};

	const value: AuthContextType = {
		user,
		isLoading,
		isAuthenticated: !!user,
		login,
		logout,
		refreshUser,
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
