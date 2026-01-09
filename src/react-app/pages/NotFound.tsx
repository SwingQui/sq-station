/**
 * 404 页面未找到页面
 */

import { type CSSProperties } from "react";
import { navigate } from "../utils/router";

export default function NotFound() {
	const handleGoHome = () => {
		navigate("/");
	};

	const containerStyle: CSSProperties = {
		minHeight: "100vh",
		display: "flex",
		alignItems: "center",
		justifyContent: "center",
		background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
	};

	const cardStyle: CSSProperties = {
		background: "white",
		padding: "50px",
		borderRadius: "8px",
		boxShadow: "0 10px 25px rgba(0, 0, 0, 0.1)",
		width: "100%",
		maxWidth: "450px",
		textAlign: "center",
	};

	const iconStyle: CSSProperties = {
		fontSize: "64px",
		marginBottom: "20px",
	};

	const titleStyle: CSSProperties = {
		fontSize: "28px",
		fontWeight: "bold",
		marginBottom: "15px",
		color: "#333",
	};

	const messageStyle: CSSProperties = {
		fontSize: "16px",
		color: "#666",
		marginBottom: "25px",
		lineHeight: "1.6",
	};

	const pathStyle: CSSProperties = {
		background: "#f8f9fa",
		padding: "12px",
		borderRadius: "4px",
		marginBottom: "25px",
		fontSize: "14px",
		color: "#555",
		fontFamily: "monospace",
	};

	const buttonStyle: CSSProperties = {
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

	const currentPath = window.location.pathname;

	return (
		<div style={containerStyle}>
			<div style={cardStyle}>
				<div style={iconStyle}>🔍</div>
				<h1 style={titleStyle}>页面未找到</h1>
				<p style={messageStyle}>
					抱歉，您访问的页面不存在。
					<br />
					请检查 URL 是否正确。
				</p>
				<div style={pathStyle}>访问路径: {currentPath}</div>
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
