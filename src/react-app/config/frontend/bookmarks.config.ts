/**
 * Bookmarks 页面配置文件
 */

import type { StyleConfig, BreakpointConfig } from "@/types/frontend/bookmarks";

/**
 * 默认样式配置
 */
export const defaultStyles: StyleConfig = {
	primaryColor: "#667eea",
	backgroundColor: "#f5f5f5",
	headerBackgroundColor: "#2c3e50",
	headerTextColor: "#ffffff",
	cardBackgroundColor: "#ffffff",
	searchBorderColor: "rgba(255, 255, 255, 0.3)",
	searchHighlightColor: "#ffd700",
};

/**
 * 响应式断点配置
 */
export const breakpoints: BreakpointConfig = {
	containerMaxWidth: "calc(100vw * 5 / 7)",
	columns: {
		xl: 6,   // >1400px: 6个一行
		lg: 5,   // 1200-1400px: 5个一行
		md: 4,   // 900-1200px: 4个一行
		sm: 3,   // 768-900px: 3个一行
		xs: 2,   // 480-768px: 2个一行
		xxs: 1,  // <480px: 1个一行
	},
};

/**
 * 首字母图标颜色列表
 */
export const firstCharColors = [
	"#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7",
	"#DDA0DD", "#98D8C8", "#F7DC6F", "#BB8FCE", "#85C1E2",
];

/**
 * 根据首字符获取颜色
 */
export function getColorByFirstChar(char: string): string {
	const index = char.toUpperCase().charCodeAt(0) % firstCharColors.length;
	return firstCharColors[index];
}

/**
 * 获取卡片宽度百分比
 */
export function getColumnWidth(columns: number): string {
	return `${100 / columns}%`;
}

/**
 * KV 存储的键名
 */
export const BOOKMARKS_CONFIG_KEY = "bookmarks:config";
