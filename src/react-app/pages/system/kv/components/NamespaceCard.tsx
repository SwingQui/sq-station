import { useState } from "react";
import { Card, Collapse, Space, Tag, Typography, Button, Tooltip, message } from "antd";
import { KeyOutlined, EditOutlined, DeleteOutlined, CaretRightOutlined, CloseOutlined, CheckOutlined } from "@ant-design/icons";
import type { NamespaceGroup, KVItem } from "../utils/parser";
import { getValueTypeColor } from "../utils/parser";
import KVValueDisplay from "./KVValueDisplay";
import "./../KVManage.css";

const { Text } = Typography;

interface NamespaceCardProps {
	namespace: NamespaceGroup;
	onEdit: (item: KVItem) => void;
	onDelete: (key: string) => void;
	onSave?: (key: string, value: string) => Promise<void>;
}

export default function NamespaceCard({ namespace, onEdit, onDelete, onSave }: NamespaceCardProps) {
	// 编辑状态
	const [editingKey, setEditingKey] = useState<string | null>(null);
	const [savingKey, setSavingKey] = useState<string | null>(null);

	// 开始编辑
	const handleStartEdit = (item: KVItem, e: React.MouseEvent) => {
		e.stopPropagation();
		setEditingKey(item.name);
	};

	// 取消编辑
	const handleCancelEdit = (e: React.MouseEvent) => {
		e.stopPropagation();
		setEditingKey(null);
	};

	// 保存编辑
	const handleSaveEdit = async (key: string, newValue: string) => {
		if (onSave) {
			setSavingKey(key);
			try {
				await onSave(key, newValue);
				message.success("保存成功");
				setEditingKey(null);
			} catch (e) {
				message.error("保存失败");
				throw e;
			} finally {
				setSavingKey(null);
			}
		}
	};

	// 构建 Collapse items
	const collapseItems = namespace.items.map((item) => {
		const isEditing = editingKey === item.name;
		const isSaving = savingKey === item.name;

		return {
			key: item.name,
			label: (
				<div className="kv-item-header">
					<Space style={{ flex: 1, minWidth: 0 }}>
						<KeyOutlined style={{ color: "#1890ff", flexShrink: 0 }} />
						<Text code ellipsis style={{ marginBottom: 0 }}>
							{item.key}
						</Text>
						<Tag color={getValueTypeColor(item.valueType)} style={{ flexShrink: 0 }}>
							{item.valueType.toUpperCase()}
						</Tag>
					</Space>
					<Space style={{ flexShrink: 0, marginLeft: "auto" }}>
						{isEditing ? (
							<>
								<Tooltip title="保存 (Ctrl+Enter)">
									<Button
										type="primary"
										size="small"
										icon={<CheckOutlined />}
										onClick={(e) => {
											e.stopPropagation();
											// 保存由 KVValueDisplay 处理
										}}
										loading={isSaving}
										style={{ marginRight: 4 }}
									>
										保存
									</Button>
								</Tooltip>
								<Tooltip title="取消 (Esc)">
									<Button
										size="small"
										icon={<CloseOutlined />}
										onClick={handleCancelEdit}
										disabled={isSaving}
									>
										取消
									</Button>
								</Tooltip>
							</>
						) : (
							<>
								<Tooltip title="编辑">
									<Button
										type="text"
										size="small"
										icon={<EditOutlined />}
										onClick={(e) => handleStartEdit(item, e)}
									/>
								</Tooltip>
								<Tooltip title="删除">
									<Button
										type="text"
										size="small"
										danger
										icon={<DeleteOutlined />}
										onClick={(e) => {
											e.stopPropagation();
											onDelete(item.name);
										}}
									/>
								</Tooltip>
							</>
						)}
					</Space>
				</div>
			),
			children: (
				<KVValueDisplay
					item={item}
					editing={isEditing}
					onEditChange={(editing) => {
						if (!editing) setEditingKey(null);
					}}
					onSave={(newValue) => handleSaveEdit(item.name, newValue)}
				/>
			),
		};
	});

	return (
		<Card
			className="namespace-card"
			title={
				<Space>
					<span style={{ fontWeight: 500 }}>{namespace.namespace}</span>
					<Tag color="blue">{namespace.count}</Tag>
				</Space>
			}
			size="small"
		>
			<Collapse
				className="kv-namespace-collapse"
				defaultActiveKey={[]}
				expandIconPosition="end"
				expandIcon={({ isActive }) => <CaretRightOutlined rotate={isActive ? 90 : 0} />}
				items={collapseItems}
			/>
		</Card>
	);
}
