/**
 * 权限按钮组件
 * 根据用户权限显示/隐藏按钮
 */

import React from "react";
import { hasPermission } from "../utils/auth";

interface PermissionButtonProps {
	permission: string;
	children?: React.ReactNode;
	style?: React.CSSProperties;
	className?: string;
	onClick?: () => void;
	disabled?: boolean;
	type?: "button" | "submit" | "reset" | "primary";
	icon?: React.ReactNode;
	danger?: boolean;
}

export default function PermissionButton({
	permission,
	children,
	style,
	className,
	onClick,
	disabled,
	type = "button",
	icon,
	danger,
}: PermissionButtonProps) {
	// 检查权限
	if (!hasPermission(permission)) {
		return null;
	}

	const buttonStyle: React.CSSProperties = {
		padding: children ? "6px 16px" : "6px 12px",
		background: "#1890ff",
		color: "white",
		border: "none",
		borderRadius: "4px",
		cursor: disabled ? "not-allowed" : "pointer",
		opacity: disabled ? 0.5 : 1,
		fontSize: "14px",
		display: "inline-flex",
		alignItems: "center",
		gap: "6px",
		...style,
	};

	const dangerStyle: React.CSSProperties = {
		...buttonStyle,
		background: "#ff4d4f",
	};

	const primaryStyle: React.CSSProperties = {
		...buttonStyle,
		background: "#1890ff",
	};

	const defaultStyle: React.CSSProperties = {
		...buttonStyle,
		background: "#f0f0f0",
		color: "#333",
	};

	// 判断是否为危险操作（删除等）
	const isDanger = danger !== undefined ? danger : (permission.includes("delete") || permission.includes("remove"));
	// 判断按钮类型
	const buttonType = type === "primary" ? "primary" : "default";

	const getStyle = () => {
		if (isDanger) return dangerStyle;
		if (buttonType === "primary") return primaryStyle;
		return defaultStyle;
	};

	return (
		<button
			type={type === "primary" ? "button" : type}
			style={getStyle()}
			onClick={onClick}
			disabled={disabled}
			className={className}
		>
			{icon}
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
