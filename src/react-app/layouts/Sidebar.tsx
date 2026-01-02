/**
 * 侧边栏组件
 */

import React from "react";
import { getMenus } from "../utils/auth";
import MenuTree from "./MenuTree";

interface SidebarProps {
	collapsed: boolean;
	onToggle: () => void;
}

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
	const menus = getMenus();

	const sidebarStyle: React.CSSProperties = {
		position: "fixed",
		left: 0,
		top: 0,
		bottom: 0,
		width: collapsed ? "64px" : "240px",
		background: "#001529",
		transition: "width 0.3s",
		overflow: "hidden",
		zIndex: 100,
	};

	const headerStyle: React.CSSProperties = {
		height: "64px",
		display: "flex",
		alignItems: "center",
		justifyContent: collapsed ? "center" : "space-between",
		padding: collapsed ? "0" : "0 20px",
		borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
	};

	const titleStyle: React.CSSProperties = {
		color: "white",
		fontSize: "18px",
		fontWeight: "bold",
		whiteSpace: "nowrap",
		overflow: "hidden",
	};

	const toggleStyle: React.CSSProperties = {
		color: "rgba(255, 255, 255, 0.65)",
		cursor: "pointer",
		fontSize: "18px",
	};

	const contentStyle: React.CSSProperties = {
		height: "calc(100vh - 64px)",
		overflow: "auto",
		paddingTop: "10px",
	};

	return (
		<div style={sidebarStyle}>
			{/* 头部 */}
			<div style={headerStyle}>
				{!collapsed && <span style={titleStyle}>管理系统</span>}
				<span style={toggleStyle} onClick={onToggle}>
					{collapsed ? "»" : "«"}
				</span>
			</div>

			{/* 菜单树 */}
			<div style={contentStyle}>
				<MenuTree items={menus} collapsed={collapsed} />
			</div>
		</div>
	);
}
