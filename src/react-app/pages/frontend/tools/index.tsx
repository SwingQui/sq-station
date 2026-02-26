/**
 * 站点工具前台页面 - 紧凑卡片风格
 * 特点：空间利用率高、信息清晰、视觉舒适
 */

import { useState, useEffect } from "react";
import { Dropdown, Spin, Empty, message } from "antd";
import {
	WindowsOutlined,
	AndroidOutlined,
	DownloadOutlined,
} from "@ant-design/icons";
import { getToolsList, downloadToolFile, formatFileSize, type Tool } from "@api/tools";

// 工具图标背景色
const iconColors = [
	"#667eea", "#4facfe", "#43e97b", "#fa709a",
	"#f093fb", "#ff9a9e", "#a1c4fd", "#d299c2",
];

function getToolColor(name: string): string {
	const index = name.charCodeAt(0) % iconColors.length;
	return iconColors[index];
}

interface ToolsPageProps {
	searchTerm?: string;
}

export default function ToolsPage({ searchTerm = "" }: ToolsPageProps) {
	const [tools, setTools] = useState<Tool[]>([]);
	const [loading, setLoading] = useState(true);
	const [hoveredId, setHoveredId] = useState<number | null>(null);

	useEffect(() => {
		loadTools();
	}, []);

	const loadTools = async () => {
		try {
			setLoading(true);
			const data = await getToolsList();
			setTools(data);
		} catch (error) {
			console.error("加载工具列表失败:", error);
		} finally {
			setLoading(false);
		}
	};

	const handleDownload = async (platform: "windows" | "android", fileName: string) => {
		try {
			message.loading({ content: "正在下载...", key: "download" });
			await downloadToolFile(platform, fileName);
			message.success({ content: "下载完成", key: "download" });
		} catch (error: any) {
			console.error("下载失败:", error);
			message.error({ content: error.message || "下载失败", key: "download" });
		}
	};

	const renderDownloadOptions = (tool: Tool) => {
		const options = [];

		if (tool.windows_file_name) {
			options.push(
				<div
					key="windows"
					style={downloadOptionStyle}
					onClick={() => handleDownload("windows", tool.windows_file_name!)}
				>
					<WindowsOutlined style={{ color: "#0078d4", fontSize: 16 }} />
					<span style={downloadOptionTextStyle}>Windows</span>
					<span style={downloadSizeStyle}>{formatFileSize(tool.windows_file_size)}</span>
				</div>
			);
		}

		if (tool.android_file_name) {
			options.push(
				<div
					key="android"
					style={downloadOptionStyle}
					onClick={() => handleDownload("android", tool.android_file_name!)}
				>
					<AndroidOutlined style={{ color: "#3ddc84", fontSize: 16 }} />
					<span style={downloadOptionTextStyle}>Android</span>
					<span style={downloadSizeStyle}>{formatFileSize(tool.android_file_size)}</span>
				</div>
			);
		}

		return options;
	};

	// 过滤工具列表
	const filteredTools = tools.filter((tool) => {
		if (!searchTerm) return true;
		const term = searchTerm.toLowerCase();
		return (
			tool.tool_name.toLowerCase().includes(term) ||
			(tool.description && tool.description.toLowerCase().includes(term))
		);
	});

	if (loading) {
		return (
			<div style={loadingContainerStyle}>
				<Spin size="large" />
			</div>
		);
	}

	return (
		<div style={{ marginTop: "1.5rem" }}>
			<h2 style={titleStyle}>站点工具</h2>

			{filteredTools.length === 0 ? (
				<Empty description={searchTerm ? "未找到匹配的工具" : "暂无工具"} style={{ padding: "60px 0" }} />
			) : (
				<div style={gridStyle}>
					{filteredTools.map((tool) => {
						const iconColor = getToolColor(tool.tool_name);
						const isHovered = hoveredId === tool.id;
						const hasDownload = tool.windows_file_name || tool.android_file_name;

						return (
							<div
								key={tool.id}
								style={{
									...cardStyle,
									transform: isHovered ? "translateY(-4px)" : "translateY(0)",
									boxShadow: isHovered
										? "0 12px 24px rgba(0, 0, 0, 0.12)"
										: "0 2px 8px rgba(0, 0, 0, 0.06)",
								}}
								onMouseEnter={() => setHoveredId(tool.id)}
								onMouseLeave={() => setHoveredId(null)}
							>
								{/* 顶部：图标 + 名称 + 平台标签 */}
								<div style={cardTopStyle}>
									<div
										style={{
											...iconStyle,
											background: iconColor,
										}}
									>
										{tool.icon ? (
											<img src={tool.icon} alt={tool.tool_name} style={iconImageStyle} />
										) : (
											<span style={iconTextStyle}>{tool.tool_name.charAt(0).toUpperCase()}</span>
										)}
									</div>

									<div style={cardInfoStyle}>
										<h3 style={toolNameStyle}>{tool.tool_name}</h3>
										<div style={platformRowStyle}>
											{tool.windows_file_name && (
												<span style={windowsTagStyle}>
													<WindowsOutlined style={{ fontSize: 11 }} /> Win
												</span>
											)}
											{tool.android_file_name && (
												<span style={androidTagStyle}>
													<AndroidOutlined style={{ fontSize: 11 }} /> Android
												</span>
											)}
										</div>
									</div>
								</div>

								{/* 描述 */}
								<p style={toolDescStyle}>
									{tool.description || "暂无描述"}
								</p>

								{/* 下载区域 */}
								<div style={downloadAreaStyle}>
									{hasDownload ? (
										<Dropdown
											dropdownRender={() => (
												<div style={dropdownStyle}>
													{renderDownloadOptions(tool)}
												</div>
											)}
											trigger={["click"]}
											placement="bottomLeft"
										>
											<button style={downloadBtnStyle}>
												<DownloadOutlined style={{ marginRight: 6 }} />
												下载
											</button>
										</Dropdown>
									) : (
										<button style={disabledBtnStyle} disabled>暂无下载</button>
									)}
								</div>
							</div>
						);
					})}
				</div>
			)}
		</div>
	);
}

