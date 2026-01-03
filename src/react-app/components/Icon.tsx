/**
 * 图标组件
 * 使用 react-icons 显示图标
 * 图标名称从数据库 Menu.icon 字段读取
 */

import { getIcon } from "../utils/icons";

interface IconProps {
	name: string | null;
	size?: number;
	className?: string;
	color?: string;
}

export default function Icon({ name, size = 16, className, color }: IconProps) {
	// name 从数据库 Menu.icon 字段读取，使用 getIcon 函数支持别名
	const IconComponent = getIcon(name);

	if (!IconComponent) {
		return <span style={{ fontSize: size, color: color || "#999" }}>●</span>;
	}

	return <IconComponent size={size} className={className} style={{ color }} />;
}
