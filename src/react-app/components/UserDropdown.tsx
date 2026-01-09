/**
 * 用户下拉菜单组件
 * 点击头像显示个人中心、修改密码、退出登录等选项
 */

import { useEffect, useRef, type CSSProperties } from "react";

interface UserDropdownProps {
	visible: boolean;
	onClose: () => void;
	onLogout: () => void;
	onProfile?: () => void;
}

export default function UserDropdown({ visible, onClose, onLogout, onProfile }: UserDropdownProps) {
	const dropdownRef = useRef<HTMLDivElement>(null);

	// 点击外部关闭
	useEffect(() => {
		if (!visible) return;

		const handleClickOutside = (e: MouseEvent) => {
			if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
				onClose();
			}
		};

		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, [visible, onClose]);

	if (!visible) return null;

	const containerStyle: CSSProperties = {
		position: "absolute",
		top: "100%",
		right: 0,
		marginTop: "8px",
		background: "white",
		border: "1px solid #e8e8e8",
		borderRadius: "4px",
		boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)",
		minWidth: "140px",
		zIndex: 1000,
	};

	const itemStyle: CSSProperties = {
		padding: "10px 16px",
		fontSize: "13px",
		color: "#333",
		cursor: "pointer",
		transition: "background 0.2s",
	};

	const dividerStyle: CSSProperties = {
		height: "1px",
		background: "#e8e8e8",
		margin: "4px 0",
	};

	return (
		<div ref={dropdownRef} style={containerStyle}>
			<div
				style={itemStyle}
				onMouseEnter={(e) => e.currentTarget.style.background = "#f5f5f5"}
				onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
				onClick={() => {
					onProfile?.();
					onClose();
				}}
			>
				个人中心
			</div>
			<div
				style={itemStyle}
				onMouseEnter={(e) => e.currentTarget.style.background = "#f5f5f5"}
				onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
			>
				修改密码
			</div>
			<div style={dividerStyle} />
			<div
				style={itemStyle}
				onMouseEnter={(e) => e.currentTarget.style.background = "#f5f5f5"}
				onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
				onClick={() => {
					if (confirm("确定要退出登录吗？")) {
						onLogout();
					}
					onClose();
				}}
			>
				退出登录
			</div>
		</div>
	);
}
