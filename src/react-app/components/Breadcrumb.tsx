/**
 * 面包屑导航组件
 * 根据当前路径和菜单数据生成面包屑
 * /system 首页不显示面包屑
 */

import React, { useMemo } from "react";
import { getMenus } from "../utils/auth";
import { navigate } from "../utils/router";

interface BreadcrumbItem {
	title: string;
	path?: string;
}

// 查找菜单路径
function findMenuPath(menus: any[], targetPath: string, currentPath: any[] = []): any[] | null {
	for (const menu of menus) {
		const newPath = [...currentPath, menu];

		// 找到匹配的路由
		if (menu.route_path === targetPath) {
			return newPath;
		}

		// 递归查找子菜单
		if (menu.children && menu.children.length > 0) {
			const found = findMenuPath(menu.children, targetPath, newPath);
			if (found) return found;
		}
	}

	return null;
}

export default function Breadcrumb() {
	const menus = getMenus();
	const currentPath = window.location.pathname;

	const breadcrumbItems = useMemo((): BreadcrumbItem[] => {
		// /system 首页不显示面包屑
		if (currentPath === "/system" || currentPath === "/system/") {
			return [];
		}

		const items: BreadcrumbItem[] = [
			{ title: "系统首页", path: "/system" },
		];

		// 在菜单树中查找当前路径
		const menuPath = findMenuPath(menus, currentPath);

		if (menuPath) {
			// 添加父级目录（M 类型）
			for (const menu of menuPath) {
				if (menu.menu_type === "M") {
					items.push({ title: menu.menu_name });
				}
			}
			// 添加当前页面
			const currentPage = menuPath[menuPath.length - 1];
			items.push({ title: currentPage.menu_name });
		}

		return items;
	}, [menus, currentPath]);

	// 没有面包屑项时返回空
	if (breadcrumbItems.length === 0) {
		return null;
	}

	const containerStyle: React.CSSProperties = {
		height: "40px",
		display: "flex",
		alignItems: "center",
		padding: "0 20px",
		background: "white",
		borderBottom: "1px solid #f0f0f0",
	};

	const itemStyle: React.CSSProperties = {
		fontSize: "13px",
		color: "#666",
		cursor: "pointer",
	};

	const separatorStyle: React.CSSProperties = {
		margin: "0 8px",
		color: "#999",
	};

	const lastItemStyle: React.CSSProperties = {
		fontSize: "13px",
		color: "#333",
		fontWeight: 500,
	};

	return (
		<div style={containerStyle}>
			{breadcrumbItems.map((item, index) => {
				return (
					<React.Fragment key={index}>
						{index > 0 && <span style={separatorStyle}>/</span>}

						{item.path ? (
							<span
								style={itemStyle}
								onMouseEnter={(e) => { e.currentTarget.style.color = "#1890ff"; }}
								onMouseLeave={(e) => { e.currentTarget.style.color = "#666"; }}
								onClick={() => navigate(item.path!, true)}
							>
								{item.title}
							</span>
						) : (
							<span style={lastItemStyle}>{item.title}</span>
						)}
					</React.Fragment>
				);
			})}
		</div>
	);
}
