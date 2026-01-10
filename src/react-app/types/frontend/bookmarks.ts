/**
 * Bookmarks 页面类型定义
 */

/**
 * 内容项配置
 */
export interface ContentItemConfig {
	/** 内容标题 */
	content: string;
	/** 简要描述（显示在卡片上，≤11字符） */
	summary?: string;
	/** 详细描述（鼠标悬停时显示） */
	desc?: string;
	/** 跳转链接 */
	url?: string;
	/** 图标 URL */
	icon?: string;
	/** 是否新窗口打开 */
	newWindow?: boolean;
	/** 排序字段（注意：数据库字段名是 orderM） */
	orderM?: number;
}

/**
 * 模块数据配置
 */
export interface ModuleDataConfig {
	/** 模块描述 */
	desc?: string;
	/** 模块排序 */
	order?: number;
	/** 内容项列表 */
	items: ContentItemConfig[];
}

/**
 * Bookmarks 配置
 * 键为模块名称，值为模块数据
 */
export interface BookmarksConfig {
	[moduleName: string]: ModuleDataConfig;
}

/**
 * 样式配置
 */
export interface StyleConfig {
	/** 主色调 */
	primaryColor: string;
	/** 背景色 */
	backgroundColor: string;
	/** 顶部栏背景色 */
	headerBackgroundColor: string;
	/** 顶部栏文字色 */
	headerTextColor: string;
	/** 卡片背景色 */
	cardBackgroundColor: string;
	/** 搜索框边框色 */
	searchBorderColor: string;
	/** 搜索高亮色 */
	searchHighlightColor: string;
}

/**
 * 响应式断点配置
 */
export interface BreakpointConfig {
	/** 容器最大宽度 */
	containerMaxWidth: string;
	/** 各断点的列数 */
	columns: {
		xl: number;  // >1400px
		lg: number;  // 1200-1400px
		md: number;  // 900-1200px
		sm: number;  // 768-900px
		xs: number;  // 480-768px
		xxs: number; // <480px
	};
}

/**
 * 页面组件 Props（通用）
 */
export interface PageProps<T = any> {
	/** 配置数据 */
	config?: T;
	/** 样式配置 */
	styles?: Partial<StyleConfig>;
}

/**
 * 页面顶部导航栏 Props
 */
export interface PageHeaderProps {
	/** 应用标题 */
	title?: string;
	/** 搜索回调 */
	onSearch?: (term: string) => void;
	/** 样式配置 */
	styles?: Partial<StyleConfig>;
}

/**
 * 内容网格 Props
 */
export interface ContentGridProps {
	/** 配置数据 */
	config: BookmarksConfig;
	/** 搜索关键词 */
	searchTerm?: string;
	/** 样式配置 */
	styles?: Partial<StyleConfig>;
}

/**
 * 内容卡片 Props
 */
export interface ContentCardProps {
	/** 内容项配置 */
	item: ContentItemConfig;
	/** 样式配置 */
	styles?: Partial<StyleConfig>;
}

/**
 * 悬浮球 Props
 */
export interface FloatingBallProps {
	/** 点击回调 */
	onClick?: () => void;
	/** 样式配置 */
	styles?: Partial<StyleConfig>;
}
