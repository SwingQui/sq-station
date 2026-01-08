/**
 * 布局尺寸配置
 *
 * @description
 * 本文件统一管理应用中所有布局相关的尺寸配置，包括侧边栏、头部、标签页等组件的宽高尺寸。
 * 通过集中管理这些配置，可以方便地进行全局布局调整，确保整体设计的一致性。
 *
 * @scope
 * - 作用范围：前端 React 应用的布局组件
 * - 主要影响：主布局框架 (Layout)、侧边栏 (Sidebar)、头部 (Header)、标签视图 (TagsView)
 *
 * @usage
 * ```ts
 * import { SIDEBAR, HEADER_HEIGHT } from '@/config/layout.config';
 * ```
 */

/**
 * 侧边栏配置
 *
 * @description
 * 控制侧边栏展开和折叠时的宽度，以及宽度变化的动画效果。
 *
 * @scope
 * - src/react-app/layout/components/Sidebar.tsx
 * - src/react-app/layout/MainLayout.tsx
 */
export const SIDEBAR = {
	/**
	 * 侧边栏展开时的宽度
	 *
	 * @description
	 * 侧边栏完全展开时的宽度，单位：像素
	 * 此宽度应能完整显示菜单项文字
	 *
	 * @usage 侧边栏 CSS width 属性
	 */
	EXPANDED_WIDTH: 240,

	/**
	 * 侧边栏折叠时的宽度
	 *
	 * @description
	 * 侧边栏折叠后的宽度，单位：像素
	 * 此宽度只显示菜单图标，不显示文字
	 *
	 * @usage 侧边栏折叠状态 CSS width 属性
	 */
	COLLAPSED_WIDTH: 64,

	/**
	 * 宽度过渡动画时间
	 *
	 * @description
	 * 侧边栏展开/折叠时的动画持续时间
	 *
	 * @usage 侧边栏 CSS transition-duration 属性
	 */
	TRANSITION_DURATION: "0.3s",
} as const;

/**
 * 头部高度
 *
 * @description
 * 顶部导航栏的固定高度，包括 Logo、用户信息、操作按钮等。
 *
 * @scope
 * - src/react-app/layout/components/Header.tsx
 * - 页面内容区的顶部偏移量计算
 *
 * @unit 像素 (px)
 */
export const HEADER_HEIGHT = 64;

/**
 * 标签视图高度
 *
 * @description
 * 页面顶部标签栏（TagsView）的高度，用于显示已打开的页面标签。
 *
 * @scope
 * - src/react-app/layout/components/TagsView.tsx
 * - 页面内容区的顶部偏移量计算
 *
 * @unit 像素 (px)
 */
export const TAGS_VIEW_HEIGHT = 40;

/**
 * 面包屑导航高度
 *
 * @description
 * 面包屑导航栏的高度，显示当前页面的路径导航。
 *
 * @scope
 * - src/react-app/layout/components/Breadcrumb.tsx
 * - 页面内容区的顶部偏移量计算
 *
 * @unit 像素 (px)
 */
export const BREADCRUMB_HEIGHT = 40;

/**
 * 固定头部总高度
 *
 * @description
 * 所有固定在顶部的组件高度之和，用于计算页面内容区的可用高度。
 *
 * @formula
 * FIXED_HEADER_HEIGHT = HEADER_HEIGHT + TAGS_VIEW_HEIGHT + BREADCRUMB_HEIGHT
 *
 * @scope
 * - 页面内容区高度计算
 * - 滚动容器的高度设置
 *
 * @usage
 * ```tsx
 * const contentHeight = `calc(100vh - ${FIXED_HEADER_HEIGHT}px)`;
 * ```
 */
export const FIXED_HEADER_HEIGHT = HEADER_HEIGHT + TAGS_VIEW_HEIGHT + BREADCRUMB_HEIGHT;

/**
 * 通用过渡动画配置
 *
 * @description
 * 应中常用的过渡动画参数，确保所有动画效果的一致性。
 *
 * @scope
 * - 所有需要过渡动画的组件
 * - 侧边栏展开/折叠、页面切换等场景
 */
export const TRANSITION = {
	/**
	 * 动画持续时间
	 *
	 * @description
	 * 所有过渡动画的统一持续时间，单位：秒
	 *
	 * @usage CSS transition-duration 属性
	 */
	DURATION: "0.3s",

	/**
	 * 动画缓动函数
	 *
	 * @description
	 * 动画的速度曲线，ease-in-out 表示慢-快-慢
	 *
	 * @usage CSS transition-timing-function 属性
	 */
	EASING: "ease-in-out",
} as const;