// ==================== 样式 ====================

const loadingContainerStyle: React.CSSProperties = {
	display: "flex",
	justifyContent: "center",
	alignItems: "center",
	height: "50vh",
};

const titleStyle: React.CSSProperties = {
	margin: "0 0 20px",
	fontSize: "22px",
	fontWeight: 600,
	color: "#2c3e50",
};

const gridStyle: React.CSSProperties = {
	display: "grid",
	gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
	gap: "16px",
};

const cardStyle: React.CSSProperties = {
	background: "#fff",
	borderRadius: "12px",
	padding: "16px",
	border: "1px solid #e8e8e8",
	transition: "all 0.25s ease",
	display: "flex",
	flexDirection: "column",
};

const cardTopStyle: React.CSSProperties = {
	display: "flex",
	alignItems: "center",
	gap: "12px",
	marginBottom: "12px",
};

const iconStyle: React.CSSProperties = {
	width: "48px",
	height: "48px",
	borderRadius: "10px",
	display: "flex",
	alignItems: "center",
	justifyContent: "center",
	flexShrink: 0,
};

const iconImageStyle: React.CSSProperties = {
	width: "32px",
	height: "32px",
	borderRadius: "6px",
	objectFit: "cover",
};

const iconTextStyle: React.CSSProperties = {
	fontSize: "22px",
	color: "white",
	fontWeight: 600,
};

const cardInfoStyle: React.CSSProperties = {
	flex: 1,
	minWidth: 0,
};

const toolNameStyle: React.CSSProperties = {
	margin: "0 0 6px",
	fontSize: "15px",
	fontWeight: 600,
	color: "#2c3e50",
	overflow: "hidden",
	textOverflow: "ellipsis",
	whiteSpace: "nowrap",
};

const platformRowStyle: React.CSSProperties = {
	display: "flex",
	gap: "6px",
};

const windowsTagStyle: React.CSSProperties = {
	display: "inline-flex",
	alignItems: "center",
	gap: "3px",
	padding: "2px 6px",
	background: "#e6f4ff",
	color: "#0078d4",
	borderRadius: "4px",
	fontSize: "11px",
	fontWeight: 500,
};

const androidTagStyle: React.CSSProperties = {
	display: "inline-flex",
	alignItems: "center",
	gap: "3px",
	padding: "2px 6px",
	background: "#e8f5e9",
	color: "#2e7d32",
	borderRadius: "4px",
	fontSize: "11px",
	fontWeight: 500,
};

const toolDescStyle: React.CSSProperties = {
	margin: "0 0 14px",
	fontSize: "13px",
	color: "#666",
	lineHeight: 1.5,
	flex: 1,
	display: "-webkit-box",
	WebkitLineClamp: 2,
	WebkitBoxOrient: "vertical",
	overflow: "hidden",
};

const downloadAreaStyle: React.CSSProperties = {
	marginTop: "auto",
};

const downloadBtnStyle: React.CSSProperties = {
	width: "100%",
	display: "flex",
	alignItems: "center",
	justifyContent: "center",
	padding: "10px 16px",
	background: "#667eea",
	color: "white",
	border: "none",
	borderRadius: "8px",
	fontSize: "13px",
	fontWeight: 500,
	cursor: "pointer",
	transition: "all 0.2s ease",
};

const disabledBtnStyle: React.CSSProperties = {
	width: "100%",
	display: "flex",
	alignItems: "center",
	justifyContent: "center",
	padding: "10px 16px",
	background: "#f5f5f5",
	color: "#999",
	border: "none",
	borderRadius: "8px",
	fontSize: "13px",
	fontWeight: 500,
	cursor: "not-allowed",
};

const dropdownStyle: React.CSSProperties = {
	background: "#fff",
	borderRadius: "8px",
	boxShadow: "0 6px 20px rgba(0, 0, 0, 0.12)",
	border: "1px solid #eee",
	padding: "6px",
	minWidth: "180px",
};

const downloadOptionStyle: React.CSSProperties = {
	display: "flex",
	alignItems: "center",
	gap: "10px",
	padding: "10px 12px",
	borderRadius: "6px",
	cursor: "pointer",
	transition: "background 0.15s ease",
};

const downloadOptionTextStyle: React.CSSProperties = {
	flex: 1,
	fontSize: "13px",
	fontWeight: 500,
	color: "#333",
};

const downloadSizeStyle: React.CSSProperties = {
	fontSize: "12px",
	color: "#999",
};
