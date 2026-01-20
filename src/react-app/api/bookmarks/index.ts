/**
 * Bookmarks 书签配置 API
 * 路径前缀: /api/frontend/bookmarks
  *
 * 架构分层：
 * 组件 → 二次封装 (本文件) → 一次封装 (api/index.ts) → 底层 (utils/core/request)
 */

import { request } from "@/api";

// 书签数据类型定义（与 kv-schema.json 保持一致）
export interface BookmarkItem {
	content: string;
	summary?: string;
	desc?: string;
	url?: string;
	icon?: string;
	newWindow?: boolean;
	orderM?: number;
}

export interface BookmarkModule {
	desc: string;
	order: number;
	items: BookmarkItem[];
}

export type BookmarksConfig = Record<string, BookmarkModule>;

export interface BookmarksResponse {
	config: BookmarksConfig;
}

/**
 * 获取 Bookmarks 配置
 */
export async function getBookmarksConfig(): Promise<BookmarksConfig> {
	return await request<BookmarksConfig>("GET", "/api/frontend/bookmarks/config");
}

/**
 * 保存 Bookmarks 配置
 */
export async function saveBookmarksConfig(config: BookmarksConfig): Promise<BookmarksResponse> {
	return await request<BookmarksResponse>("PUT", "/api/frontend/bookmarks/config", { config });
}
