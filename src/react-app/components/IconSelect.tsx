/**
 * 图标选择器组件
 * 用于在表单中选择图标
 */

import { useState, useMemo } from "react";
import { Modal, Input } from "antd";
import { iconsMap } from "../utils/ui/icons";
import Icon from "./Icon";

interface IconSelectProps {
	value?: string | null;
	onChange?: (value: string) => void;
	placeholder?: string;
}

export default function IconSelect({ value, onChange, placeholder = "选择图标" }: IconSelectProps) {
	const [open, setOpen] = useState(false);
	const [searchText, setSearchText] = useState("");

	// 过滤图标
	const filteredIcons = useMemo(() => {
		if (!searchText) return Object.keys(iconsMap);
		return Object.keys(iconsMap).filter(name =>
			name.toLowerCase().includes(searchText.toLowerCase())
		);
	}, [searchText]);

	const handleSelect = (iconName: string) => {
		onChange?.(iconName);
		setSearchText("");
		setOpen(false);
	};

	return (
		<>
			<div
				onClick={() => setOpen(true)}
				style={{
					padding: "8px 12px",
					border: "1px solid #d9d9d9",
					borderRadius: "6px",
					cursor: "pointer",
					background: "#fff",
					minHeight: "32px",
					display: "flex",
					alignItems: "center",
					gap: "8px",
				}}
				onMouseEnter={(e) => {
					if (!value) e.currentTarget.style.borderColor = "#4096ff";
				}}
				onMouseLeave={(e) => {
					if (!value) e.currentTarget.style.borderColor = "#d9d9d9";
				}}
			>
				{value ? (
					<div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
						<Icon name={value} size={16} />
						<span>{value}</span>
					</div>
				) : (
					<span style={{ color: "#999" }}>{placeholder}</span>
				)}
			</div>

			<Modal
				title="选择图标"
				open={open}
				onCancel={() => {
					setOpen(false);
					setSearchText("");
				}}
				footer={null}
				width={600}
			>
				<Input
					placeholder="搜索图标..."
					value={searchText}
					onChange={(e) => setSearchText(e.target.value)}
					style={{ marginBottom: "16px" }}
				/>
				<div
					style={{
						maxHeight: "400px",
						overflowY: "auto",
						display: "grid",
						gridTemplateColumns: "repeat(5, 1fr)",
						gap: "16px",
						scrollbarWidth: "none",
						msOverflowStyle: "none",
					}}
				>
					{filteredIcons.map((iconName) => {
						const IconComponent = iconsMap[iconName];
						const isSelected = value === iconName;
						return (
							<div
								key={iconName}
								onClick={() => handleSelect(iconName)}
								style={{
									padding: "12px",
									textAlign: "center",
									cursor: "pointer",
									border: isSelected ? "2px solid #1890ff" : "1px solid #d9d9d9",
									borderRadius: "6px",
									background: isSelected ? "#e6f7ff" : "transparent",
									transition: "all 0.2s",
								}}
								onMouseEnter={(e) => {
									e.currentTarget.style.borderColor = "#1890ff";
									e.currentTarget.style.background = "#f5f5f5";
								}}
								onMouseLeave={(e) => {
									if (!isSelected) {
										e.currentTarget.style.borderColor = "#d9d9d9";
										e.currentTarget.style.background = "transparent";
									}
								}}
							>
								<div style={{ fontSize: "24px", marginBottom: "8px" }}>
									{IconComponent && <IconComponent size={24} />}
								</div>
								<div style={{ fontSize: "11px", color: "#666", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
									{iconName.replace(/^Fa/, "")}
								</div>
							</div>
						);
					})}
				</div>
			</Modal>
		</>
	);
}
