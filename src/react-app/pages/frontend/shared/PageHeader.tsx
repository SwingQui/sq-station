/**
 * 页面顶部导航栏组件（可复用）
 */

import { useState, useCallback } from "react";
import type { PageHeaderProps } from "@/types/frontend/bookmarks";
import { defaultStyles } from "@/config/frontend/bookmarks.config";

// GitHub SVG 图标
const GitHubIcon = () => (
	<svg
		height="18"
		width="18"
		viewBox="0 0 16 16"
		version="1.1"
		aria-hidden="true"
		fill="currentColor"
	>
		<path
			d="M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9.82 1.13.16.45.68 1.31 2.69.94 0 .67.01 1.3.01 1.49 0 .21-.15.45-.55.38A7.995 7.995 0 0 1 0 8c0-4.42 3.58-8 8-8Z"
		/>
	</svg>
);

// 扩展 Props 支持切换按钮
interface ExtendedPageHeaderProps extends PageHeaderProps {
	activeTab?: "bookmarks" | "tools";
	onTabChange?: (tab: "bookmarks" | "tools") => void;
	showTabSwitch?: boolean;
}

export default function PageHeader({
	title,
	onSearch,
	styles: customStyles,
	activeTab = "bookmarks",
	onTabChange,
	showTabSwitch = false,
}: ExtendedPageHeaderProps) {
	const [searchTerm, setSearchTerm] = useState("");
	const [isFocused, setIsFocused] = useState(false);

	// 合并样式配置
	const styles = { ...defaultStyles, ...customStyles };

	// 防抖搜索
	const debouncedSearch = useCallback(
		((fn: (term: string) => void, delay: number) => {
			let timeoutId: NodeJS.Timeout;
			return (term: string) => {
				clearTimeout(timeoutId);
				timeoutId = setTimeout(() => fn(term), delay);
			};
		})((term: string) => onSearch?.(term), 300),
		[onSearch]
	);

	// 处理搜索输入变化
	const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const value = e.target.value;
		setSearchTerm(value);
		debouncedSearch(value);
	};

	// 清除搜索
	const handleClearSearch = () => {
		setSearchTerm("");
		onSearch?.("");
	};

	return (
		<header
			style={{
				background: styles.headerBackgroundColor,
				color: styles.headerTextColor,
				padding: "0.5rem 0",
				boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
				borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
			}}
		>
			<div
				style={{
					display: "flex",
					justifyContent: "space-between",
					alignItems: "center",
					width: "calc(100vw * 5 / 7)",
					maxWidth: "calc(100vw * 5 / 7)",
					margin: "0 auto",
					padding: "0 1rem",
				}}
			>
				<h1
					style={{
						fontSize: "1.2rem",
						fontWeight: "400",
						letterSpacing: "1px",
						margin: "0",
					}}
				>
					{title}
				</h1>

				{/* SwitchButton 切换按钮 */}
				{showTabSwitch && (
					<div
						style={{
							display: "flex",
							background: "rgba(255, 255, 255, 0.1)",
							borderRadius: "6px",
							padding: "4px",
						}}
					>
						<button
							onClick={() => onTabChange?.("bookmarks")}
							style={{
								padding: "6px 16px",
								border: "none",
								borderRadius: "4px",
								background:
									activeTab === "bookmarks"
										? "rgba(255, 255, 255, 0.2)"
										: "transparent",
								color: styles.headerTextColor,
								cursor: "pointer",
								fontSize: "0.9rem",
								transition: "all 0.3s ease",
							}}
						>
							书签
						</button>
						<button
							onClick={() => onTabChange?.("tools")}
							style={{
								padding: "6px 16px",
								border: "none",
								borderRadius: "4px",
								background:
									activeTab === "tools"
										? "rgba(255, 255, 255, 0.2)"
										: "transparent",
								color: styles.headerTextColor,
								cursor: "pointer",
								fontSize: "0.9rem",
								transition: "all 0.3s ease",
							}}
						>
							站点工具
						</button>
					</div>
				)}

				<div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
					{/* 搜索框 */}
					<div
						style={{
							position: "relative",
							display: "flex",
							alignItems: "center",
						}}
					>
						<input
							type="text"
							value={searchTerm}
							onChange={handleSearchChange}
							onFocus={() => setIsFocused(true)}
							onBlur={() => setIsFocused(false)}
							placeholder="搜索..."
							style={{
								padding: "0.4rem 2rem 0.4rem 0.8rem",
								border: `1px solid ${styles.searchBorderColor}`,
								borderRadius: "6px",
								background: isFocused
									? "rgba(255, 255, 255, 0.15)"
									: "rgba(255, 255, 255, 0.1)",
								color: styles.headerTextColor,
								fontSize: "0.9rem",
								width: isFocused ? "250px" : "200px",
								transition: "all 0.3s ease",
								outline: "none",
							}}
						/>
						<style>{`
							input::placeholder {
								color: rgba(255, 255, 255, 0.7);
							}
						`}</style>

						{searchTerm && (
							<button
								onClick={handleClearSearch}
								style={{
									position: "absolute",
									right: "0.5rem",
									background: "none",
									border: "none",
									color: "rgba(255, 255, 255, 0.8)",
									fontSize: "1.2rem",
									cursor: "pointer",
									padding: "0",
									width: "20px",
									height: "20px",
									display: "flex",
									alignItems: "center",
									justifyContent: "center",
									borderRadius: "50%",
									transition: "all 0.3s ease",
								}}
								onMouseEnter={(e) => {
									e.currentTarget.style.background = "rgba(255, 255, 255, 0.2)";
									e.currentTarget.style.color = "white";
								}}
								onMouseLeave={(e) => {
									e.currentTarget.style.background = "none";
									e.currentTarget.style.color = "rgba(255, 255, 255, 0.8)";
								}}
							>
								×
							</button>
						)}
					</div>

					{/* GitHub 链接 */}
					<a
						href="https://github.com/SwingQui"
						target="_blank"
						rel="noopener noreferrer"
						title="GitHub"
						style={{
							display: "flex",
							alignItems: "center",
							gap: "6px",
							color: styles.headerTextColor,
							textDecoration: "none",
							padding: "6px 10px",
							borderRadius: "6px",
							background: "rgba(255, 255, 255, 0.1)",
							transition: "all 0.3s ease",
							fontSize: "0.85rem",
						}}
						onMouseEnter={(e) => {
							e.currentTarget.style.background = "rgba(255, 255, 255, 0.2)";
						}}
						onMouseLeave={(e) => {
							e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)";
						}}
					>
						<GitHubIcon />
						<span>GitHub</span>
					</a>
				</div>
			</div>
		</header>
	);
}
