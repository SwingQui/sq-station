/**
 * 后台主布局组件
 * 左侧边栏 + 右侧内容区（Header、TagsView、Breadcrumb、主内容）
 */

import React, { useState, type CSSProperties } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import TagsView from "../components/TagsView";
import Breadcrumb from "../components/Breadcrumb";
import { SIDEBAR, FIXED_HEADER_HEIGHT } from "../config/layout.config";

interface AdminLayoutProps {
	children: React.ReactNode;
	title?: string;
}

export default function AdminLayout({ children, title }: AdminLayoutProps) {
	const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

	const layoutStyle: CSSProperties = {
		width: "100vw",
		height: "100vh",
		overflow: "hidden",
	};

	const contentStyle: CSSProperties = {
		position: "absolute",
		left: sidebarCollapsed ? `${SIDEBAR.COLLAPSED_WIDTH}px` : `${SIDEBAR.EXPANDED_WIDTH}px`,
		right: 0,
		top: 0,
		bottom: 0,
		transition: `left ${SIDEBAR.TRANSITION_DURATION}`,
		display: "flex",
		flexDirection: "column",
		overflow: "hidden",
	};

	const mainContentStyle: CSSProperties = {
		width: `calc(100vw - ${sidebarCollapsed ? SIDEBAR.COLLAPSED_WIDTH : SIDEBAR.EXPANDED_WIDTH}px)`,
		height: `calc(100vh - ${FIXED_HEADER_HEIGHT}px)`,
		overflowY: "auto",
		overflowX: "hidden",
		background: "#f5f5f5",
	};

	return (
		<div style={layoutStyle}>
			{/* 左侧边栏 */}
			<Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />

			{/* 右侧内容区 */}
			<div style={contentStyle}>
				{/* 顶部导航 */}
				<Header onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)} />

				{/* 标签页导航 */}
				<TagsView />

				{/* 面包屑导航 */}
				<Breadcrumb />

				{/* 主内容 */}
				<div style={mainContentStyle}>
					<div style={{ padding: "16px", boxSizing: "border-box" }}>
						{title && (
							<h2 style={{ fontSize: "20px", fontWeight: "bold", marginBottom: "16px", color: "#333" }}>
								{title}
							</h2>
						)}
						{children}
					</div>
				</div>
			</div>
		</div>
	);
}
