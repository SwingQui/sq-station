/**
 * 顶部导航栏组件
 */

import { useState, type CSSProperties } from "react";
import { useAuth } from "../contexts/AuthContext";
import Avatar from "../components/Avatar";
import UserDropdown from "../components/UserDropdown";
import { HEADER_HEIGHT } from "../config/layout.config";

// GitHub SVG 图标
const GitHubIcon = () => (
	<svg
		height="20"
		width="20"
		viewBox="0 0 16 16"
		version="1.1"
		aria-hidden="true"
		fill="currentColor"
	>
		<path
			d="M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9.82 1.13.16.45.68 1.31 2.69.94 0 .67.01 1.3.01 1.49 0 .21-.15.45-.55.38A7.995 7.995 0 0 1 0 8c0-4.42 3.58-8 8-8Z"
		/>
	</svg>
);

interface HeaderProps {
	onToggleSidebar: () => void;
}

export default function Header({ onToggleSidebar }: HeaderProps) {
	const { logout } = useAuth();
	const [dropdownOpen, setDropdownOpen] = useState(false);

	const headerStyle: CSSProperties = {
		height: `${HEADER_HEIGHT}px`,
		flexShrink: 0,
		background: "white",
		borderBottom: "1px solid #f0f0f0",
		display: "flex",
		alignItems: "center",
		justifyContent: "space-between",
		padding: "0 20px",
	};

	const leftStyle: CSSProperties = {
		display: "flex",
		alignItems: "center",
	};

	const rightStyle: CSSProperties = {
		display: "flex",
		alignItems: "center",
		gap: "16px",
	};

	const toggleButtonStyle: CSSProperties = {
		fontSize: "18px",
		cursor: "pointer",
		padding: "8px",
	};

	const userAreaStyle: CSSProperties = {
		position: "relative",
	};

	const githubLinkStyle: CSSProperties = {
		display: "flex",
		alignItems: "center",
		color: "#666",
		textDecoration: "none",
		padding: "6px 10px",
		borderRadius: "6px",
		transition: "background-color 0.2s, color 0.2s",
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
				<a
					href="https://github.com/SwingQui"
					target="_blank"
					rel="noopener noreferrer"
					title="GitHub"
					style={githubLinkStyle}
					onMouseEnter={(e) => {
						e.currentTarget.style.backgroundColor = "#f5f5f5";
						e.currentTarget.style.color = "#1890ff";
					}}
					onMouseLeave={(e) => {
						e.currentTarget.style.backgroundColor = "transparent";
						e.currentTarget.style.color = "#666";
					}}
				>
					<GitHubIcon />
					<span style={{ marginLeft: "6px", fontSize: "13px" }}>GitHub</span>
				</a>
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
