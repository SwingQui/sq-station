/**
 * 前台首页 - 容器组件
 * 支持书签和站点工具切换
 */

import { useState, useEffect } from "react";
import { defaultStyles } from "@/config/frontend/bookmarks.config";
import { APP } from "@/config/app.config";
import PageHeader from "./frontend/shared/PageHeader";
import ContentGrid from "./frontend/shared/ContentGrid";
import FloatingBall from "./frontend/shared/FloatingBall";
import ToolsPage from "./frontend/tools";
import { getBookmarksConfig } from "@api/bookmarks";

type TabType = "bookmarks" | "tools";

export default function Home() {
	const [activeTab, setActiveTab] = useState<TabType>("bookmarks");
	const [searchTerm, setSearchTerm] = useState("");
	const [config, setConfig] = useState<Record<string, any>>({});
	const [loading, setLoading] = useState(true);

	const styles = defaultStyles;

	// 加载书签配置
	useEffect(() => {
		loadConfig();
	}, []);

	const loadConfig = async () => {
		try {
			setLoading(true);
			const data = await getBookmarksConfig();
			setConfig(data || {});
		} catch (error) {
			console.error("加载 Bookmarks 配置失败:", error);
			setConfig({});
		} finally {
			setLoading(false);
		}
	};

	const handleSearch = (term: string) => {
		setSearchTerm(term);
	};

	const handleTabChange = (tab: TabType) => {
		setActiveTab(tab);
		setSearchTerm("");
	};

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
				onSearch={activeTab === "bookmarks" ? handleSearch : undefined}
				styles={styles}
				activeTab={activeTab}
				onTabChange={handleTabChange}
				showTabSwitch={true}
			/>

			{/* 主内容区域 */}
			<main
				style={{
					width: "calc(100vw * 5 / 7)",
					maxWidth: "calc(100vw * 5 / 7)",
					margin: "0 auto",
					padding: "0 1rem",
					flex: 1,
				}}
			>
				{activeTab === "bookmarks" ? (
					<div style={{ marginTop: "2rem" }}>
						<ContentGrid
							config={config}
							searchTerm={searchTerm}
							styles={styles}
						/>
					</div>
				) : (
					<ToolsPage />
				)}
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
			<FloatingBall onClick={handleFloatingBallClick} styles={styles} />
		</div>
	);
}
