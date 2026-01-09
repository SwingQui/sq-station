/**
 * 菜单树组件
 * 递归渲染菜单，支持图标显示
 */

import { useState, type CSSProperties } from "react";
import { navigate } from "../utils/router";
import Icon from "../components/Icon";

interface MenuItem {
	id: number;
	parent_id: number;
	menu_name: string;
	menu_type: "M" | "C" | "F"; // M=目录, C=菜单, F=按钮
	route_path: string | null;
	component_path: string | null;
	icon: string | null; // 图标名称（从数据库读取）
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
	const isActive = (path: string | null) => {
		return path && window.location.pathname === path;
	};

	const containerStyle: CSSProperties = {
		userSelect: "none",
	};

	const itemStyle: CSSProperties = {
		paddingLeft: collapsed ? "0" : `${level * 16 + 20}px`,
		justifyContent: collapsed ? "center" : "flex-start",
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

					// 折叠状态下不渲染子菜单
					if (collapsed && level > 0) {
						return null;
					}

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
									<Icon name={item.icon} size={18} color="rgba(255,255,255,0.65)" />
								) : (
									<>
										<Icon name={item.icon || "folder"} size={16} color="rgba(255,255,255,0.65)" />
										<span style={{
											marginLeft: "6px",
											fontSize: "12px",
											fontWeight: "bold",
											width: "14px",
											display: "inline-flex",
											justifyContent: "center"
										}}>
											{expanded ? "−" : "+"}
										</span>
										<span style={{ marginLeft: "6px", flex: 1 }}>{item.menu_name}</span>
									</>
								)}
							</div>

							{expanded && hasChildren && !collapsed && (
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
					// 折叠状态下不渲染子菜单
					if (collapsed && level > 0) {
						return null;
					}
					const active = isActive(item.route_path);

					return (
						<div key={item.id}>
							<a
								href={item.route_path || "#"}
								style={{
									...itemStyle,
									...menuItemStyle,
									...(active ? activeMenuItemStyle : {}),
								}}
								onClick={(e) => {
									e.preventDefault();
									if (item.route_path) {
										navigate(item.route_path, true);
									}
								}}
							>
								{collapsed ? (
									<Icon name={item.icon} size={18} color={active ? "white" : "rgba(255,255,255,0.65)"} />
								) : (
									<>
										<Icon name={item.icon || "file"} size={16} color={active ? "white" : "rgba(255,255,255,0.65)"} />
										<span style={{ marginLeft: "8px" }}>{item.menu_name}</span>
									</>
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

const menuItemStyle: CSSProperties = {
	height: "40px",
	display: "flex",
	alignItems: "center",
	color: "rgba(255, 255, 255, 0.65)",
	textDecoration: "none",
	transition: "all 0.3s",
	cursor: "pointer",
};

const activeMenuItemStyle: CSSProperties = {
	color: "white",
	background: "#1890ff",
};
