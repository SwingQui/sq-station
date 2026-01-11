import { useState, useMemo } from "react";
import { Space, Typography, Button, message, Input } from "antd";
import { LinkOutlined, CopyOutlined } from "@ant-design/icons";
import type { KVItem } from "../utils/parser";
import { formatJSON, detectValueType } from "../utils/parser";
import "./../KVManage.css";

const { TextArea } = Input;
const { Text } = Typography;

interface KVValueDisplayProps {
	item: KVItem;
	editing?: boolean;
	onEditChange?: (editing: boolean) => void;
	onSave?: (newValue: string) => Promise<void>;
}

export default function KVValueDisplay({ item, editing = false, onEditChange, onSave }: KVValueDisplayProps) {
	const [copied, setCopied] = useState(false);
	const [editValue, setEditValue] = useState(item.value);
	const [saving, setSaving] = useState(false);

	// 格式化 JSON
	const formattedJSON = useMemo(() => {
		if (item.valueType === "json") {
			return formatJSON(item.value);
		}
		return item.value;
	}, [item.value, item.valueType]);

	// 复制到剪贴板
	const handleCopy = async () => {
		try {
			await navigator.clipboard.writeText(item.value);
			setCopied(true);
			message.success("已复制到剪贴板");
			setTimeout(() => setCopied(false), 2000);
		} catch {
			message.error("复制失败");
		}
	};

	// 保存编辑
	const handleSave = async () => {
		if (onSave) {
			setSaving(true);
			try {
				await onSave(editValue);
				onEditChange?.(false);
			} catch (e) {
				message.error("保存失败");
			}
			setSaving(false);
		}
	};

	// 取消编辑
	const handleCancel = () => {
		setEditValue(item.value);
		onEditChange?.(false);
	};

	// 渲染编辑模式
	if (editing) {
		return (
			<div>
				<TextArea
					value={editValue}
					onChange={(e) => setEditValue(e.target.value)}
					rows={10}
					style={{ fontFamily: "monospace", fontSize: 13 }}
					showCount
					maxLength={100000}
				/>
				<Space style={{ marginTop: 12, justifyContent: "flex-end", width: "100%" }}>
					<Button size="small" onClick={handleCancel}>
						取消
					</Button>
					<Button
						type="primary"
						size="small"
						onClick={handleSave}
						loading={saving}
						icon={<span style={{ fontSize: 12 }}>✓</span>}
					>
						保存
					</Button>
				</Space>
			</div>
		);
	}

	// 渲染不同类型的值
	const renderValue = () => {
		switch (item.valueType) {
			case "json":
				return (
					<pre className="kv-json-display">
						<code>{formattedJSON}</code>
					</pre>
				);

			case "url":
				return (
					<Space direction="vertical" style={{ width: "100%" }}>
						<div className="kv-url-display">
							<a href={item.value} target="_blank" rel="noopener noreferrer">
								{item.value}
							</a>
							<Button
								size="small"
								icon={<LinkOutlined />}
								onClick={() => window.open(item.value, "_blank")}
							>
								打开链接
							</Button>
						</div>
					</Space>
				);

			case "xml":
				return (
					<pre className="kv-json-display">
						<code>{item.value}</code>
					</pre>
				);

			case "yaml":
				return (
					<pre className="kv-json-display">
						<code>{item.value}</code>
					</pre>
				);

			default:
				return (
					<div className="kv-text-display">
						<Text>{item.value || <Text type="secondary">(空值)</Text>}</Text>
					</div>
				);
		}
	};

	return (
		<div>
			{renderValue()}
			<Space className="kv-item-actions">
				<Button
					size="small"
					icon={<CopyOutlined />}
					onClick={handleCopy}
					loading={copied}
				>
					{copied ? "已复制" : "复制"}
				</Button>
			</Space>
		</div>
	);
}
