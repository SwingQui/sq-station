import { useState, useEffect, useMemo } from "react";
import {
	getKVList,
	getKVValue,
	setKVValue,
	deleteKVKey,
	type KVKey,
} from "../../../api/kv";
import {
	Card,
	Button,
	Input,
	message,
	Modal,
	Space,
	Row,
	Col,
	Empty,
	Spin,
	Typography,
} from "antd";
import {
	PlusOutlined,
	ReloadOutlined,
	KeyOutlined,
	DeleteOutlined,
} from "@ant-design/icons";
import type { NamespaceGroup } from "./utils/parser";
import { groupAndSortKVs } from "./utils/parser";
import NamespaceCard from "./components/NamespaceCard";
import "./KVManage.css";

const { TextArea } = Input;
const { Title, Text } = Typography;

export default function KVManage() {
	const [namespaces, setNamespaces] = useState<NamespaceGroup[]>([]);
	const [loading, setLoading] = useState(false);
	const [saveLoading, setSaveLoading] = useState(false);

	// 新增 Modal
	const [createModalVisible, setCreateModalVisible] = useState(false);
	const [newKey, setNewKey] = useState("");
	const [newValue, setNewValue] = useState("");

	// 删除确认 Modal
	const [deleteModalVisible, setDeleteModalVisible] = useState(false);
	const [keyToDelete, setKeyToDelete] = useState<string | null>(null);

	// 搜索
	const [searchKeyword, setSearchKeyword] = useState("");

	// 加载所有数据（包括值）
	const loadAllData = async () => {
		setLoading(true);
		try {
			const keysList = await getKVList();
			const valuesMap = new Map<string, string>();

			// 并行加载所有值
			await Promise.all(
				keysList.map(async (kv) => {
					try {
						const data = await getKVValue(kv.name);
						valuesMap.set(kv.name, data.value);
					} catch {
						valuesMap.set(kv.name, "");
					}
				})
			);

			const grouped = groupAndSortKVs(keysList, valuesMap);
			setNamespaces(grouped);
		} catch (e) {
			message.error("加载失败");
		}
		setLoading(false);
	};

	// 打开新增 Modal
	const openCreateModal = () => {
		setNewKey("");
		setNewValue("");
		setCreateModalVisible(true);
	};

	// 创建新 KV
	const handleCreate = async () => {
		if (!newKey.trim()) {
			message.warning("请输入 Key");
			return;
		}
		setSaveLoading(true);
		try {
			await setKVValue(newKey, newValue);
			message.success("创建成功");
			setCreateModalVisible(false);
			loadAllData();
		} catch (e) {
			message.error("创建失败");
		}
		setSaveLoading(false);
	};

	// 手风琴内保存编辑
	const handleSaveEdit = async (key: string, value: string) => {
		await setKVValue(key, value);
		// 重新加载数据以更新显示
		const valuesMap = new Map<string, string>();
		namespaces.forEach(ns => {
			ns.items.forEach(item => {
				if (item.name === key) {
					valuesMap.set(key, value);
				} else {
					valuesMap.set(item.name, item.value);
				}
			});
		});

		// 重新构建命名空间
		const allKeys: KVKey[] = [];
		namespaces.forEach(ns => {
			ns.items.forEach(item => {
				allKeys.push({ name: item.name, metadata: item.metadata });
			});
		});

		const grouped = groupAndSortKVs(allKeys, valuesMap);
		setNamespaces(grouped);
	};

	// 打开删除确认 Modal
	const openDeleteModal = (key: string) => {
		setKeyToDelete(key);
		setDeleteModalVisible(true);
	};

	// 确认删除
	const handleDelete = async () => {
		if (!keyToDelete) return;
		try {
			await deleteKVKey(keyToDelete);
			message.success("删除成功");
			setDeleteModalVisible(false);
			loadAllData();
		} catch (e) {
			message.error("删除失败");
		}
	};

	// 组件挂载时加载数据
	useEffect(() => {
		loadAllData();
	}, []);

	// 过滤后的 namespaces
	const filteredNamespaces = useMemo(() => {
		if (!searchKeyword) return namespaces;

		return namespaces
			.map((ns) => ({
				...ns,
				items: ns.items.filter(
					(item) =>
						item.name.toLowerCase().includes(searchKeyword.toLowerCase()) ||
						item.key.toLowerCase().includes(searchKeyword.toLowerCase())
				),
			}))
			.filter((ns) => ns.items.length > 0);
	}, [namespaces, searchKeyword]);

	// 统计数据
	const totalCount = useMemo(() => namespaces.reduce((sum, ns) => sum + ns.count, 0), [namespaces]);
	const namespaceCount = namespaces.length;

	return (
		<div>
			{/* 顶部操作栏 */}
			<Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
				<Col flex="auto">
					<Input
						placeholder="搜索 Key..."
						allowClear
						prefix={<KeyOutlined />}
						value={searchKeyword}
						onChange={(e) => setSearchKeyword(e.target.value)}
						style={{ maxWidth: 400 }}
					/>
				</Col>
				<Col>
					<Space>
						<Button icon={<ReloadOutlined />} onClick={loadAllData} loading={loading}>
							刷新
						</Button>
						<Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
							新增 KV
						</Button>
					</Space>
				</Col>
			</Row>

			{/* 统计卡片 */}
			<Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
				<Col xs={24} sm={12} md={6}>
					<Card>
						<Space orientation="vertical" size={0}>
							<Text type="secondary">总数量</Text>
							<Title level={3} style={{ margin: 0 }}>
								{totalCount}
							</Title>
						</Space>
					</Card>
				</Col>
				<Col xs={24} sm={12} md={6}>
					<Card>
						<Space orientation="vertical" size={0}>
							<Text type="secondary">命名空间</Text>
							<Title level={3} style={{ margin: 0 }}>
								{namespaceCount}
							</Title>
						</Space>
					</Card>
				</Col>
			</Row>

			{/* KV 命名空间列表 */}
			{loading ? (
				<div style={{ textAlign: "center", padding: "40px" }}>
					<Spin />
				</div>
			) : filteredNamespaces.length === 0 ? (
				<Card>
					<Empty description={searchKeyword ? "未找到匹配的 KV" : "暂无数据"} />
				</Card>
			) : (
				<Space orientation="vertical" style={{ width: "100%" }} size="middle">
					{filteredNamespaces.map((ns) => (
						<NamespaceCard
							key={ns.namespace}
							namespace={ns}
							onDelete={openDeleteModal}
							onSave={handleSaveEdit}
						/>
					))}
				</Space>
			)}

			{/* 新增 KV Modal */}
			<Modal
				title={
					<Space>
						<PlusOutlined />
						<span>新增 KV</span>
					</Space>
				}
				open={createModalVisible}
				onOk={handleCreate}
				onCancel={() => setCreateModalVisible(false)}
				confirmLoading={saveLoading}
				width={600}
				okText="创建"
				cancelText="取消"
			>
				<Space orientation="vertical" style={{ width: "100%" }} size="large">
					<div>
						<Text strong style={{ marginBottom: 8, display: "block" }}>
							Key <span style={{ color: "#ff4d4f" }}>*</span>
						</Text>
						<Input
							placeholder="请输入 Key (如: bookmarks:config)"
							value={newKey}
							onChange={(e) => setNewKey(e.target.value)}
							prefix={<KeyOutlined />}
						/>
					</div>

					<div>
						<Text strong style={{ marginBottom: 8, display: "block" }}>
							Value
						</Text>
						<TextArea
							placeholder="请输入 Value (支持 JSON 格式)"
							value={newValue}
							onChange={(e) => setNewValue(e.target.value)}
							rows={8}
							showCount
							maxLength={100000}
						/>
					</div>
				</Space>
			</Modal>

			{/* 删除确认 Modal */}
			<Modal
				title={
					<Space>
						<DeleteOutlined style={{ color: "#ff4d4f" }} />
						<span>确认删除</span>
					</Space>
				}
				open={deleteModalVisible}
				onOk={handleDelete}
				onCancel={() => setDeleteModalVisible(false)}
				okText="删除"
				cancelText="取消"
				okButtonProps={{ danger: true }}
			>
				<p>
					确定要删除 KV <Text code>{keyToDelete}</Text> 吗？此操作不可撤销。
				</p>
			</Modal>
		</div>
	);
}
