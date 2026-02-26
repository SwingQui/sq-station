/**
 * 站点工具管理页面
 */

import { useEffect, useState } from "react";
import type { ColumnsType } from "antd/es/table";
import {
	Table,
	Modal,
	Form,
	Input,
	Button,
	Space,
	Card,
	InputNumber,
	Tag,
	Popconfirm,
	Upload,
	Select,
	message,
} from "antd";
import {
	PlusOutlined,
	EditOutlined,
	DeleteOutlined,
	UploadOutlined,
	WindowsOutlined,
	AndroidOutlined,
	ReloadOutlined,
} from "@ant-design/icons";
import {
	getToolsManageList,
	createTool,
	updateTool,
	deleteTool,
	uploadToolFile,
	deleteToolFile,
	formatFileSize,
	type Tool,
} from "@api/tools";
import PermissionButton from "@components/PermissionButton";
import { handleError, handleSuccess } from "@utils/error-handler";

const { TextArea } = Input;

export default function ToolsManage() {
	const [form] = Form.useForm();
	const [tools, setTools] = useState<Tool[]>([]);
	const [loading, setLoading] = useState(true);
	const [modalVisible, setModalVisible] = useState(false);
	const [editingTool, setEditingTool] = useState<Tool | null>(null);

	useEffect(() => {
		fetchTools();
	}, []);

	const fetchTools = async () => {
		try {
			setLoading(true);
			const data = await getToolsManageList();
			setTools(data);
		} catch (e) {
			handleError(e, "加载失败");
		} finally {
			setLoading(false);
		}
	};

	const handleSaveTool = async () => {
		try {
			const values = await form.validateFields();

			if (editingTool) {
				await updateTool(editingTool.id, values);
				handleSuccess("更新成功");
			} else {
				await createTool(values);
				handleSuccess("创建成功");
			}

			setModalVisible(false);
			setEditingTool(null);
			form.resetFields();
			fetchTools();
		} catch (e: any) {
			if (!e?.errorFields) {
				handleError(e, "保存失败");
			}
		}
	};

	const handleDeleteTool = async (id: number) => {
		try {
			await deleteTool(id);
			handleSuccess("删除成功");
			fetchTools();
		} catch (e) {
			handleError(e, "删除失败");
		}
	};

	const handleUpload = async (toolId: number, file: File, platform: "windows" | "android") => {
		try {
			message.loading({ content: "上传中...", key: "upload" });
			await uploadToolFile(toolId, file, platform);
			message.success({ content: "上传成功", key: "upload" });
			fetchTools();
		} catch (e) {
			handleError(e, "上传失败");
		}
	};

	const handleDeleteFile = async (toolId: number, platform: "windows" | "android") => {
		try {
			await deleteToolFile(toolId, platform);
			handleSuccess("删除成功");
			fetchTools();
		} catch (e) {
			handleError(e, "删除失败");
		}
	};

	const columns: ColumnsType<Tool> = [
		{
			title: "ID",
			dataIndex: "id",
			width: 60,
			align: "center",
		},
		{
			title: "工具名称",
			dataIndex: "tool_name",
			width: 150,
		},
		{
			title: "描述",
			dataIndex: "description",
			ellipsis: true,
			width: 200,
			render: (text) => text || "-",
		},
		{
			title: "排序",
			dataIndex: "sort_order",
			width: 80,
			align: "center",
		},
		{
			title: "状态",
			dataIndex: "status",
			width: 80,
			align: "center",
			render: (status: number) => (
				<Tag color={status === 1 ? "green" : "red"}>
					{status === 1 ? "上架" : "下架"}
				</Tag>
			),
		},
		{
			title: "Windows 版",
			key: "windows",
			width: 200,
			render: (_: any, record: Tool) => (
				<Space direction="vertical" size="small">
					{record.windows_file_name ? (
						<>
							<Tag icon={<WindowsOutlined />} color="blue">
								{record.windows_file_name}
							</Tag>
							<div style={{ fontSize: 12, color: "#888" }}>
								{formatFileSize(record.windows_file_size)}
							</div>
							<Space size="small">
								<Upload
									beforeUpload={(file) => {
										handleUpload(record.id, file, "windows");
										return false;
									}}
									showUploadList={false}
									accept=".exe,.msi,.zip"
								>
									<Button size="small" icon={<UploadOutlined />}>
										更新
									</Button>
								</Upload>
								<Popconfirm
									title="确定删除 Windows 版本？"
									onConfirm={() => handleDeleteFile(record.id, "windows")}
								>
									<Button size="small" danger icon={<DeleteOutlined />} />
								</Popconfirm>
							</Space>
						</>
					) : (
						<Upload
							beforeUpload={(file) => {
								handleUpload(record.id, file, "windows");
								return false;
							}}
							showUploadList={false}
							accept=".exe,.msi,.zip"
						>
							<Button size="small" icon={<UploadOutlined />}>
								上传
							</Button>
						</Upload>
					)}
				</Space>
			),
		},
		{
			title: "Android 版",
			key: "android",
			width: 200,
			render: (_: any, record: Tool) => (
				<Space direction="vertical" size="small">
					{record.android_file_name ? (
						<>
							<Tag icon={<AndroidOutlined />} color="green">
								{record.android_file_name}
							</Tag>
							<div style={{ fontSize: 12, color: "#888" }}>
								{formatFileSize(record.android_file_size)}
							</div>
							<Space size="small">
								<Upload
									beforeUpload={(file) => {
										handleUpload(record.id, file, "android");
										return false;
									}}
									showUploadList={false}
									accept=".apk"
								>
									<Button size="small" icon={<UploadOutlined />}>
										更新
									</Button>
								</Upload>
								<Popconfirm
									title="确定删除 Android 版本？"
									onConfirm={() => handleDeleteFile(record.id, "android")}
								>
									<Button size="small" danger icon={<DeleteOutlined />} />
								</Popconfirm>
							</Space>
						</>
					) : (
						<Upload
							beforeUpload={(file) => {
								handleUpload(record.id, file, "android");
								return false;
							}}
							showUploadList={false}
							accept=".apk"
						>
							<Button size="small" icon={<UploadOutlined />}>
								上传
							</Button>
						</Upload>
					)}
				</Space>
			),
		},
		{
			title: "操作",
			key: "action",
			width: 120,
			align: "center",
			render: (_: any, record: Tool) => (
				<Space>
					<PermissionButton
						permission="frontend:tools:update"
						icon={<EditOutlined />}
						onClick={() => {
							setEditingTool(record);
							form.setFieldsValue(record);
							setModalVisible(true);
						}}
					/>
					<Popconfirm
						title="确定删除此工具？相关文件也将被删除"
						onConfirm={() => handleDeleteTool(record.id)}
					>
						<PermissionButton
							permission="frontend:tools:delete"
							icon={<DeleteOutlined />}
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
					permission="frontend:tools:create"
					icon={<PlusOutlined />}
					onClick={() => {
						setEditingTool(null);
						form.resetFields();
						setModalVisible(true);
					}}
				>
					新增工具
				</PermissionButton>
				<Button icon={<ReloadOutlined />} onClick={fetchTools}>
					刷新
				</Button>
			</Space>

			<Card>
				<Table
					columns={columns}
					dataSource={tools}
					rowKey="id"
					loading={loading}
					pagination={{ pageSize: 10 }}
					scroll={{ x: 1100 }}
				/>
			</Card>

			{/* 工具编辑弹窗 */}
			<Modal
				title={editingTool ? "编辑工具" : "新增工具"}
				open={modalVisible}
				onOk={handleSaveTool}
				onCancel={() => {
					setModalVisible(false);
					setEditingTool(null);
					form.resetFields();
				}}
				width={600}
			>
				<Form form={form} layout="vertical">
					<Form.Item
						label="工具名称"
						name="tool_name"
						rules={[{ required: true, message: "请输入工具名称" }]}
					>
						<Input placeholder="请输入工具名称" />
					</Form.Item>
					<Form.Item label="描述" name="description">
						<TextArea rows={3} placeholder="请输入工具描述" />
					</Form.Item>
					<Form.Item label="图标URL" name="icon">
						<Input placeholder="图标图片URL（可选）" />
					</Form.Item>
					<Form.Item label="排序" name="sort_order" initialValue={0}>
						<InputNumber min={0} max={999} style={{ width: "100%" }} />
					</Form.Item>
					<Form.Item
						label="状态"
						name="status"
						initialValue={1}
						extra="下架后前台将不显示"
					>
						<Select>
							<Select.Option value={1}>上架</Select.Option>
							<Select.Option value={0}>下架</Select.Option>
						</Select>
					</Form.Item>
				</Form>
			</Modal>
		</div>
	);
}
