/**
 * 权限按钮组件
 * 根据用户权限显示/隐藏按钮，支持自动推断按钮类型
 */

import React, { type CSSProperties, type ReactNode } from "react";
import { hasPermission } from "../utils/auth";

type ButtonVariant = "create" | "delete" | "export" | "update" | "special";

interface PermissionButtonProps {
	permission: string;
	children?: ReactNode;
	style?: CSSProperties;
	className?: string;
	onClick?: () => void;
	disabled?: boolean;
	icon?: ReactNode;
	variant?: ButtonVariant;
}

/**
 * 根据权限标识自动推断按钮类型
 */
function getVariant(permission: string, children?: ReactNode): ButtonVariant {
	// 检查是否为导出按钮
	if (children && typeof children === "string" && children.includes("导出")) {
		return "export";
	}

	// 根据权限标识推断
	if (permission.includes(":create")) return "create";
	if (permission.includes(":delete")) return "delete";
	if (permission.includes(":update")) return "update";
	if (permission.includes(":assign")) return "special";
	if (permission.includes(":config")) return "special";
	if (permission.includes(":reset")) return "special";

	// 默认返回 update 样式
	return "update";
}

/**
 * 按钮样式配置
 */
const buttonStyles: Record<ButtonVariant, CSSProperties> = {
	create: {
		background: "#1890ff",
		color: "white",
	},
	delete: {
		background: "#ff4d4f",
		color: "white",
	},
	export: {
		background: "#8c8c8c",
		color: "white",
	},
	update: {
		background: "#fa8c16",
		color: "white",
	},
	special: {
		background: "#13c2c2",
		color: "white",
	},
};

const baseStyle: CSSProperties = {
	padding: "6px 16px",
	border: "none",
	borderRadius: "4px",
	cursor: "pointer",
	fontSize: "14px",
	display: "inline-flex",
	alignItems: "center",
	gap: "6px",
	transition: "opacity 0.2s, filter 0.2s",
};

export default function PermissionButton({
	permission,
	children,
	style,
	className,
	onClick,
	disabled,
	icon,
	variant,
}: PermissionButtonProps) {
	// 检查权限
	if (!hasPermission(permission)) {
		return null;
	}

	// 自动推断或使用指定的 variant
	const buttonVariant = variant || getVariant(permission, children);

	const computedStyle: CSSProperties = {
		...baseStyle,
		...buttonStyles[buttonVariant],
		opacity: disabled ? 0.5 : 1,
		cursor: disabled ? "not-allowed" : "pointer",
		...style,
	};

	// 添加悬停效果
	const handleMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
		if (!disabled) {
			e.currentTarget.style.filter = "brightness(1.1)";
		}
	};

	const handleMouseLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
		e.currentTarget.style.filter = "none";
	};

	return (
		<button
			type="button"
			style={computedStyle}
			onClick={onClick}
			disabled={disabled}
			className={className}
			onMouseEnter={handleMouseEnter}
			onMouseLeave={handleMouseLeave}
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
	children: ReactNode;
	style?: CSSProperties;
}

export function PermissionLink({ permission, href, children, style }: PermissionLinkProps) {
	if (!hasPermission(permission)) {
		return null;
	}

	const linkStyle: CSSProperties = {
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
