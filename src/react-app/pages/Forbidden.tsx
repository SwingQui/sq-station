/**
 * 403 访问被拒绝页面
 */

import React from "react";
import { navigate } from "../utils/router";

export default function Forbidden() {
	const handleGoHome = () => {
		navigate("/dashboard/home");
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
		padding: "50px",
		borderRadius: "8px",
		boxShadow: "0 10px 25px rgba(0, 0, 0, 0.1)",
		width: "100%",
		maxWidth: "450px",
		textAlign: "center",
	};

	const iconStyle: React.CSSProperties = {
		fontSize: "64px",
		marginBottom: "20px",
	};

	const titleStyle: React.CSSProperties = {
		fontSize: "28px",
		fontWeight: "bold",
		marginBottom: "15px",
		color: "#333",
	};

	const messageStyle: React.CSSProperties = {
		fontSize: "16px",
		color: "#666",
		marginBottom: "25px",
		lineHeight: "1.6",
	};

	const permissionStyle: React.CSSProperties = {
		background: "#f8f9fa",
		padding: "12px",
		borderRadius: "4px",
		marginBottom: "25px",
		fontSize: "14px",
		color: "#555",
		fontFamily: "monospace",
	};

	const buttonStyle: React.CSSProperties = {
		padding: "12px 30px",
		background: "#667eea",
		color: "white",
		border: "none",
		borderRadius: "4px",
		fontSize: "15px",
		fontWeight: "bold",
		cursor: "pointer",
		transition: "background 0.3s",
	};

	// 获取当前路径对应的权限信息
	const currentPath = window.location.pathname;
	const permissionInfo = `访问路径: ${currentPath}`;

	return (
		<div style={containerStyle}>
			<div style={cardStyle}>
				<div style={iconStyle}>🔒</div>
				<h1 style={titleStyle}>访问被拒绝</h1>
				<p style={messageStyle}>
					抱歉，您没有权限访问该页面。
					<br />
					如需访问，请联系系统管理员。
				</p>
				<div style={permissionStyle}>{permissionInfo}</div>
				<button
					style={buttonStyle}
					onClick={handleGoHome}
					onMouseEnter={(e) => {
						e.currentTarget.style.background = "#5568d3";
					}}
					onMouseLeave={(e) => {
						e.currentTarget.style.background = "#667eea";
					}}
				>
					返回首页
				</button>
			</div>
		</div>
	);
}
