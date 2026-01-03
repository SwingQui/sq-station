/**
 * 顶部标签页导航组件
 * 显示已打开的页面，支持切换和关闭
 */

import React, { useState } from "react";
import { useTagsView } from "../contexts/TagsViewContext";
import { navigate } from "../utils/router";

export default function TagsView() {
	const { tabs, activeTab, setActiveTab, removeTab, closeOtherTabs, closeAllTabs } = useTagsView();
	const [contextMenu, setContextMenu] = useState<{ x: number; y: number; tabKey: string } | null>(null);

	const handleTabClick = (key: string) => {
		if (key !== activeTab) {
			setActiveTab(key);
			navigate(key, true);
		}
	};

	const handleClose = (e: React.MouseEvent, key: string) => {
		e.stopPropagation();
		removeTab(key);
	};

	const handleContextMenu = (e: React.MouseEvent, key: string) => {
		e.preventDefault();
		setContextMenu({ x: e.clientX, y: e.clientY, tabKey: key });
	};

	const handleCloseOther = () => {
		if (contextMenu) {
			closeOtherTabs();
		}
		setContextMenu(null);
	};

	const handleCloseAll = () => {
		closeAllTabs();
		setContextMenu(null);
	};

	// 点击外部关闭右键菜单
	React.useEffect(() => {
		const handleClick = () => setContextMenu(null);
		if (contextMenu) {
			document.addEventListener("click", handleClick);
			return () => document.removeEventListener("click", handleClick);
		}
	}, [contextMenu]);

	const tagsViewStyle: React.CSSProperties = {
		height: "40px",
		background: "#f5f5f5",
		borderBottom: "1px solid #e8e8e8",
		display: "flex",
		alignItems: "center",
		padding: "0 10px",
		gap: "6px",
		overflowX: "auto",
		overflowY: "hidden",
		userSelect: "none",
	};

	const tabsContainerStyle: React.CSSProperties = {
		display: "flex",
		gap: "6px",
		flex: 1,
		overflowX: "auto",
	};

	const tabStyle: React.CSSProperties = {
		display: "inline-flex",
		alignItems: "center",
		gap: "8px",
		padding: "6px 12px",
		background: "white",
		border: "1px solid #e8e8e8",
		borderRadius: "4px",
		fontSize: "13px",
		color: "#666",
		cursor: "pointer",
		whiteSpace: "nowrap",
	};

	const activeTabStyle: React.CSSProperties = {
		...tabStyle,
		background: "white",
		border: "1px solid #1890ff",
		color: "#1890ff",
	};

	const closeBtnStyle: React.CSSProperties = {
		width: "16px",
		height: "16px",
		display: "flex",
		alignItems: "center",
		justifyContent: "center",
		borderRadius: "50%",
		fontSize: "12px",
	};

	const contextMenuStyle: React.CSSProperties = {
		position: "fixed",
		left: contextMenu?.x ?? 0,
		top: contextMenu?.y ?? 0,
		background: "white",
		border: "1px solid #e8e8e8",
		borderRadius: "4px",
		boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)",
		zIndex: 1000,
		minWidth: "120px",
	};

	const menuItemStyle: React.CSSProperties = {
		padding: "8px 16px",
		cursor: "pointer",
		fontSize: "13px",
	};

	return (
		<div style={tagsViewStyle}>
			<div style={tabsContainerStyle}>
				{tabs.map((tab) => (
					<div
						key={tab.key}
						style={tab.key === activeTab ? activeTabStyle : tabStyle}
						onClick={() => handleTabClick(tab.key)}
						onContextMenu={(e) => handleContextMenu(e, tab.key)}
					>
						<span>{tab.title}</span>
						{tab.closable && (
							<span
								style={closeBtnStyle}
								onMouseEnter={(e) => { e.currentTarget.style.background = "#ff4d4f"; e.currentTarget.style.color = "white"; }}
								onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#999"; }}
								onClick={(e) => handleClose(e, tab.key)}
							>
								×
							</span>
						)}
					</div>
				))}
			</div>

			{/* 右键菜单 */}
			{contextMenu && (
				<div style={contextMenuStyle}>
					<div style={menuItemStyle} onClick={handleCloseOther}>
						关闭其他
					</div>
					<div style={menuItemStyle} onClick={handleCloseAll}>
						关闭所有
					</div>
				</div>
			)}
		</div>
	);
}
