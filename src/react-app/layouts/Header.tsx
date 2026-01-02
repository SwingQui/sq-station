/**
 * 顶部导航栏组件
 */

import React from "react";
import { useAuth } from "../contexts/AuthContext";

interface HeaderProps {
	onToggleSidebar: () => void;
}

export default function Header({ onToggleSidebar }: HeaderProps) {
	const { user, logout } = useAuth();

	const headerStyle: React.CSSProperties = {
		height: "64px",
		background: "white",
		borderBottom: "1px solid #f0f0f0",
		display: "flex",
		alignItems: "center",
		justifyContent: "space-between",
		padding: "0 20px",
	};

	const leftStyle: React.CSSProperties = {
		display: "flex",
		alignItems: "center",
	};

	const rightStyle: React.CSSProperties = {
		display: "flex",
		alignItems: "center",
		gap: "20px",
	};

	const toggleButtonStyle: React.CSSProperties = {
		fontSize: "18px",
		cursor: "pointer",
		padding: "8px",
	};

	const userInfoStyle: React.CSSProperties = {
		display: "flex",
		alignItems: "center",
		gap: "10px",
		cursor: "pointer",
		position: "relative",
	};

	const avatarStyle: React.CSSProperties = {
		width: "32px",
		height: "32px",
		borderRadius: "50%",
		background: "#1890ff",
		color: "white",
		display: "flex",
		alignItems: "center",
		justifyContent: "center",
		fontSize: "14px",
	};

	const logoutButtonStyle: React.CSSProperties = {
		padding: "6px 16px",
		background: "#ff4d4f",
		color: "white",
		border: "none",
		borderRadius: "4px",
		cursor: "pointer",
		fontSize: "14px",
	};

	const handleLogout = () => {
		if (confirm("确定要退出登录吗？")) {
			logout();
		}
	};

	return (
		<div style={headerStyle}>
			{/* 左侧 */}
			<div style={leftStyle}>
				<div style={toggleButtonStyle} onClick={onToggleSidebar}>
					☰
				</div>
			</div>

			{/* 右侧 */}
			<div style={rightStyle}>
				<div style={userInfoStyle}>
					<div style={avatarStyle}>
						{user?.nickname?.[0] || user?.username[0]?.toUpperCase()}
					</div>
					<span>{user?.nickname || user?.username}</span>
				</div>

				<button style={logoutButtonStyle} onClick={handleLogout}>
					退出
				</button>
			</div>
		</div>
	);
}
