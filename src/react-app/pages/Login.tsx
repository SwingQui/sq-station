/**
 * 登录页面
 * 本地背景图 + 透明窗口 + 记住密码 + 密码显示切换
 */

import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { navigate } from "../utils/router";
import CryptoJS from "crypto-js";
import loginBackground from "../assets/login/Login-background.jpg";

// 加密密钥（实际项目中应该从环境变量获取）
const ENCRYPTION_KEY = "sq-station-secret-key-2024";

// 加密函数
function encrypt(text: string): string {
	return CryptoJS.AES.encrypt(text, ENCRYPTION_KEY).toString();
}

// 解密函数
function decrypt(ciphertext: string): string {
	const bytes = CryptoJS.AES.decrypt(ciphertext, ENCRYPTION_KEY);
	return bytes.toString(CryptoJS.enc.Utf8);
}

export default function Login() {
	const { login, isAuthenticated } = useAuth();
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [showPassword, setShowPassword] = useState(false);
	const [rememberMe, setRememberMe] = useState(false);
	const [error, setError] = useState("");
	const [isLoading, setIsLoading] = useState(false);

	// 从 localStorage 加载记住的密码
	useEffect(() => {
		const remembered = localStorage.getItem("sq_remembered_credentials");
		if (remembered) {
			try {
				const decrypted = decrypt(remembered);
				const [savedUsername, savedPassword] = decrypted.split(":");
				if (savedUsername && savedPassword) {
					setUsername(savedUsername);
					setPassword(savedPassword);
					setRememberMe(true);
				}
			} catch (e) {
				console.error("Failed to decrypt remembered credentials:", e);
				localStorage.removeItem("sq_remembered_credentials");
			}
		}
	}, []);

	// 如果已登录，重定向
	useEffect(() => {
		if (isAuthenticated) {
			const params = new URLSearchParams(window.location.search);
			const redirect = params.get("redirect") || "/dashboard/home";
			navigate(redirect, true);
		}
	}, [isAuthenticated]);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError("");
		setIsLoading(true);

		try {
			await login(username, password);

			// 登录成功后处理记住密码
			if (rememberMe) {
				const credentials = `${username}:${password}`;
				const encrypted = encrypt(credentials);
				localStorage.setItem("sq_remembered_credentials", encrypted);
			} else {
				localStorage.removeItem("sq_remembered_credentials");
			}
		} catch (err: any) {
			setError(err.message || "登录失败，请检查用户名和密码");
		} finally {
			setIsLoading(false);
		}
	};

	// 切换密码显示
	const togglePasswordVisibility = () => {
		setShowPassword(!showPassword);
	};

	return (
		<div style={{
			minHeight: "100vh",
			display: "flex",
			alignItems: "center",
			justifyContent: "center",
			position: "relative",
			background: "#0f0f23",
			overflow: "hidden",
		}}>
			{/* 背景图片 - 使用本地资源 */}
			<div style={{
				position: "absolute",
				top: 0,
				left: 0,
				right: 0,
				bottom: 0,
				backgroundImage: `url(${loginBackground})`,
				backgroundSize: "cover",
				backgroundPosition: "center",
				backgroundRepeat: "no-repeat",
				filter: "brightness(0.5)",
			}} />

			{/* 装饰性光晕 */}
			<div style={{
				position: "absolute",
				top: "-50%",
				left: "-50%",
				width: "200%",
				height: "200%",
				background: "radial-gradient(circle at 30% 30%, rgba(99, 102, 241, 0.15) 0%, transparent 50%)",
				animation: "float 20s ease-in-out infinite",
			}} />
			<div style={{
				position: "absolute",
				bottom: "-50%",
				right: "-50%",
				width: "200%",
				height: "200%",
				background: "radial-gradient(circle at 70% 70%, rgba(236, 72, 153, 0.1) 0%, transparent 50%)",
				animation: "float 15s ease-in-out infinite reverse",
			}} />

			{/* 登录卡片 - 透明毛玻璃效果 */}
			<div style={{
				position: "relative",
				zIndex: 1,
				background: "rgba(15, 15, 35, 0.4)",
				backdropFilter: "blur(20px)",
				WebkitBackdropFilter: "blur(20px)",
				border: "1px solid rgba(255, 255, 255, 0.12)",
				borderRadius: "18px",
				padding: "32px",
				width: "100%",
				maxWidth: "320px",
				boxShadow: "0 25px 50px rgba(0, 0, 0, 0.5)",
			}}>
				{/* Logo / 标题区域 */}
				<div style={{ textAlign: "center", marginBottom: "16px" }}>
					<div style={{
						width: "48px",
						height: "48px",
						background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
						borderRadius: "12px",
						margin: "0 auto 10px",
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						fontSize: "20px",
						boxShadow: "0 8px 32px rgba(102, 126, 234, 0.4)",
					}}>
						🚀
					</div>
					<h1 style={{
						fontSize: "24px",
						fontWeight: "600",
						color: "#ffffff",
						margin: "0 0 6px 0",
						letterSpacing: "-0.5px",
					}}>
						SQ Station
					</h1>
					<p style={{
						fontSize: "12px",
						color: "rgba(255, 255, 255, 0.6)",
						margin: 0,
					}}>
						荡荡秋千的小站
					</p>
				</div>

				{/* 错误提示 */}
				{error && (
					<div style={{
						background: "rgba(239, 68, 68, 0.2)",
						border: "1px solid rgba(239, 68, 68, 0.4)",
						color: "#fca5a5",
						padding: "12px 16px",
						borderRadius: "12px",
						marginBottom: "24px",
						fontSize: "14px",
						textAlign: "center",
						backdropFilter: "blur(10px)",
					}}>
						{error}
					</div>
				)}

				{/* 表单 */}
				<form onSubmit={handleSubmit}>
					{/* 用户名 */}
					<div style={{ marginBottom: "14px" }}>
						<label style={{
							display: "block",
							marginBottom: "6px",
							color: "rgba(255, 255, 255, 0.85)",
							fontSize: "13px",
							fontWeight: "500",
						}}>
							用户名
						</label>
						<input
							type="text"
							value={username}
							onChange={(e) => setUsername(e.target.value)}
							placeholder="请输入用户名"
							autoFocus
							disabled={isLoading}
							style={{
								width: "100%",
								padding: "9px 11px",
								background: "rgba(255, 255, 255, 0.08)",
								border: "1px solid rgba(255, 255, 255, 0.15)",
								borderRadius: "8px",
								color: "#ffffff",
								fontSize: "13px",
								boxSizing: "border-box",
								transition: "all 0.3s ease",
								outline: "none",
							}}
							onFocus={(e) => {
								e.target.style.borderColor = "rgba(102, 126, 234, 0.6)";
								e.target.style.background = "rgba(255, 255, 255, 0.12)";
							}}
							onBlur={(e) => {
								e.target.style.borderColor = "rgba(255, 255, 255, 0.15)";
								e.target.style.background = "rgba(255, 255, 255, 0.08)";
							}}
						/>
					</div>

					{/* 密码 */}
					<div style={{ marginBottom: "16px" }}>
						<label style={{
							display: "block",
							marginBottom: "6px",
							color: "rgba(255, 255, 255, 0.85)",
							fontSize: "13px",
							fontWeight: "500",
						}}>
							密码
						</label>
						<div style={{ position: "relative" }}>
							<input
								type={showPassword ? "text" : "password"}
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								placeholder="请输入密码"
								disabled={isLoading}
								style={{
									width: "100%",
									padding: "9px 11px",
									paddingRight: "36px",
									background: "rgba(255, 255, 255, 0.08)",
									border: "1px solid rgba(255, 255, 255, 0.15)",
									borderRadius: "8px",
									color: "#ffffff",
									fontSize: "13px",
									boxSizing: "border-box",
									transition: "all 0.3s ease",
									outline: "none",
								}}
								onFocus={(e) => {
									e.target.style.borderColor = "rgba(102, 126, 234, 0.6)";
									e.target.style.background = "rgba(255, 255, 255, 0.12)";
								}}
								onBlur={(e) => {
									e.target.style.borderColor = "rgba(255, 255, 255, 0.15)";
									e.target.style.background = "rgba(255, 255, 255, 0.08)";
								}}
							/>
							{/* 眼睛图标 */}
							<button
								type="button"
								onClick={togglePasswordVisibility}
								style={{
									position: "absolute",
									right: "8px",
									top: "50%",
									transform: "translateY(-50%)",
									background: "none",
									border: "none",
									color: "rgba(255, 255, 255, 0.5)",
									cursor: "pointer",
									padding: "4px",
									display: "flex",
									alignItems: "center",
									justifyContent: "center",
									fontSize: "15px",
									transition: "color 0.2s ease",
								}}
								onMouseEnter={(e) => {
									e.currentTarget.style.color = "rgba(255, 255, 255, 0.8)";
								}}
								onMouseLeave={(e) => {
									e.currentTarget.style.color = "rgba(255, 255, 255, 0.5)";
								}}
							>
								{showPassword ? "👁️" : "👁️‍🗨️"}
							</button>
						</div>
					</div>

					{/* 记住密码 */}
					<div style={{ marginBottom: "16px" }}>
						<label style={{
							display: "flex",
							alignItems: "center",
							cursor: "pointer",
							userSelect: "none",
						}}>
							<input
								type="checkbox"
								checked={rememberMe}
								onChange={(e) => setRememberMe(e.target.checked)}
								disabled={isLoading}
								style={{
									width: "15px",
									height: "15px",
									marginRight: "6px",
									cursor: "pointer",
									accentColor: "#667eea",
								}}
							/>
							<span style={{
								color: "rgba(255, 255, 255, 0.7)",
								fontSize: "12px",
							}}>
								记住密码
							</span>
						</label>
					</div>

					{/* 登录按钮 */}
					<button
						type="submit"
						disabled={isLoading}
						style={{
							width: "100%",
							padding: "11px",
							background: isLoading
								? "rgba(102, 126, 234, 0.5)"
								: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
							color: "white",
							border: "none",
							borderRadius: "8px",
							fontSize: "14px",
							fontWeight: "600",
							cursor: isLoading ? "not-allowed" : "pointer",
							opacity: isLoading ? 0.7 : 1,
							transition: "all 0.3s ease",
							boxShadow: isLoading
								? "none"
								: "0 8px 24px rgba(102, 126, 234, 0.4)",
						}}
						onMouseEnter={(e) => {
							if (!isLoading) {
								e.currentTarget.style.transform = "translateY(-2px)";
								e.currentTarget.style.boxShadow = "0 12px 32px rgba(102, 126, 234, 0.5)";
							}
						}}
						onMouseLeave={(e) => {
							if (!isLoading) {
								e.currentTarget.style.transform = "translateY(0)";
								e.currentTarget.style.boxShadow = "0 8px 24px rgba(102, 126, 234, 0.4)";
							}
						}}
					>
						{isLoading ? "登录中..." : "登录"}
					</button>
				</form>
			</div>

			{/* 动画样式 */}
			<style>{`
				@keyframes float {
					0%, 100% { transform: translate(0, 0) rotate(0deg); }
					33% { transform: translate(30px, -30px) rotate(120deg); }
					66% { transform: translate(-20px, 20px) rotate(240deg); }
				}
				input::placeholder {
					color: rgba(255, 255, 255, 0.4);
				}
				input:focus::placeholder {
					color: rgba(255, 255, 255, 0.6);
				}
			`}</style>
		</div>
	);
}
