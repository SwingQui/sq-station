import { useEffect, useState } from "react";
import type { ColumnsType } from "antd/es/table";
import {
	Table,
	Modal,
	Form,
	Input,
	Space,
	Card,
	Row,
	Col,
	InputNumber,
	Switch,
	Typography,
	Popconfirm,
} from "antd";
import {
	PlusOutlined,
	EditOutlined,
	DeleteOutlined,
	SaveOutlined,
	AppstoreAddOutlined,
	LinkOutlined,
} from "@ant-design/icons";
import { getBookmarksConfig, saveBookmarksConfig, type BookmarksConfig, type BookmarkItem } from "@api/bookmarks";
import PermissionButton from "@components/PermissionButton";
import { handleError, handleSuccess } from "@utils/error-handler";

const { TextArea } = Input;
const { Text } = Typography;

// 模块表单验证规则
const moduleFormRules = {
	moduleName: [
		{ required: true, message: "请输入模块名称" },
		{ min: 2, max: 20, message: "模块名称长度为2-20个字符" },
	],
	desc: [{ max: 100, message: "描述最多100个字符" }],
};

// 内容项表单验证规则
const itemFormRules = {
	content: [
		{ required: true, message: "请输入内容标题" },
		{ min: 1, max: 50, message: "内容标题长度为1-50个字符" },
	],
	summary: [{ max: 11, message: "简要描述最多11个字符" }],
	desc: [{ max: 200, message: "详细描述最多200个字符" }],
	url: [{ type: "url" as const, message: "请输入正确的URL格式" }],
};

