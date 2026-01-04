/**
 * 登录页面
 * 简单居中表单设计
 */

import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { navigate } from "../utils/router";

export default function Login() {
	const { login, isAuthenticated } = useAuth();
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");
	const [isLoading, setIsLoading] = useState(false);

	// 如果已登录，重定向到 /system/home 或原访问页面
	useEffect(() => {
		if (isAuthenticated) {
			const params = new URLSearchParams(window.location.search);
			const redirect = params.get("redirect") || "/system/home";
			navigate(redirect, true); // replace 避免返回到登录页
		}
	}, [isAuthenticated]);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError("");
		setIsLoading(true);

		try {
			await login(username, password);
			// 登录成功后会在 useEffect 中处理跳转
		} catch (err: any) {
			setError(err.message || "登录失败，请检查用户名和密码");
		} finally {
			setIsLoading(false);
		}
	};

	const containerStyle: React.CSSProperties = {
		minHeight: "100vh",
		display: "flex",
		alignItems: "center",
		justifyContent: "center",
		background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
	};

	const cardStyle: React.CSSProperties = {
		background: "white",
		padding: "40px",
		borderRadius: "8px",
		boxShadow: "0 10px 25px rgba(0, 0, 0, 0.1)",
		width: "100%",
		maxWidth: "400px",
	};

	const titleStyle: React.CSSProperties = {
		fontSize: "24px",
		fontWeight: "bold",
		textAlign: "center",
		marginBottom: "30px",
		color: "#333",
	};

	const formGroupStyle: React.CSSProperties = {
		marginBottom: "20px",
	};

	const labelStyle: React.CSSProperties = {
		display: "block",
		marginBottom: "8px",
		color: "#555",
		fontSize: "14px",
	};

	const inputStyle: React.CSSProperties = {
		width: "100%",
		padding: "12px",
		border: "1px solid #ddd",
		borderRadius: "4px",
		fontSize: "14px",
		boxSizing: "border-box",
	};

	const buttonStyle: React.CSSProperties = {
		width: "100%",
		padding: "12px",
		background: "#667eea",
		color: "white",
		border: "none",
		borderRadius: "4px",
		fontSize: "16px",
		fontWeight: "bold",
		cursor: isLoading ? "not-allowed" : "pointer",
		opacity: isLoading ? 0.6 : 1,
	};

	const errorStyle: React.CSSProperties = {
		background: "#fee",
		color: "#c33",
		padding: "10px",
		borderRadius: "4px",
		marginBottom: "20px",
		fontSize: "14px",
		textAlign: "center",
	};

	return (
		<div style={containerStyle}>
			<div style={cardStyle}>
				<h1 style={titleStyle}>系统登录</h1>

				{error && <div style={errorStyle}>{error}</div>}

				<form onSubmit={handleSubmit}>
					<div style={formGroupStyle}>
						<label style={labelStyle}>用户名</label>
						<input
							type="text"
							style={inputStyle}
							value={username}
							onChange={(e) => setUsername(e.target.value)}
							placeholder="请输入用户名"
							autoFocus
							disabled={isLoading}
						/>
					</div>

					<div style={formGroupStyle}>
						<label style={labelStyle}>密码</label>
						<input
							type="password"
							style={inputStyle}
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							placeholder="请输入密码"
							disabled={isLoading}
						/>
					</div>

					<button type="submit" style={buttonStyle} disabled={isLoading}>
						{isLoading ? "登录中..." : "登录"}
					</button>
				</form>
			</div>
		</div>
	);
}
