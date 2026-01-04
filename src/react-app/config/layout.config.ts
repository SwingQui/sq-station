/**
 * 布局尺寸配置
 * 统一管理所有布局相关的尺寸，便于调整和维护
 */

/** 侧边栏配置 */
export const SIDEBAR = {
	/** 展开时的宽度 */
	EXPANDED_WIDTH: 240,
	/** 折叠时的宽度 */
	COLLAPSED_WIDTH: 64,
	/** 宽度过渡动画时间 */
	TRANSITION_DURATION: "0.3s",
} as const;

/** 右侧内容区固定高度组件配置 */
export const HEADER_HEIGHT = 64;
export const TAGS_VIEW_HEIGHT = 40;
export const BREADCRUMB_HEIGHT = 40;

/** 固定高度总和 */
export const FIXED_HEADER_HEIGHT = HEADER_HEIGHT + TAGS_VIEW_HEIGHT + BREADCRUMB_HEIGHT;

/** 通用过渡动画配置 */
export const TRANSITION = {
	DURATION: "0.3s",
	EASING: "ease-in-out",
} as const;
