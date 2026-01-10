/**
 * Bookmarks 页面 - 主入口组件
 */

import { useState, useEffect } from "react";
import type { PageProps } from "@/types/frontend/bookmarks";
import { defaultStyles } from "@/config/frontend/bookmarks.config";
import { APP } from "@/config/app.config";
import PageHeader from "../shared/PageHeader";
import ContentGrid from "../shared/ContentGrid";
import FloatingBall from "../shared/FloatingBall";
import { get } from "@/utils/core/request";

export default function BookmarksPage({
	styles: customStyles,
}: PageProps) {
	const [searchTerm, setSearchTerm] = useState("");
	const [config, setConfig] = useState<Record<string, any>>({});
	const [loading, setLoading] = useState(true);

	// 合并样式配置
	const styles = { ...defaultStyles, ...customStyles };

	// 从 KV 加载配置数据
	useEffect(() => {
		loadConfig();
	}, []);

	const loadConfig = async () => {
		try {
			setLoading(true);
			// 从 API 获取 Bookmarks 配置
			const data = await get<Record<string, any>>("/api/frontend/bookmarks/config");
			setConfig(data || {});
		} catch (error) {
			console.error("加载 Bookmarks 配置失败:", error);
			setConfig({});
		} finally {
			setLoading(false);
		}
	};

	// 处理搜索
	const handleSearch = (term: string) => {
		setSearchTerm(term);
	};

	// 处理悬浮球点击
	const handleFloatingBallClick = () => {
		console.log("悬浮球被点击");
	};

	if (loading) {
		return (
			<div
				style={{
					display: "flex",
					justifyContent: "center",
					alignItems: "center",
					height: "100vh",
					fontSize: "16px",
					color: "#666",
					background: styles.backgroundColor,
				}}
			>
				加载中...
			</div>
		);
	}

	return (
		<div
			style={{
				minHeight: "100vh",
				display: "flex",
				flexDirection: "column",
				background: styles.backgroundColor,
			}}
		>
			{/* 顶部导航栏 */}
			<PageHeader
				title={APP.NAME}
				onSearch={handleSearch}
				styles={styles}
			/>

			{/* 主内容区域 */}
			<main
				style={{
					width: "calc(100vw * 5 / 7)",
					maxWidth: "calc(100vw * 5 / 7)",
					margin: "2rem auto",
					padding: "0 1rem",
					flex: 1,
				}}
			>
				<ContentGrid
					config={config}
					searchTerm={searchTerm}
					styles={styles}
				/>
			</main>

			{/* 页脚 */}
			<footer
				style={{
					background: styles.headerBackgroundColor,
					color: styles.headerTextColor,
					textAlign: "center",
					padding: "2rem 0",
					marginTop: "3rem",
				}}
			>
				<p style={{ fontSize: "0.9rem", margin: 0 }}>
					&copy; {new Date().getFullYear()} {APP.NAME}. 版权所有.
				</p>
			</footer>

			{/* 悬浮球 */}
			<FloatingBall
				onClick={handleFloatingBallClick}
				styles={styles}
			/>
		</div>
	);
}
