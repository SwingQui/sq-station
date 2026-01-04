/**
 * 顶部导航栏组件
 */

import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import Avatar from "../components/Avatar";
import UserDropdown from "../components/UserDropdown";
import { HEADER_HEIGHT } from "../config/layout.config";

interface HeaderProps {
	onToggleSidebar: () => void;
}

export default function Header({ onToggleSidebar }: HeaderProps) {
	const { logout } = useAuth();
	const [dropdownOpen, setDropdownOpen] = useState(false);

	const headerStyle: React.CSSProperties = {
		height: `${HEADER_HEIGHT}px`,
		flexShrink: 0,
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
		gap: "16px",
	};

	const toggleButtonStyle: React.CSSProperties = {
		fontSize: "18px",
		cursor: "pointer",
		padding: "8px",
	};

	const userAreaStyle: React.CSSProperties = {
		position: "relative",
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
				<div style={userAreaStyle}>
					<Avatar onClick={() => setDropdownOpen(!dropdownOpen)} />
					<UserDropdown
						visible={dropdownOpen}
						onClose={() => setDropdownOpen(false)}
						onLogout={logout}
					/>
				</div>
			</div>
		</div>
	);
}
