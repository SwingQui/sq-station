import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import type { ColumnsType } from "antd/es/table";
import {
	Table,
	Modal,
	Form,
	Input,
	Space,
	Tag,
	Row,
	Col,
	InputNumber,
	Select,
} from "antd";
import {
	PlusOutlined,
	ExportOutlined,
	EditOutlined,
	DeleteOutlined,
} from "@ant-design/icons";
import {
	getOrganizationList,
	createOrganization,
	updateOrganization,
	deleteOrganization,
	getOrganizationPermissions,
	assignOrganizationPermissions,
} from "@api/organization";
import type { Organization } from "@types";
import PermissionButton from "@components/PermissionButton";
import PermissionTree from "@components/PermissionTree";
import { handleError, handleSuccess } from "@utils/error-handler";
import { exportToExcel, ExportEnumMaps } from "@utils/excel-export";

export default function OrganizationManage() {
	const [form] = Form.useForm();
	const [organizations, setOrganizations] = useState<Organization[]>([]);
	const [loading, setLoading] = useState(true);
	const [editingOrg, setEditingOrg] = useState<Organization | null>(null);
	const [showModal, setShowModal] = useState(false);
	const [showPermModal, setShowPermModal] = useState(false);
	const [showDeleteModal, setShowDeleteModal] = useState(false);
	const [deletingOrgId, setDeletingOrgId] = useState<number | null>(null);
	const [currentOrg, setCurrentOrg] = useState<Organization | null>(null);
	const [orgPerms, setOrgPerms] = useState<string[]>([]);
	const [cascadeEnabled, setCascadeEnabled] = useState(true);

	useEffect(() => {
		fetchOrganizations();
	}, []);

	const fetchOrganizations = async () => {
		try {
			const data = await getOrganizationList();
			setOrganizations(data);
		} catch (e) {
			handleError(e, "加载失败");
		} finally {
			setLoading(false);
		}
	};

	const handleSave = async () => {
		try {
			const values = await form.validateFields();
			const orgData = {
				...values,
				sort_order: values.sort_order ?? 0,
				status: values.status ?? 1,
			};

			if (editingOrg) {
				await updateOrganization(editingOrg.id, orgData);
			} else {
				await createOrganization(orgData);
			}
			handleSuccess(editingOrg ? "更新成功" : "创建成功");
			setShowModal(false);
			setEditingOrg(null);
			form.resetFields();
			fetchOrganizations();
		} catch (e: any) {
			// 表单验证失败时不处理，由 Ant Design 自动显示错误
			if (e?.errorFields) {
				return;
			}
			handleError(e, "保存失败");
		}
	};

	const handleCancel = () => {
		setShowModal(false);
		setEditingOrg(null);
		form.resetFields();
	};

	const handleEdit = (org: Organization) => {
		setEditingOrg(org);
		form.setFieldsValue({
			...org,
			sort_order: org.sort_order ?? 0,
			status: org.status ?? 1,
		});
		setShowModal(true);
	};

	const handleDeleteClick = (id: number) => {
		setDeletingOrgId(id);
		setShowDeleteModal(true);
	};

	const handleConfirmDelete = async () => {
		if (deletingOrgId === null) return;
		try {
			await deleteOrganization(deletingOrgId);
			handleSuccess("删除成功");
			setShowDeleteModal(false);
			setDeletingOrgId(null);
			fetchOrganizations();
		} catch (e) {
			handleError(e, "删除失败");
		}
	};

	const handleAdd = () => {
		setEditingOrg(null);
		form.resetFields();
		form.setFieldsValue({ sort_order: 0, status: 1 });
		setShowModal(true);
	};

	// 权限分配相关函数
	const handleAssignPermissions = async (org: Organization) => {
		setCurrentOrg(org);
		try {
			const permissions = await getOrganizationPermissions(org.id);
			setOrgPerms(permissions);
			setShowPermModal(true);
		} catch (e) {
			handleError(e, "加载权限失败");
		}
	};

	const handleSavePermissions = async () => {
		if (!currentOrg) return;
		try {
			await assignOrganizationPermissions(currentOrg.id, orgPerms);
			handleSuccess("分配权限成功");
			setShowPermModal(false);
			setCurrentOrg(null);
		} catch (e) {
			handleError(e, "分配失败");
		}
	};

	const handleExport = () => {
		exportToExcel({
			sheetName: "组织列表",
			filename: "organizations",
			columns: [
				{
					header: "ID",
					field: "id",
					width: 10,
				},
				{
					header: "组织名称",
					field: "org_name",
					width: 20,
				},
				{
					header: "组织编码",
					field: "org_code",
					width: 20,
				},
				{
					header: "排序",
					field: "sort_order",
					width: 10,
				},
				{
					header: "状态",
					field: "status",
					width: 10,
					formatter: (value) => (value !== undefined ? ExportEnumMaps.status[value as keyof typeof ExportEnumMaps.status] || value : ""),
				},
				{
					header: "备注",
					field: "remark",
					width: 30,
				},
				{
					header: "创建时间",
					field: "created_at",
					width: 20,
					formatter: (value) => (value ? new Date(value).toLocaleString("zh-CN") : ""),
				},
			],
			data: organizations,
		});

		handleSuccess("导出成功");
	};

	// 表格列定义
	const columns: ColumnsType<Organization> = [
		{ title: "排序", dataIndex: "sort_order", width: 60, align: "center" },
		{ title: "组织名称", dataIndex: "org_name", width: 200 },
		{
			title: "组织编码",
			dataIndex: "org_code",
			width: 150,
			align: "center" as const,
			render: (text: string) => (
				<Tag color="blue" style={{ display: "inline-flex", alignItems: "center" }}>{text}</Tag>
			),
		},
		{
			title: "状态",
			dataIndex: "status",
			width: 80,
			align: "center" as const,
			render: (status: number) => (
				<Tag color={status ? "success" : "error"} style={{ display: "inline-flex", alignItems: "center" }}>{status ? "正常" : "禁用"}</Tag>
			),
		},
		{
			title: "创建时间",
			dataIndex: "created_at",
			width: 180,
			align: "center" as const,
			render: (text: string) => (text ? new Date(text).toLocaleString("zh-CN") : "-"),
		},
		{
			title: "更新时间",
			dataIndex: "updated_at",
			width: 180,
			align: "center" as const,
			render: (text: string) => (text ? new Date(text).toLocaleString("zh-CN") : "-"),
		},
		{
			title: "备注",
			dataIndex: "remark",
			width: 120,
			ellipsis: true,
			align: "center" as const,
			render: (text: string) => text || "-",
		},
		{
			title: "操作",
			key: "action",
			width: 150,
			align: "center" as const,
			render: (_: any, record: Organization) => {
				// 操作按钮统一样式：圆角正方形
				const actionButtonStyle: CSSProperties = {
					padding: "8px",
					minWidth: "36px",
					height: "36px",
					borderRadius: "8px",
					justifyContent: "center",
				};

				return (
					<Space size="small">
						<PermissionButton permission="system:organization:update" onClick={() => handleEdit(record)} icon={<EditOutlined />} style={actionButtonStyle} />
						<PermissionButton permission="system:organization:update" onClick={() => handleAssignPermissions(record)} icon={<span style={{ fontSize: "14px", fontWeight: "bold" }}>权</span>} style={actionButtonStyle} variant="special" />
						<PermissionButton permission="system:organization:delete" onClick={() => handleDeleteClick(record.id)} icon={<DeleteOutlined />} style={actionButtonStyle} />
					</Space>
				);
			},
		},
	];

	return (
		<>
			<Space style={{ marginBottom: 16 }}>
				<PermissionButton permission="system:organization:create" onClick={handleAdd} icon={<PlusOutlined />}>
					新增组织
				</PermissionButton>
				<PermissionButton permission="system:organization:read" onClick={handleExport} icon={<ExportOutlined />}>
					导出
				</PermissionButton>
			</Space>

			<Table
				columns={columns}
				dataSource={organizations}
				rowKey="id"
				loading={loading}
				bordered
				pagination={{ pageSize: 10 }}
				tableLayout="fixed"
				size="small"
				scroll={{ x: "max-content" }}
			/>

			{/* 新增/编辑组织弹窗 */}
			<Modal
				title={editingOrg?.id ? "编辑组织" : "新增组织"}
				open={showModal}
				onOk={handleSave}
				onCancel={handleCancel}
				width={600}
				okText="保存"
				cancelText="取消"
			>
				<Form form={form} layout="vertical">
					<Row gutter={16}>
						<Col span={12}>
							<Form.Item
								label="组织名称"
								name="org_name"
								rules={[{ required: true, message: "请输入组织名称" }]}
							>
								<Input placeholder="请输入组织名称" />
							</Form.Item>
						</Col>
						<Col span={12}>
							<Form.Item
								label="组织编码"
								name="org_code"
								rules={[{ required: true, message: "请输入组织编码" }]}
							>
								<Input placeholder="如: team_a, tester_team_a" />
							</Form.Item>
						</Col>
					</Row>
					<Row gutter={16}>
						<Col span={12}>
							<Form.Item
								label="排序"
								name="sort_order"
								initialValue={0}
							>
								<InputNumber placeholder="请输入排序" min={0} style={{ width: "100%" }} />
							</Form.Item>
						</Col>
						<Col span={12}>
							<Form.Item
								label="状态"
								name="status"
								initialValue={1}
							>
								<Select>
									<Select.Option value={1}>正常</Select.Option>
									<Select.Option value={0}>禁用</Select.Option>
								</Select>
							</Form.Item>
						</Col>
					</Row>
					<Form.Item
						label="备注"
						name="remark"
					>
						<Input.TextArea placeholder="请输入备注" rows={3} />
					</Form.Item>
				</Form>
			</Modal>

			{/* 权限分配弹窗 */}
			<Modal
				title={
					<div>
						<div>分配权限 - {currentOrg?.org_name}</div>
						<p style={{ color: "#666", fontSize: "14px", marginTop: "-8px", marginBottom: 0 }}>
							配置该组织的权限，组织成员将自动继承
						</p>
					</div>
				}
				open={showPermModal}
				onOk={handleSavePermissions}
				onCancel={() => {
					setShowPermModal(false);
					setCurrentOrg(null);
				}}
				width={700}
				okText="保存"
				cancelText="取消"
			>
				<div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
					<label style={{ display: "flex", alignItems: "center", cursor: "pointer" }}>
						<input
							type="checkbox"
							checked={orgPerms.includes("*:*:*")}
							onChange={(e) => {
								if (e.target.checked) {
									setOrgPerms(["*:*:*"]);
								} else {
									setOrgPerms([]);
								}
							}}
							style={{ marginRight: "6px" }}
						/>
						<span style={{ fontSize: "13px" }}>超级管理员（拥有所有权限）</span>
					</label>
					<label style={{ display: "flex", alignItems: "center", cursor: "pointer" }}>
						<span style={{ fontSize: "13px", marginRight: "6px" }}>启用父子级联勾选</span>
						<input
							type="checkbox"
							checked={cascadeEnabled}
							onChange={(e) => setCascadeEnabled(e.target.checked)}
						/>
					</label>
				</div>
				<div style={{ maxHeight: "400px", overflowY: "auto", padding: "16px", background: "#f9f9f9", borderRadius: "4px" }}>
					<PermissionTree
						permissions={orgPerms.includes("*:*:*") ? [] : orgPerms.filter(k => k !== "*:*:*")}
						onChange={setOrgPerms}
						cascadeEnabled={cascadeEnabled}
					/>
				</div>
			</Modal>

			{/* 删除确认弹窗 */}
			<Modal
				title="删除组织"
				open={showDeleteModal}
				onOk={handleConfirmDelete}
				onCancel={() => {
					setShowDeleteModal(false);
					setDeletingOrgId(null);
				}}
				okText="确定"
				cancelText="取消"
				okButtonProps={{ danger: true }}
				centered={true}
			>
				<p>确定删除此组织吗？此操作无法撤销。</p>
			</Modal>
		</>
	);
}
