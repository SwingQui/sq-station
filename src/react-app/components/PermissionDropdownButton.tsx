/**
 * 权限下拉按钮组件
 * 根据用户权限显示下拉菜单，支持多个选项配置
 */

import React from "react";
import { Dropdown, Button } from "antd";
import type { MenuProps } from "antd";
import { hasPermission } from "@utils/auth";

/**
 * 下拉菜单项配置
 */
export interface DropdownMenuItem {
	/** 菜单项唯一标识 */
	key: string;
	/** 权限标识（dvider 类型可为空） */
	permission?: string;
	/** 显示文本 */
	label?: string;
	/** 图标 */
	icon?: React.ReactNode;
	/** 点击事件处理函数（divider 类型不需要） */
	onClick?: () => void;
	/** 是否为分割线 */
	type?: "divider";
}

interface PermissionDropdownButtonProps {
	/** 菜单项配置 */
	items: DropdownMenuItem[];
	/** 按钮图标 */
	icon?: React.ReactNode;
	/** 按钮文字（默认为"更多"） */
	children?: React.ReactNode;
	/** 按钮样式 */
	style?: React.CSSProperties;
	/** 按钮自定义样式类名 */
	className?: string;
	/** 按钮背景色（默认为青色 #13c2c2） */
	backgroundColor?: string;
	/** 下拉菜单触发方式（默认为点击） */
	trigger?: ('click' | 'hover' | 'contextMenu')[];
	/** 下拉菜单位置 */
	placement?: "bottomLeft" | "bottomRight" | "topLeft" | "topRight";
}

/**
 * 权限下拉按钮组件
 *
 * @example
 * ```tsx
 * <PermissionDropdownButton
 *   icon={<MoreOutlined />}
 *   items={[
 *     { key: 'roles', permission: 'system:user:assignRoles', label: '分配角色', icon: <UserOutlined />, onClick: handleRoles },
 *     { key: 'perms', permission: 'system:user:assignPerms', label: '分配权限', icon: <KeyOutlined />, onClick: handlePerms },
 *   ]}
 * />
 * ```
 */
export default function PermissionDropdownButton({
	items,
	icon,
	children,
	style,
	className,
	backgroundColor = "#13c2c2",
	trigger = ["click"],
	placement = "bottomRight",
}: PermissionDropdownButtonProps) {
	// 过滤有权限的菜单项
	const filteredItems = items
		.filter(item => {
			// 分割线始终保留
			if (item.type === "divider") return true;
			// 检查权限（如果没有 permission 则默认有权限）
			return !item.permission || hasPermission(item.permission);
		})
		.map(item => {
			if (item.type === "divider") {
				return { type: "divider" as const };
			}
			return {
				key: item.key,
				label: item.label,
				icon: item.icon,
				onClick: item.onClick,
			};
		}) as MenuProps["items"];

	// 如果没有任何有权限的菜单项，不显示按钮
	const hasAnyPermission = items.some(item =>
		item.type !== "divider" && (!item.permission || hasPermission(item.permission))
	);
	if (!hasAnyPermission) {
		return null;
	}

	// 默认按钮样式
	const defaultButtonStyle: React.CSSProperties = {
		padding: "8px",
		minWidth: "36px",
		height: "36px",
		borderRadius: "8px",
		background: backgroundColor,
		color: "white",
		border: "none",
		cursor: "pointer",
		display: "inline-flex",
		alignItems: "center",
		justifyContent: "center",
		gap: "6px",
		...style,
	};

	return (
		<Dropdown menu={{ items: filteredItems }} trigger={trigger} placement={placement}>
			<Button
				style={defaultButtonStyle}
				className={className}
				icon={icon}
			>
				{children}
			</Button>
		</Dropdown>
	);
}
