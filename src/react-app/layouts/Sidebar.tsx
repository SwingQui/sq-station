/**
 * 侧边栏组件
 */

import React from "react";
import { getMenus, isSuperAdmin, hasRoutePermission } from "../utils/auth";
import MenuTree from "./MenuTree";
import { SIDEBAR, HEADER_HEIGHT } from "../config/layout.config";

interface SidebarProps {
	collapsed: boolean;
	onToggle: () => void;
}

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
	const allMenus = getMenus();

	// 过滤侧边栏显示的菜单：只显示可见且启用的菜单
	// 超级管理员：显示所有启用的菜单（不受 menu_visible 影响）
	// 普通用户：显示可见且启用的菜单，且需要有权限访问
	const menus = React.useMemo(() => {
		console.log("[Sidebar] All menus from localStorage:", allMenus);
		const admin = isSuperAdmin();
		console.log("[Sidebar] Is super admin:", admin);

		const filterMenus = (items: any[]): any[] => {
			return items
				.filter((item) => {
					// 跳过按钮类型（menu_type = 'F'）
					if (item.menu_type === 'F') {
						return false;
					}

					if (admin) {
						// 超级管理员：只检查是否启用（忽略 menu_visible）
						const visible = item.menu_status === 1;
						console.log(`[Sidebar] Admin filter: ${item.menu_name}, status=${item.menu_status}, visible=${visible}`);
						return visible;
					}

					// 普通用户：检查可见性、启用状态和路由权限
					const visibleAndEnabled = item.menu_visible === 1 && item.menu_status === 1;

					// 对于有路由路径的菜单项，检查是否有权限访问
					let hasPermission = true;
					if (item.route_path && item.menu_type === 'C') {
						hasPermission = hasRoutePermission(item.route_path);
						console.log(`[Sidebar] User permission check: ${item.menu_name}, path=${item.route_path}, hasPermission=${hasPermission}`);
					}

					const result = visibleAndEnabled && hasPermission;
					console.log(`[Sidebar] User filter: ${item.menu_name}, visible=${item.menu_visible}, status=${item.menu_status}, hasPermission=${hasPermission}, result=${result}`);
					return result;
				})
				.map((item) => ({
					...item,
					children: item.children ? filterMenus(item.children) : undefined,
				}));
		};
		return filterMenus(allMenus);
	}, [allMenus]);

	const sidebarStyle: React.CSSProperties = {
		position: "fixed",
		left: 0,
		top: 0,
		bottom: 0,
		width: collapsed ? `${SIDEBAR.COLLAPSED_WIDTH}px` : `${SIDEBAR.EXPANDED_WIDTH}px`,
		background: "#001529",
		transition: `width ${SIDEBAR.TRANSITION_DURATION}`,
		overflow: "hidden",
		zIndex: 100,
	};

	const headerStyle: React.CSSProperties = {
		height: `${HEADER_HEIGHT}px`,
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
		height: `calc(100vh - ${HEADER_HEIGHT}px)`,
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
