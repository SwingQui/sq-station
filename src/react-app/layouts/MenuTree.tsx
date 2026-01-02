/**
 * 菜单树组件
 * 递归渲染菜单
 */

import React, { useState } from "react";

interface MenuItem {
	id: number;
	parent_id: number;
	menu_name: string;
	menu_type: "M" | "C" | "F"; // M=目录, C=菜单, F=按钮
	route_path: string;
	component_path: string;
	children?: MenuItem[];
}

interface MenuTreeProps {
	items: MenuItem[];
	collapsed?: boolean;
	level?: number;
}

export default function MenuTree({ items, collapsed = false, level = 0 }: MenuTreeProps) {
	const [expandedMenus, setExpandedMenus] = useState<Set<number>>(new Set());

	const toggleExpand = (id: number) => {
		setExpandedMenus((prev) => {
			const next = new Set(prev);
			if (next.has(id)) {
				next.delete(id);
			} else {
				next.add(id);
			}
			return next;
		});
	};

	const isExpanded = (id: number) => expandedMenus.has(id);

	// 检查当前路由是否激活
	const isActive = (path: string) => {
		return window.location.pathname === path;
	};

	const containerStyle: React.CSSProperties = {
		userSelect: "none",
	};

	const itemStyle: React.CSSProperties = {
		paddingLeft: `${level * 16 + (collapsed ? 24 : 20)}px`,
	};

	return (
		<div style={containerStyle}>
			{items.map((item) => {
				// 跳过按钮类型
				if (item.menu_type === "F") {
					return null;
				}

				// 目录类型 - 可展开
				if (item.menu_type === "M") {
					const hasChildren = item.children && item.children.length > 0;
					const expanded = isExpanded(item.id);

					return (
						<div key={item.id}>
							<div
								style={{
									...itemStyle,
									...menuItemStyle,
									cursor: hasChildren ? "pointer" : "default",
								}}
								onClick={() => hasChildren && toggleExpand(item.id)}
							>
								{collapsed ? (
									<span style={{ fontSize: "16px" }}>📁</span>
								) : (
									<>
										<span>{expanded ? "▼" : "▶"}</span>
										<span style={{ marginLeft: "8px" }}>{item.menu_name}</span>
									</>
								)}
							</div>

							{expanded && hasChildren && (
								<MenuTree
									items={item.children!}
									collapsed={collapsed}
									level={level + 1}
								/>
							)}
						</div>
					);
				}

				// 菜单类型 - 可点击
				if (item.menu_type === "C") {
					return (
						<div key={item.id}>
							<a
								href={item.route_path}
								style={{
									...itemStyle,
									...menuItemStyle,
									...(isActive(item.route_path) ? activeMenuItemStyle : {}),
								}}
							>
								{collapsed ? (
									<span style={{ fontSize: "16px" }}>📄</span>
								) : (
									item.menu_name
								)}
							</a>
						</div>
					);
				}

				return null;
			})}
		</div>
	);
}

const menuItemStyle: React.CSSProperties = {
	height: "40px",
	display: "flex",
	alignItems: "center",
	color: "rgba(255, 255, 255, 0.65)",
	textDecoration: "none",
	transition: "all 0.3s",
	cursor: "pointer",
};

const activeMenuItemStyle: React.CSSProperties = {
	color: "white",
	background: "#1890ff",
};