export default function BookmarksManage() {
	const [form] = Form.useForm();
	const [itemForm] = Form.useForm();
	const [bookmarks, setBookmarks] = useState<BookmarksConfig>({});
	const [loading, setLoading] = useState(true);
	const [showModuleModal, setShowModuleModal] = useState(false);
	const [showItemModal, setShowItemModal] = useState(false);
	const [editingModule, setEditingModule] = useState<string | null>(null);
	const [editingItemModule, setEditingItemModule] = useState<string | null>(null);
	const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);

	useEffect(() => {
		fetchBookmarks();
	}, []);

	const fetchBookmarks = async () => {
		try {
			const data = await getBookmarksConfig();
			setBookmarks(data);
		} catch (e) {
			handleError(e, "加载失败");
		} finally {
			setLoading(false);
		}
	};

	const handleSaveModule = async () => {
		try {
			const values = await form.validateFields();
			const { moduleName, desc, order } = values;

			const newBookmarks = { ...bookmarks };
			if (editingModule) {
				// 更新模块（保留原有 items）
				newBookmarks[moduleName] = {
					...newBookmarks[editingModule],
					desc,
					order: order ?? 0,
				};
				if (moduleName !== editingModule) {
					delete newBookmarks[editingModule];
				}
			} else {
				// 新增模块
				newBookmarks[moduleName] = {
					desc,
					order: order ?? 0,
					items: [],
				};
			}

			await saveBookmarksConfig(newBookmarks);
			handleSuccess(editingModule ? "更新成功" : "创建成功");
			setShowModuleModal(false);
			setEditingModule(null);
			form.resetFields();
			fetchBookmarks();
		} catch (e: any) {
			if (e?.errorFields) {
				return;
			}
			handleError(e, "保存失败");
		}
	};

	const handleDeleteModule = async (moduleName: string) => {
		try {
			const newBookmarks = { ...bookmarks };
			delete newBookmarks[moduleName];
			await saveBookmarksConfig(newBookmarks);
			handleSuccess("删除成功");
			fetchBookmarks();
		} catch (e) {
			handleError(e, "删除失败");
		}
	};

	const handleEditModule = (moduleName: string) => {
		const module = bookmarks[moduleName];
		setEditingModule(moduleName);
		form.setFieldsValue({
			moduleName,
			desc: module.desc,
			order: module.order,
		});
		setShowModuleModal(true);
	};

	const handleAddModule = () => {
		setEditingModule(null);
		form.resetFields();
		form.setFieldsValue({ order: Object.keys(bookmarks).length + 1 });
		setShowModuleModal(true);
	};

	const handleSaveItem = async () => {
		try {
			const values = await itemForm.validateFields();
			if (!editingItemModule) return;

			const newBookmarks = { ...bookmarks };
			const module = { ...newBookmarks[editingItemModule] };
			const items = [...module.items];

			if (editingItemIndex !== null) {
				// 更新内容项
				items[editingItemIndex] = values;
			} else {
				// 新增内容项
				items.push(values);
			}

			module.items = items;
			newBookmarks[editingItemModule] = module;

			await saveBookmarksConfig(newBookmarks);
			handleSuccess(editingItemIndex !== null ? "更新成功" : "创建成功");
			setShowItemModal(false);
			setEditingItemModule(null);
			setEditingItemIndex(null);
			itemForm.resetFields();
			fetchBookmarks();
		} catch (e: any) {
			if (e?.errorFields) {
				return;
			}
			handleError(e, "保存失败");
		}
	};

	const handleDeleteItem = async (moduleName: string, itemIndex: number) => {
		try {
			const newBookmarks = { ...bookmarks };
			const module = { ...newBookmarks[moduleName] };
			module.items = module.items.filter((_, i) => i !== itemIndex);
			newBookmarks[moduleName] = module;

			await saveBookmarksConfig(newBookmarks);
			handleSuccess("删除成功");
			fetchBookmarks();
		} catch (e) {
			handleError(e, "删除失败");
		}
	};

	const handleEditItem = (moduleName: string, itemIndex: number) => {
		const item = bookmarks[moduleName].items[itemIndex];
		setEditingItemModule(moduleName);
		setEditingItemIndex(itemIndex);
		itemForm.setFieldsValue(item);
		setShowItemModal(true);
	};

	const handleAddItem = (moduleName: string) => {
		setEditingItemModule(moduleName);
		setEditingItemIndex(null);
		itemForm.resetFields();
		itemForm.setFieldsValue({
			newWindow: true,
			orderM: bookmarks[moduleName].items.length + 1,
		});
		setShowItemModal(true);
	};

	// 内容项表格列定义
	const itemColumns = (moduleName: string): ColumnsType<BookmarkItem> => [
		{
			title: "排序",
			dataIndex: "orderM",
			width: 60,
			align: "center" as const,
		},
		{
			title: "内容标题",
			dataIndex: "content",
			width: 150,
			align: "center" as const,
		},
		{
			title: "简要描述",
			dataIndex: "summary",
			width: 100,
			align: "center" as const,
			render: (text: string) => text || "-",
		},
		{
			title: "URL",
			dataIndex: "url",
			width: 200,
			align: "center" as const,
			ellipsis: true,
			render: (text: string) => (
				<a href={text} target="_blank" rel="noopener noreferrer" style={{ fontSize: "12px" }}>
					{text || "-"}
				</a>
			),
		},
		{
			title: "新窗口",
			dataIndex: "newWindow",
			width: 80,
			align: "center" as const,
			render: (val: boolean) => (val ? "是" : "否"),
		},
		{
			title: "操作",
			key: "action",
			width: 120,
			align: "center" as const,
			render: (_: any, _record: BookmarkItem, index: number) => (
				<Space size="small">
					<PermissionButton
						permission="frontend:bookmarks:update"
						onClick={() => handleEditItem(moduleName, index)}
						icon={<EditOutlined />}
						style={{ padding: "8px", minWidth: "36px", height: "36px" }}
					/>
					<Popconfirm
						title="确定删除此内容吗？"
						onConfirm={() => handleDeleteItem(moduleName, index)}
						okText="确定"
						cancelText="取消"
					>
						<PermissionButton
							permission="frontend:bookmarks:delete"
							icon={<DeleteOutlined />}
							style={{ padding: "8px", minWidth: "36px", height: "36px" }}
						/>
					</Popconfirm>
				</Space>
			),
		},
	];

	return (
		<div style={{ padding: "20px" }}>
			<Space style={{ marginBottom: 16 }}>
				<PermissionButton
					permission="frontend:bookmarks:create"
					onClick={handleAddModule}
					icon={<AppstoreAddOutlined />}
				>
					新增模块
				</PermissionButton>
				<PermissionButton
					permission="frontend:bookmarks:read"
					onClick={fetchBookmarks}
					icon={<SaveOutlined />}
				>
					刷新
				</PermissionButton>
			</Space>

			{/* 模块列表 */}
			{Object.entries(bookmarks).map(([moduleName, module]) => (
				<Card
					key={moduleName}
					style={{ marginBottom: 16 }}
					title={
						<Space>
							<Text strong>{moduleName}</Text>
							<Text type="secondary">{module.desc}</Text>
							<Text type="secondary" style={{ fontSize: "12px" }}>
								(排序: {module.order})
							</Text>
						</Space>
					}
					extra={
						<Space size="small">
							<PermissionButton
								permission="frontend:bookmarks:create"
								onClick={() => handleAddItem(moduleName)}
								icon={<PlusOutlined />}
								style={{ padding: "8px", minWidth: "36px", height: "36px" }}
							>
								添加内容
							</PermissionButton>
							<PermissionButton
								permission="frontend:bookmarks:update"
								onClick={() => handleEditModule(moduleName)}
								icon={<EditOutlined />}
								style={{ padding: "8px", minWidth: "36px", height: "36px" }}
							/>
							<Popconfirm
								title="确定删除此模块吗？"
								onConfirm={() => handleDeleteModule(moduleName)}
								okText="确定"
								cancelText="取消"
							>
								<PermissionButton
									permission="frontend:bookmarks:delete"
									icon={<DeleteOutlined />}
									style={{ padding: "8px", minWidth: "36px", height: "36px" }}
								/>
							</Popconfirm>
						</Space>
					}
				>
					<Table
						columns={itemColumns(moduleName)}
						dataSource={module.items.map((item, index) => ({ ...item, key: index }))}
						rowKey="key"
						pagination={false}
						size="small"
						bordered
					/>
				</Card>
			))}

			{Object.keys(bookmarks).length === 0 && !loading && (
				<div style={{ textAlign: "center", padding: "40px", color: "#888" }}>
					暂无模块，请点击"新增模块"创建
				</div>
			)}

			{/* 新增/编辑模块弹窗 */}
			<Modal
				title={editingModule ? "编辑模块" : "新增模块"}
				open={showModuleModal}
				onOk={handleSaveModule}
				onCancel={() => {
					setShowModuleModal(false);
					setEditingModule(null);
					form.resetFields();
				}}
				width={600}
				okText="保存"
				cancelText="取消"
			>
				<Form form={form} layout="vertical">
					<Form.Item label="模块名称" name="moduleName" rules={moduleFormRules.moduleName}>
						<Input placeholder="请输入模块名称" disabled={!!editingModule} />
					</Form.Item>
					<Form.Item label="描述" name="desc" rules={moduleFormRules.desc}>
						<Input placeholder="请输入模块描述" />
					</Form.Item>
					<Form.Item label="排序" name="order" initialValue={1}>
						<InputNumber min={1} max={99} style={{ width: "100%" }} />
					</Form.Item>
				</Form>
			</Modal>

			{/* 新增/编辑内容项弹窗 */}
			<Modal
				title={editingItemIndex !== null ? "编辑内容" : "新增内容"}
				open={showItemModal}
				onOk={handleSaveItem}
				onCancel={() => {
					setShowItemModal(false);
					setEditingItemModule(null);
					setEditingItemIndex(null);
					itemForm.resetFields();
				}}
				width={700}
				okText="保存"
				cancelText="取消"
			>
				<Form form={itemForm} layout="vertical">
					<Row gutter={16}>
						<Col span={12}>
							<Form.Item label="内容标题" name="content" rules={itemFormRules.content}>
								<Input placeholder="请输入内容标题" />
							</Form.Item>
						</Col>
						<Col span={12}>
							<Form.Item label="简要描述 (≤11字符)" name="summary" rules={itemFormRules.summary}>
								<Input placeholder="卡片显示的简要描述" />
							</Form.Item>
						</Col>
					</Row>
					<Form.Item label="详细描述 (tooltip)" name="desc" rules={itemFormRules.desc}>
						<TextArea placeholder="鼠标悬停显示的详细描述" rows={2} />
					</Form.Item>
					<Form.Item label="URL" name="url" rules={itemFormRules.url}>
						<Input prefix={<LinkOutlined />} placeholder="https://example.com" />
					</Form.Item>
					<Row gutter={16}>
						<Col span={12}>
							<Form.Item label="排序" name="orderM" initialValue={1}>
								<InputNumber min={1} max={99} style={{ width: "100%" }} />
							</Form.Item>
						</Col>
						<Col span={12}>
							<Form.Item label="新窗口打开" name="newWindow" valuePropName="checked">
								<Switch />
							</Form.Item>
						</Col>
					</Row>
					<Form.Item label="图标 URL" name="icon">
						<Input placeholder="自定义图标URL（可选）" />
					</Form.Item>
				</Form>
			</Modal>
		</div>
	);
}
