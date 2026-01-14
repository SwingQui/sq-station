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
	Select,
} from "antd";
import {
	PlusOutlined,
	ExportOutlined,
	EditOutlined,
	DeleteOutlined,
} from "@ant-design/icons";
import { getRoleList, createRole, updateRole, deleteRole, getRoleMenus, assignRoleMenus } from "@api/role";
import { getMenuList } from "@api/menu";
import type { Role, Menu } from "@types";
import PermissionButton from "@components/PermissionButton";
import PermissionTree from "@components/PermissionTree";
import { handleError, handleSuccess } from "@utils/error-handler";
import { exportToExcel, ExportEnumMaps } from "@utils/excel-export";

export default function RoleManage() {
	const [form] = Form.useForm();
	const [roles, setRoles] = useState<Role[]>([]);
	const [loading, setLoading] = useState(true);
	const [editingRole, setEditingRole] = useState<Role | null>(null);
	const [showModal, setShowModal] = useState(false);
	const [showPermModal, setShowPermModal] = useState(false);
	const [showDeleteModal, setShowDeleteModal] = useState(false);
	const [deletingRoleId, setDeletingRoleId] = useState<number | null>(null);
	const [selectedRole, setSelectedRole] = useState<Role | null>(null);
	const [selectedPerms, setSelectedPerms] = useState<string[]>([]);
	const [cascadeEnabled, setCascadeEnabled] = useState(true);

	useEffect(() => {
		fetchRoles();
	}, []);

	const fetchRoles = async () => {
		try {
			const data = await getRoleList();
			setRoles(data);
		} catch (e) {
			handleError(e, "加载失败");
		} finally {
			setLoading(false);
		}
	};

	const handleSave = async () => {
		try {
			const values = await form.validateFields();
			const roleData = {
				...values,
				sort_order: values.sort_order ?? 0,
				status: values.status ?? 1,
			};

			if (editingRole) {
				await updateRole(editingRole.id, roleData);
			} else {
				await createRole(roleData);
			}
			handleSuccess(editingRole ? "更新成功" : "创建成功");
			setShowModal(false);
			setEditingRole(null);
			form.resetFields();
			fetchRoles();
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
		setEditingRole(null);
		form.resetFields();
	};

	const handleEdit = (role: Role) => {
		setEditingRole(role);
		form.setFieldsValue({
			...role,
			status: role.status ?? 1,
		});
		setShowModal(true);
	};

	const handleDeleteClick = (id: number) => {
		setDeletingRoleId(id);
		setShowDeleteModal(true);
	};

	const handleConfirmDelete = async () => {
		if (deletingRoleId === null) return;
		try {
			await deleteRole(deletingRoleId);
			handleSuccess("删除成功");
			setShowDeleteModal(false);
			setDeletingRoleId(null);
			fetchRoles();
		} catch (e) {
			handleError(e, "删除失败");
		}
	};

	const handleAdd = () => {
		setEditingRole(null);
		form.resetFields();
		form.setFieldsValue({ status: 1 });
		setShowModal(true);
	};

	// 权限配置
	const handlePermConfig = async (role: Role) => {
		setSelectedRole(role);
		try {
			// 获取角色已分配的菜单
			const roleMenus = await getRoleMenus(role.id);
			// 从菜单中提取权限标识
			const perms = roleMenus
				.filter((m) => m.permission)
				.map((m) => m.permission!);

			setSelectedPerms(perms);
			setShowPermModal(true);
		} catch (e) {
			handleError(e, "加载权限失败");
		}
	};

	const handleSavePerms = async () => {
		if (!selectedRole) return;
		try {
			// 从权限标识反推菜单 ID
			const allMenus = await getMenuList();

			// 递归查找包含特定权限的菜单 ID
			function findMenuIdsByPermissions(menus: Menu[], permissions: string[]): number[] {
				const ids: number[] = [];
				for (const menu of menus) {
					if (menu.permission && permissions.includes(menu.permission)) {
						ids.push(menu.id);
					}
					if (menu.children) {
						ids.push(...findMenuIdsByPermissions(menu.children, permissions));
					}
				}
				return ids;
			}

			const menuIds = findMenuIdsByPermissions(allMenus, selectedPerms);

			await assignRoleMenus(selectedRole.id, menuIds);
			handleSuccess("权限配置成功");
			setShowPermModal(false);
			setSelectedRole(null);
			fetchRoles();
		} catch (e) {
			handleError(e, "保存失败");
		}
	};

	const handleExport = async () => {
		await exportToExcel({
			sheetName: "角色列表",
			filename: "roles",
			columns: [
				{
					header: "ID",
					field: "id",
					width: 10,
				},
				{
					header: "角色名称",
					field: "role_name",
					width: 20,
				},
				{
					header: "权限标识",
					field: "role_key",
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
			data: roles,
		});

		handleSuccess("导出成功");
	};

	// 表格列定义
	const columns: ColumnsType<Role> = [
		{ title: "ID", dataIndex: "id", width: 60, align: "center" as const },
		{ title: "角色名称", dataIndex: "role_name", width: 150, align: "center" as const },
		{
			title: "权限标识",
			dataIndex: "role_key",
			width: 100,
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
			width: 150,
			align: "center" as const,
			render: (text: string) => (text ? new Date(text).toLocaleString("zh-CN") : "-"),
		},
		{
			title: "更新时间",
			dataIndex: "updated_at",
			width: 150,
			align: "center" as const,
			render: (text: string) => (text ? new Date(text).toLocaleString("zh-CN") : "-"),
		},
		{
			title: "备注",
			dataIndex: "remark",
			width: 150,
			ellipsis: true,
			align: "center" as const,
			render: (text: string | null) => text || "-",
		},
		{
			title: "操作",
			key: "action",
			width: 200,
			align: "center" as const,
			render: (_: any, record: Role) => {
				// ID=1 的系统管理员角色不允许编辑、删除、配置权限
				if (record.id === 1) {
					return <span style={{ color: "#999" }}>系统角色</span>;
				}

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
						<PermissionButton permission="system:role:update" onClick={() => handleEdit(record)} icon={<EditOutlined />} style={actionButtonStyle} />
						<PermissionButton permission="system:role:configPermissions" onClick={() => handlePermConfig(record)} icon={<span style={{ fontSize: "14px", fontWeight: "bold" }}>权</span>} style={actionButtonStyle} />
						<PermissionButton permission="system:role:delete" onClick={() => handleDeleteClick(record.id)} icon={<DeleteOutlined />} style={actionButtonStyle} />
					</Space>
				);
			},
		},
	];

	return (
		<>
			<Space style={{ marginBottom: 16 }}>
				<PermissionButton permission="system:role:create" onClick={handleAdd} icon={<PlusOutlined />}>
					新增角色
				</PermissionButton>
				<PermissionButton permission="system:role:read" onClick={handleExport} icon={<ExportOutlined />}>
					导出
				</PermissionButton>
			</Space>

			<Table
				columns={columns}
				dataSource={roles}
				rowKey="id"
				loading={loading}
				bordered
				pagination={{ pageSize: 10 }}
				tableLayout="fixed"
				size="small"
				scroll={{ x: "max-content" }}
			/>

			{/* 新增/编辑角色弹窗 */}
			<Modal
				title={editingRole?.id ? "编辑角色" : "新增角色"}
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
								label="角色名称"
								name="role_name"
								rules={[{ required: true, message: "请输入角色名称" }]}
							>
								<Input placeholder="请输入角色名称" />
							</Form.Item>
						</Col>
						<Col span={12}>
							<Form.Item
								label="权限标识"
								name="role_key"
								rules={[{ required: true, message: "请输入权限标识" }]}
							>
								<Input placeholder="如: admin, user, editor" />
							</Form.Item>
						</Col>
					</Row>
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
					<Form.Item
						label="备注"
						name="remark"
					>
						<Input.TextArea placeholder="请输入备注" rows={3} />
					</Form.Item>
				</Form>
			</Modal>

			{/* 权限配置弹窗 */}
			<Modal
				title={
					<div>
						<div>配置权限 - {selectedRole?.role_name}</div>
						<p style={{ color: "#666", fontSize: "14px", marginTop: "-8px", marginBottom: 0 }}>
							配置该角色拥有的权限列表
						</p>
					</div>
				}
				open={showPermModal}
				onOk={handleSavePerms}
				onCancel={() => {
					setShowPermModal(false);
					setSelectedRole(null);
				}}
				width={700}
				okText="保存"
				cancelText="取消"
			>
				<>
					<div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
						<label style={{ display: "flex", alignItems: "center", cursor: "pointer" }}>
							<input
								type="checkbox"
								checked={selectedPerms.includes("*:*:*")}
								onChange={(e) => {
									if (e.target.checked) {
										setSelectedPerms(["*:*:*"]);
									} else {
										setSelectedPerms([]);
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
							permissions={selectedPerms.includes("*:*:*") ? [] : selectedPerms.filter(k => k !== "*:*:*")}
							onChange={setSelectedPerms}
							cascadeEnabled={cascadeEnabled}
						/>
					</div>
				</>
			</Modal>

			{/* 删除确认弹窗 */}
			<Modal
				title="删除角色"
				open={showDeleteModal}
				onOk={handleConfirmDelete}
				onCancel={() => {
					setShowDeleteModal(false);
					setDeletingRoleId(null);
				}}
				okText="确定"
				cancelText="取消"
				okButtonProps={{ danger: true }}
				centered={true}
			>
				<p>确定删除此角色吗？此操作无法撤销。</p>
			</Modal>
		</>
	);
}
