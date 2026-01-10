/**
 * 内容网格组件（可复用）
 */

import type { ContentGridProps } from "@/types/frontend/bookmarks";
import { defaultStyles } from "@/config/frontend/bookmarks.config";
import ContentCard from "./ContentCard";

export default function ContentGrid({
	config,
	searchTerm = "",
	styles: customStyles,
}: ContentGridProps) {
	// 合并样式配置
	const styles = { ...defaultStyles, ...customStyles };

	// 搜索关键词转小写
	const searchLower = searchTerm.toLowerCase();

	// 过滤和匹配模块
	const renderModules = () => {
		const modules: React.ReactNode[] = [];
		let hasResults = false;

		for (const [moduleName, moduleData] of Object.entries(config)) {
			// 检查模块名称和描述是否匹配
			const moduleTitleMatch = moduleName.toLowerCase().includes(searchLower);
			const moduleDescMatch = moduleData.desc?.toLowerCase().includes(searchLower);

			// 过滤内容项
			const matchedItems = searchLower
				? moduleData.items.filter(
						(item) =>
							item.content.toLowerCase().includes(searchLower) ||
							item.desc?.toLowerCase().includes(searchLower)
					)
				: moduleData.items;

			// 如果有搜索词，只显示有匹配内容的模块
			const shouldShowModule = !searchLower || moduleTitleMatch || moduleDescMatch || matchedItems.length > 0;

			if (shouldShowModule) {
				if (matchedItems.length > 0 || (moduleTitleMatch || moduleDescMatch)) {
					hasResults = true;
				}

				// 决定显示哪些内容项
				const itemsToShow = searchLower && !moduleTitleMatch && !moduleDescMatch
					? matchedItems  // 只显示匹配的内容项
					: moduleData.items;  // 显示所有内容项

				modules.push(
					<div
						key={moduleName}
						style={{
							background: "transparent",
							padding: "0",
							transition: "transform 0.3s ease",
							marginBottom: "1.5rem",
						}}
					>
						{/* 模块头部 */}
						<div
							style={{
								display: "flex",
								justifyContent: "space-between",
								alignItems: "center",
								marginBottom: "1rem",
								paddingBottom: "0.5rem",
							}}
						>
							<h2
								style={{
									color: styles.primaryColor,
									fontSize: "0.95rem",
									fontWeight: "500",
									flex: 1,
									borderBottom: `1px solid ${styles.primaryColor}`,
									paddingBottom: "0.5rem",
									marginBottom: "-0.5rem",
									maxWidth: "fit-content",
									whiteSpace: "nowrap",
									overflow: "hidden",
									textOverflow: "ellipsis",
								}}
							>
								{highlightText(moduleName, searchLower, styles.searchHighlightColor)}
							</h2>
							{moduleData.desc && (
								<div
									style={{
										color: "#888",
										fontSize: "0.7rem",
										fontStyle: "italic",
										flex: 1,
										textAlign: "right",
										paddingLeft: "1rem",
									}}
								>
									{highlightText(moduleData.desc, searchLower, styles.searchHighlightColor)}
								</div>
							)}
						</div>

						{/* 内容网格 */}
						<div
							style={{
								display: "flex",
								flexWrap: "wrap",
								gap: "1rem",
								alignItems: "flex-start",
							}}
						>
							{itemsToShow.map((item, index) => {
								return (
									<ContentCard
										key={`${moduleName}-${index}`}
										item={item}
										styles={styles}
									/>
								);
							})}
						</div>
					</div>
				);
			}
		}

		return { modules, hasResults };
	};

	const { modules, hasResults } = renderModules();

	return (
		<div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
			{modules}
			{searchTerm && !hasResults && (
				<div
					style={{
						textAlign: "center",
						color: "#7f8c8d",
						fontSize: "0.9rem",
						margin: "2rem 0",
						fontStyle: "italic",
					}}
				>
					没有找到包含 "{searchTerm}" 的内容
				</div>
			)}
		</div>
	);
}

/**
 * 高亮文本
 */
function highlightText(text: string, searchTerm: string, highlightColor: string): React.ReactNode {
	if (!searchTerm) {
		return text;
	}

	const parts = text.split(new RegExp(`(${escapeRegExp(searchTerm)})`, "gi"));

	return parts.map((part, index) => {
		if (part.toLowerCase() === searchTerm.toLowerCase()) {
			return (
				<span
					key={index}
					style={{
						background: highlightColor,
						color: "#333",
						padding: "0 2px",
						borderRadius: "2px",
						fontWeight: "600",
					}}
				>
					{part}
				</span>
			);
		}
		return part;
	});
}

/**
 * 转义正则表达式特殊字符
 */
function escapeRegExp(string: string): string {
	return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
