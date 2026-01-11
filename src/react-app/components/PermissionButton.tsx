/**
 * 权限按钮组件
 * 根据用户权限显示/隐藏按钮，支持自动推断按钮类型
 */

import { forwardRef, type CSSProperties, type ReactNode } from "react";
import { Button } from "antd";
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
 * 按钮类型映射到 Ant Design Button
 */
const buttonTypeMap: Record<ButtonVariant, "primary" | "default" | undefined> = {
	create: "primary",
	delete: "primary",
	export: undefined,
	update: "primary",
	special: "primary",
};

/**
 * 按钮危险类型映射（delete 使用 danger）
 */
const buttonDangerMap: Record<ButtonVariant, boolean> = {
	create: false,
	delete: true,
	export: false,
	update: false,
	special: false,
};

/**
 * 按钮样式配置
 */
const buttonStyles: Record<ButtonVariant, CSSProperties> = {
	create: {
		background: "#1890ff",
	},
	delete: {
		background: "#ff4d4f",
	},
	export: {
		background: "#8c8c8c",
	},
	update: {
		background: "#fa8c16",
	},
	special: {
		background: "#13c2c2",
	},
};

const baseStyle: CSSProperties = {
	padding: "6px 16px",
	fontSize: "14px",
	display: "inline-flex",
	alignItems: "center",
	gap: "6px",
};

const PermissionButtonInner = forwardRef<HTMLButtonElement, PermissionButtonProps>(
	({ permission, children, style, className, onClick, disabled, icon, variant }, ref) => {
		// 检查权限
		if (!hasPermission(permission)) {
			return null;
		}

		// 自动推断或使用指定的 variant
		const buttonVariant = variant || getVariant(permission, children);

		const computedStyle: CSSProperties = {
			...baseStyle,
			...buttonStyles[buttonVariant],
			...style,
		};

		return (
			<Button
				ref={ref}
				type={buttonTypeMap[buttonVariant]}
				danger={buttonDangerMap[buttonVariant]}
				style={computedStyle}
				className={className}
				onClick={onClick}
				disabled={disabled}
				icon={icon}
			>
				{children}
			</Button>
		);
	}
);

PermissionButtonInner.displayName = "PermissionButton";

export default PermissionButtonInner;

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
