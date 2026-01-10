/**
 * 页面顶部导航栏组件（可复用）
 */

import { useState, useCallback } from "react";
import type { PageHeaderProps } from "@/types/frontend/bookmarks";
import { defaultStyles } from "@/config/frontend/bookmarks.config";

export default function PageHeader({
	title,
	onSearch,
	styles: customStyles,
}: PageHeaderProps) {
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
			</div>
		</header>
	);
}
