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
	InputNumber,
	Tag,
	Popconfirm,
	Upload,
	Select,
	message,
	Progress,
	Tooltip,
} from "antd";
import {
	PlusOutlined,
	EditOutlined,
	DeleteOutlined,
	UploadOutlined,
	WindowsOutlined,
	AndroidOutlined,
	ReloadOutlined,
	ClearOutlined,
} from "@ant-design/icons";
import {
	getToolsManageList,
	createTool,
	updateTool,
	deleteTool,
	uploadToolFile,
	deleteToolFile,
	formatFileSize,
	getOrphanFiles,
	cleanOrphanFiles,
	type Tool,
	type OrphanFile,
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
	const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
	// 孤儿文件相关状态
	const [orphansModalVisible, setOrphansModalVisible] = useState(false);
	const [orphansLoading, setOrphansLoading] = useState(false);
	const [orphans, setOrphans] = useState<OrphanFile[]>([]);
	const [orphansTotalSize, setOrphansTotalSize] = useState(0);
	const [cleaning, setCleaning] = useState(false);

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
		const uploadKey = `${toolId}-${platform}`;
		try {
			setUploadProgress(prev => ({ ...prev, [uploadKey]: 0 }));
			await uploadToolFile(toolId, file, platform, (percent) => {
				setUploadProgress(prev => ({ ...prev, [uploadKey]: percent }));
			});
			message.success("上传成功");
			fetchTools();
		} catch (e) {
			handleError(e, "上传失败");
		} finally {
			setUploadProgress(prev => {
				const newProgress = { ...prev };
				delete newProgress[uploadKey];
				return newProgress;
			});
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

	// 孤儿文件处理
	const handleCheckOrphans = async () => {
		try {
			setOrphansLoading(true);
			setOrphansModalVisible(true);
			const result = await getOrphanFiles();
			setOrphans(result.orphans);
			setOrphansTotalSize(result.totalSize);
		} catch (e) {
			handleError(e, "检查孤儿文件失败");
			setOrphansModalVisible(false);
		} finally {
			setOrphansLoading(false);
		}
	};

	const handleCleanOrphans = async () => {
		try {
			setCleaning(true);
			const result = await cleanOrphanFiles();
			message.success(`已清理 ${result.deletedCount} 个孤儿文件`);
			setOrphansModalVisible(false);
			setOrphans([]);
			setOrphansTotalSize(0);
		} catch (e) {
			handleError(e, "清理孤儿文件失败");
		} finally {
			setCleaning(false);
		}
	};

	const columns: ColumnsType<Tool> = [
		{
			title: "ID",
			dataIndex: "id",
			width: 60,
			align: "center" as const,
		},
		{
			title: "工具名称",
			dataIndex: "tool_name",
			width: 150,
			align: "center" as const,
		},
		{
			title: "描述",
			dataIndex: "description",
			ellipsis: true,
			width: 200,
			align: "center" as const,
			render: (text: string) => text || "-",
		},
		{
			title: "排序",
			dataIndex: "sort_order",
			width: 80,
			align: "center" as const,
		},
		{
			title: "状态",
			dataIndex: "status",
			width: 80,
			align: "center" as const,
			render: (status: number) => (
				<Tag color={status === 1 ? "success" : "error"} style={{ display: "inline-flex", alignItems: "center" }}>
					{status === 1 ? "上架" : "下架"}
				</Tag>
			),
		},
		{
			title: "Windows 版",
			key: "windows",
			width: 200,
			align: "center" as const,
			render: (_: any, record: Tool) => {
				const uploadKey = `${record.id}-windows`;
				const progress = uploadProgress[uploadKey];
				const isUploading = progress !== undefined;

				return (
					<Space direction="vertical" size="small" style={{ width: "100%" }}>
						{isUploading ? (
							<>
								<div style={{ fontSize: 12, color: "#1890ff" }}>上传中...</div>
								<Progress percent={progress} size="small" status="active" />
							</>
						) : record.windows_file_name ? (
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
				);
			},
		},
		{
			title: "Android 版",
			key: "android",
			width: 200,
			align: "center" as const,
			render: (_: any, record: Tool) => {
				const uploadKey = `${record.id}-android`;
				const progress = uploadProgress[uploadKey];
				const isUploading = progress !== undefined;

				return (
					<Space direction="vertical" size="small" style={{ width: "100%" }}>
						{isUploading ? (
							<>
								<div style={{ fontSize: 12, color: "#1890ff" }}>上传中...</div>
								<Progress percent={progress} size="small" status="active" />
							</>
						) : record.android_file_name ? (
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
				);
			},
		},
		{
			title: "操作",
			key: "action",
			width: 100,
			align: "center" as const,
			render: (_: any, record: Tool) => {
				// 操作按钮统一样式：圆角正方形
				const actionButtonStyle: React.CSSProperties = {
					padding: "8px",
					minWidth: "36px",
					height: "36px",
					borderRadius: "8px",
					justifyContent: "center",
				};

				return (
					<Space size="small">
						<PermissionButton
							permission="frontend:tools:update"
							icon={<EditOutlined />}
							style={actionButtonStyle}
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
								style={actionButtonStyle}
							/>
						</Popconfirm>
					</Space>
				);
			},
		},
	];

	return (
		<>
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
				<Tooltip title="清理 R2 中无主文件（SQTools/windows 和 SQTools/android 目录下）">
					<PermissionButton
						permission="frontend:tools:delete"
						icon={<ClearOutlined />}
						onClick={handleCheckOrphans}
					>
						清理孤儿文件
					</PermissionButton>
				</Tooltip>
			</Space>

			<Table
				columns={columns}
				dataSource={tools}
				rowKey="id"
				loading={loading}
				bordered
				pagination={{ pageSize: 10 }}
				size="small"
			/>

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

			{/* 孤儿文件清理弹窗 */}
			<Modal
				title="孤儿文件清理"
				open={orphansModalVisible}
				onCancel={() => {
					setOrphansModalVisible(false);
					setOrphans([]);
					setOrphansTotalSize(0);
				}}
				footer={
					orphans.length > 0 ? [
						<Button key="cancel" onClick={() => setOrphansModalVisible(false)}>
							取消
						</Button>,
						<Popconfirm
							key="clean"
							title={`确定清理 ${orphans.length} 个孤儿文件？`}
							onConfirm={handleCleanOrphans}
						>
							<Button type="primary" danger loading={cleaning}>
								一键清理
							</Button>
						</Popconfirm>,
					] : [
						<Button key="close" onClick={() => setOrphansModalVisible(false)}>
							关闭
						</Button>,
					]
				}
				width={700}
			>
				{orphansLoading ? (
					<div style={{ textAlign: "center", padding: "40px 0" }}>
						<Tag>正在扫描...</Tag>
					</div>
				) : orphans.length === 0 ? (
					<div style={{ textAlign: "center", padding: "40px 0", color: "#52c41a" }}>
						<ClearOutlined style={{ fontSize: 48, marginBottom: 16 }} />
						<div style={{ fontSize: 16 }}>没有发现孤儿文件</div>
					</div>
				) : (
					<>
						<div style={{ marginBottom: 16 }}>
							<Tag color="orange">
								共 {orphans.length} 个孤儿文件，总大小 {formatFileSize(orphansTotalSize)}
							</Tag>
						</div>
						<Table
							dataSource={orphans}
							rowKey="key"
							size="small"
							pagination={{ pageSize: 5 }}
							columns={[
								{
									title: "平台",
									dataIndex: "platform",
									width: 80,
									render: (platform: string) => (
										<Tag color={platform === "windows" ? "blue" : "green"}>
											{platform === "windows" ? <WindowsOutlined /> : <AndroidOutlined />} {platform}
										</Tag>
									),
								},
								{
									title: "文件路径",
									dataIndex: "key",
									ellipsis: true,
									render: (key: string) => (
										<Tooltip title={key}>
											<span style={{ fontSize: 12 }}>{key}</span>
										</Tooltip>
									),
								},
								{
									title: "大小",
									dataIndex: "size",
									width: 100,
									render: (size: number) => formatFileSize(size),
								},
							]}
						/>
					</>
				)}
			</Modal>
		</>
	);
}
