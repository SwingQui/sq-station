/**
 * 内容卡片组件（可复用）
 * 布局结构：
 *   [图标] [标题]
 *   [图标] [描述]
 *   [图标] [描述]
 */

import { useState, useMemo } from "react";
import type { ContentCardProps } from "@/types/frontend/bookmarks";
import { defaultStyles, getColorByFirstChar } from "@/config/frontend/bookmarks.config";

/**
 * 从 URL 中提取域名
 */
function extractDomain(url: string): string | null {
	try {
		if (!url || url === "#") return null;
		const urlObj = new URL(url);
		return urlObj.hostname;
	} catch {
		return null;
	}
}

export default function ContentCard({
	item,
	styles: customStyles,
}: ContentCardProps) {
	const [imageLoaded, setImageLoaded] = useState(false);
	const [isHovered, setIsHovered] = useState(false);

	// 合并样式配置
	const styles = { ...defaultStyles, ...customStyles };

	// 优先使用手动设置的 icon，否则从 URL 自动获取 favicon
	const faviconUrl = useMemo(() => {
		if (item.icon) return item.icon;
		if (item.url) {
			const domain = extractDomain(item.url);
			return domain ? `https://favicon.im/${domain}` : null;
		}
		return null;
	}, [item.icon, item.url]);

	// 获取显示的简要描述（≤11字符）
	const displaySummary = useMemo(() => {
		if (item.summary) return item.summary;
		if (item.desc) return item.desc.slice(0, 11);
		return "";
	}, [item.summary, item.desc]);

	// 获取详细描述（用于 tooltip）
	const tooltipDesc = useMemo(() => {
		if (item.desc) return item.desc;
		if (item.summary) return item.summary;
		return item.content;
	}, [item.desc, item.summary, item.content]);

	// 处理点击
	const handleClick = () => {
		if (!item.url || item.url === "#") {
			return;
		}

		// 在新 tab 打开链接
		window.open(item.url, "_blank", "noopener,noreferrer");
	};

	// 获取图标内容
	const renderIcon = () => {
		// 首字母图标
		const firstChar = (item.content || "").trim().charAt(0).toUpperCase();
		const bgColor = firstChar ? getColorByFirstChar(firstChar) : "#95a5a6";

		return (
			<div style={{
				width: "32px",
				height: "32px",
				minWidth: "32px",
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				borderRadius: "6px",
				overflow: "hidden",
				background: isHovered ? "rgba(255, 255, 255, 0.2)" : "#f8f9fa",
				border: "1px solid #e9ecef",
				position: "relative",
			}}>
				{/* favicon */}
				{faviconUrl && (
					<img
						src={faviconUrl}
						alt={item.content}
						style={{
							width: "20px",
							height: "20px",
							objectFit: "contain",
							borderRadius: "3px",
							display: imageLoaded ? "block" : "none",
							zIndex: 2,
						}}
						onLoad={() => setImageLoaded(true)}
						onError={() => setImageLoaded(false)}
					/>
				)}

				{/* 首字母图标（兜底） */}
				{(!faviconUrl || !imageLoaded) && (
					<div style={{
						width: "32px",
						height: "32px",
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						fontSize: "12px",
						fontWeight: "600",
						color: "white",
						textTransform: "uppercase",
						background: bgColor,
						position: "absolute",
						top: 0,
						left: 0,
					}}>
						{firstChar || "🔗"}
					</div>
				)}
			</div>
		);
	};

	return (
		<div
			title={displaySummary ? tooltipDesc : undefined}
			style={{
				flex: "0 0 calc(16.666% - 0.8rem)",
				minWidth: "140px",
				padding: "0.8rem",
				background: isHovered ? styles.primaryColor : styles.cardBackgroundColor,
				borderRadius: "8px",
				boxShadow: "0 2px 6px rgba(0, 0, 0, 0.08)",
				cursor: item.url ? "pointer" : "default",
				transition: "all 0.3s ease",
			}}
			onMouseEnter={() => setIsHovered(true)}
			onMouseLeave={() => setIsHovered(false)}
			onClick={handleClick}
		>
			{/* 网格布局：图标跨两行，标题和描述各占一行 */}
			<div style={{
				display: "grid",
				gridTemplateColumns: "32px 1fr",
				gridTemplateRows: "auto auto",
				gap: "0.2rem 0.6rem",
				alignItems: "start",
			}}>
				{/* 图标 - 跨两行 */}
				<div style={{
					gridRow: "1 / 3",
					gridColumn: "1",
					display: "flex",
					alignItems: "start",
				}}>
					{renderIcon()}
				</div>

				{/* 标题 */}
				<div
					className="content-title"
					style={{
						gridRow: "1",
						gridColumn: "2",
						fontSize: "0.85rem",
						fontWeight: "600",
						color: isHovered ? "white" : "#333",
						lineHeight: "1.2",
						overflow: "hidden",
						textOverflow: "ellipsis",
						whiteSpace: "nowrap",
					}}
				>
					{item.content}
				</div>

				{/* 描述 */}
				{displaySummary && (
					<div
						className="content-desc"
						style={{
							gridRow: "2",
							gridColumn: "2",
							fontSize: "0.7rem",
							color: isHovered ? "rgba(255, 255, 255, 0.8)" : "#666",
							lineHeight: "1.2",
							display: "-webkit-box",
							WebkitLineClamp: 2,
							WebkitBoxOrient: "vertical",
							overflow: "hidden",
							textOverflow: "ellipsis",
						}}
					>
						{displaySummary}
					</div>
				)}
			</div>
		</div>
	);
}
