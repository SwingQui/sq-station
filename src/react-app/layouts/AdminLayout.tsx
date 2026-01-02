/**
 * 后台主布局组件
 * 左侧边栏 + 右侧内容区
 */

import React, { useState } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";

interface AdminLayoutProps {
	children: React.ReactNode;
	title?: string;
}

export default function AdminLayout({ children, title }: AdminLayoutProps) {
	const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

	const layoutStyle: React.CSSProperties = {
		display: "flex",
		minHeight: "100vh",
	};

	const contentStyle: React.CSSProperties = {
		flex: 1,
		display: "flex",
		flexDirection: "column",
		marginLeft: sidebarCollapsed ? "64px" : "240px",
		transition: "margin-left 0.3s",
	};

	return (
		<div style={layoutStyle}>
			{/* 左侧边栏 */}
			<Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />

			{/* 右侧内容区 */}
			<div style={contentStyle}>
				{/* 顶部导航 */}
				<Header onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)} />

				{/* 主内容 */}
				<div style={{ padding: "20px", flex: 1, overflow: "auto" }}>
					{title && (
						<h2 style={{ fontSize: "20px", fontWeight: "bold", marginBottom: "20px", color: "#333" }}>
							{title}
						</h2>
					)}
					{children}
				</div>
			</div>
		</div>
	);
}
