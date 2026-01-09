/**
 * 头像组件
 * 显示用户昵称首字母或头像图片
 */

import type { CSSProperties } from "react";
import { useAuth } from "../contexts/AuthContext";

interface AvatarProps {
	size?: number;
	onClick?: () => void;
}

export default function Avatar({ size = 32, onClick }: AvatarProps) {
	const { user } = useAuth();

	const avatarStyle: CSSProperties = {
		width: `${size}px`,
		height: `${size}px`,
		borderRadius: "50%",
		background: "#1890ff",
		color: "white",
		display: "flex",
		alignItems: "center",
		justifyContent: "center",
		fontSize: `${size * 0.45}px`,
		fontWeight: 500,
		cursor: onClick ? "pointer" : "default",
		userSelect: "none",
	};

	const getInitial = () => {
		if (user?.nickname) {
			return user.nickname[0].toUpperCase();
		}
		if (user?.username) {
			return user.username[0].toUpperCase();
		}
		return "U";
	};

	return (
		<div style={avatarStyle} onClick={onClick}>
			{getInitial()}
		</div>
	);
}
