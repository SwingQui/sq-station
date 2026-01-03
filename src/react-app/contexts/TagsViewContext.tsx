/**
 * 标签页导航上下文
 * 管理已打开的页面标签
 */

import { createContext, useContext, useState, useCallback, useRef, useEffect, ReactNode } from "react";
import { navigate } from "../utils/router";

export interface Tab {
	key: string;      // 路由路径，如 "/system/user"
	title: string;    // 页面标题，如 "用户管理"
	closable: boolean; // 是否可关闭（首页不可关闭）
}

interface TagsViewContextType {
	tabs: Tab[];
	activeTab: string;
	addTab: (tab: Tab) => void;
	removeTab: (key: string) => void;
	setActiveTab: (key: string) => void;
	closeOtherTabs: () => void;
	closeAllTabs: () => void;
}

const TagsViewContext = createContext<TagsViewContextType | undefined>(undefined);

export function TagsViewProvider({ children }: { children: ReactNode }) {
	const [tabs, setTabs] = useState<Tab[]>([
		{ key: "/system", title: "系统首页", closable: false },
	]);
	const [activeTab, setActiveTabState] = useState("/system");
	const pendingNavigationRef = useRef<string | null>(null);

	// 添加标签页
	const addTab = useCallback((tab: Tab) => {
		setTabs((prev) => {
			const exists = prev.find((t) => t.key === tab.key);
			if (exists) {
				return prev;
			}
			return [...prev, tab];
		});
		setActiveTabState(tab.key);
	}, []);

	// 移除标签页
	const removeTab = useCallback((key: string) => {
		setTabs((prev) => {
			const newTabs = prev.filter((t) => t.key !== key);
			// 如果删除的是当前活动标签，切换到最后一个标签
			if (activeTab === key && newTabs.length > 0) {
				const newActiveTab = newTabs[newTabs.length - 1].key;
				setActiveTabState(newActiveTab);
				pendingNavigationRef.current = newActiveTab;
			}
			return newTabs;
		});
	}, [activeTab]);

	// 设置活动标签
	const setActiveTab = useCallback((key: string) => {
		setActiveTabState(key);
	}, []);

	// 关闭其他标签
	const closeOtherTabs = useCallback(() => {
		setTabs((prev) => prev.filter((t) => !t.closable));
		setActiveTabState("/system");
	}, []);

	// 关闭所有标签
	const closeAllTabs = useCallback(() => {
		setTabs((prev) => prev.filter((t) => !t.closable));
		setActiveTabState("/system");
	}, []);

	// 延迟处理导航，避免在渲染过程中触发其他组件的状态更新
	useEffect(() => {
		if (pendingNavigationRef.current) {
			navigate(pendingNavigationRef.current, true);
			pendingNavigationRef.current = null;
		}
	}, [tabs, activeTab]);

	const value: TagsViewContextType = {
		tabs,
		activeTab,
		addTab,
		removeTab,
		setActiveTab,
		closeOtherTabs,
		closeAllTabs,
	};

	return <TagsViewContext.Provider value={value}>{children}</TagsViewContext.Provider>;
}

export function useTagsView() {
	const context = useContext(TagsViewContext);
	if (context === undefined) {
		throw new Error("useTagsView must be used within a TagsViewProvider");
	}
	return context;
}
