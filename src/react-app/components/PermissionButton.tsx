/**
 * 权限按钮组件
 * 根据用户权限显示/隐藏按钮
 */

import React from "react";
import { hasPermission } from "../utils/auth";

interface PermissionButtonProps {
	permission: string;
	children: React.ReactNode;
	style?: React.CSSProperties;
	className?: string;
	onClick?: () => void;
	disabled?: boolean;
	type?: "button" | "submit" | "reset";
}

export default function PermissionButton({
	permission,
	children,
	style,
	onClick,
	disabled,
	type = "button",
}: PermissionButtonProps) {
	// 检查权限
	if (!hasPermission(permission)) {
		return null;
	}

	const buttonStyle: React.CSSProperties = {
		padding: "6px 16px",
		background: "#1890ff",
		color: "white",
		border: "none",
		borderRadius: "4px",
		cursor: disabled ? "not-allowed" : "pointer",
		opacity: disabled ? 0.5 : 1,
		fontSize: "14px",
		...style,
	};

	const dangerStyle: React.CSSProperties = {
		...buttonStyle,
		background: "#ff4d4f",
	};

	// 判断是否为危险操作（删除等）
	const isDanger = permission.includes("delete") || permission.includes("remove");

	return (
		<button
			type={type}
			style={isDanger ? dangerStyle : buttonStyle}
			onClick={onClick}
			disabled={disabled}
		>
			{children}
		</button>
	);
}

/**
 * 权限链接组件
 */
interface PermissionLinkProps {
	permission: string;
	href: string;
	children: React.ReactNode;
	style?: React.CSSProperties;
}

export function PermissionLink({ permission, href, children, style }: PermissionLinkProps) {
	if (!hasPermission(permission)) {
		return null;
	}

	const linkStyle: React.CSSProperties = {
		color: "#1890ff",
		textDecoration: "none",
		cursor: "pointer",
		...style,
	};

	return (
		<a href={href} style={linkStyle}>
			{children}
		</a>
	);
}
