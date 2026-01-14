import { useEffect, useState } from "react";
import
	type { ColumnsType } from "antd/es/table";
import {
	Table,
	Modal,
	Form,
	Input,
	Space,
	Tag,
	Row,
	Col,
	Radio,
	Transfer,
	message,
} from "antd";
import {
	PlusOutlined,
	ExportOutlined,
	EditOutlined,
	DeleteOutlined,
	MoreOutlined,
	UserOutlined,
	KeyOutlined,
	ApartmentOutlined,
} from "@ant-design/icons";
import {
	getUserList,
	createUser,
	updateUser,
	deleteUser,
	getUserRoles,
	assignUserRoles,
	getUserDirectPermissions,
	assignUserPermissions,
} from "@api/user";
import { getOrganizationList, getUserOrganizations, assignUserOrganizations } from "@api/organization";
import { getRoleList } from "@api/role";
import type { User, Organization, Role } from "@types";
import PermissionButton from "@components/PermissionButton";
import PermissionDropdownButton from "@components/PermissionDropdownButton";
import PermissionTree from "@components/PermissionTree";
import { handleError, handleSuccess } from "@utils/error-handler";
import { exportToExcel, ExportEnumMaps } from "@utils/excel-export";

// 用户表单验证规则
const getUserFormRules = (isEdit: boolean) => ({
	username: [
		{ required: true, message: "请输入用户名" },
		{ min: 3, max: 20, message: "用户名长度为3-20个字符" },
		{ pattern: /^[a-zA-Z0-9_]+$/, message: "用户名只能包含字母、数字和下划线" },
	],
	password: [
		{ required: !isEdit, message: "请输入密码" },
		{ min: 6, message: "密码至少6个字符" },
	],
	nickname: [{ max: 50, message: "昵称最多50个字符" }],
	email: [{ type: "email" as const, message: "请输入正确的邮箱格式" }],
	phone: [{ pattern: /^1[3-9]\d{9}$/, message: "请输入正确的手机号" }],
});

export default function UserManage() {
	const [form] = Form.useForm();
	const [users, setUsers] = useState<User[]>([]);
	const [loading, setLoading] = useState(true);
	const [editingUser, setEditingUser] = useState<User | null>(null);
	const [showModal, setShowModal] = useState(false);
	const [showOrgModal, setShowOrgModal] = useState(false);
	const [showRoleModal, setShowRoleModal] = useState(false);
	const [showPermModal, setShowPermModal] = useState(false);
	const [showDeleteModal, setShowDeleteModal] = useState(false);
	const [deletingUserId, setDeletingUserId] = useState<number | null>(null);
	const [currentUserId, setCurrentUserId] = useState<number | null>(null);
	const [currentUserOrgs, setCurrentUserOrgs] = useState<number[]>([]);
	const [currentUserRoles, setCurrentUserRoles] = useState<number[]>([]);
	const [currentUserPerms, setCurrentUserPerms] = useState<string[]>([]);
	const [cascadeEnabled, setCascadeEnabled] = useState(true);
	const [allOrgs, setAllOrgs] = useState<Organization[]>([]);
	const [allRoles, setAllRoles] = useState<Role[]>([]);

	useEffect(() => {
		fetchUsers();
	}, []);

	const fetchUsers = async () => {
		try {
			const data = await getUserList();
			setUsers(data);
		} catch (e) {
			handleError(e, "加载失败");
		} finally {
			setLoading(false);
		}
	};

	const handleSave = async () => {
		try {
			const values = await form.validateFields();
			const userData = {
				...values,
				status: values.status ?? 1,
			};

			if (editingUser) {
				await updateUser(editingUser.id, userData);
			} else {
				await createUser(userData);
			}
			handleSuccess(editingUser ? "更新成功" : "创建成功");
			setShowModal(false);
			setEditingUser(null);
			form.resetFields();
			fetchUsers();
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
		setEditingUser(null);
		form.resetFields();
	};

	const handleEdit = (user: User) => {
		setEditingUser(user);
		form.setFieldsValue({
			...user,
			status: user.status ?? 1,
		});
		setShowModal(true);
	};

	const handleDeleteClick = (id: number) => {
		setDeletingUserId(id);
		setShowDeleteModal(true);
	};

	const handleConfirmDelete = async () => {
		if (deletingUserId === null) return;
		try {
			await deleteUser(deletingUserId);
			handleSuccess("删除成功");
			setShowDeleteModal(false);
			setDeletingUserId(null);
			fetchUsers();
		} catch (e) {
			handleError(e, "删除失败");
		}
	};

	const handleAdd = () => {
		setEditingUser(null);
		form.resetFields();
		form.setFieldsValue({ status: 1 });
		setShowModal(true);
	};

	const handleAssignOrgs = async (user: User) => {
		setCurrentUserId(user.id);
		try {
			const orgs = await getUserOrganizations(user.id);
			setCurrentUserOrgs(orgs.map((o) => o.id));
			// Load all organizations
			const allOrgsData = await getOrganizationList();
			setAllOrgs(allOrgsData);
			setShowOrgModal(true);
		} catch (e) {
			handleError(e, "加载组织失败");
		}
	};

	const handleSaveOrgs = async () => {
		if (currentUserId === null) return;
		try {
			await assignUserOrganizations(currentUserId, currentUserOrgs);
			handleSuccess("分配组织成功");
			setShowOrgModal(false);
		} catch (e) {
			handleError(e, "分配失败");
		}
	};

	const handleAssignRoles = async (user: User) => {
		setCurrentUserId(user.id);
		try {
			const roles = await getUserRoles(user.id);
			setCurrentUserRoles(roles.map((r) => r.id));
			// Load all roles
			const allRolesData = await getRoleList();
			setAllRoles(allRolesData);
			setShowRoleModal(true);
		} catch (e) {
			handleError(e, "加载角色失败");
		}
	};

	const handleSaveRoles = async () => {
		if (currentUserId === null) return;
		try {
			await assignUserRoles(currentUserId, currentUserRoles);
			handleSuccess("分配角色成功");
			setShowRoleModal(false);
		} catch (e) {
			handleError(e, "分配失败");
		}
	};

	const handleAssignPerms = async (user: User) => {
		setCurrentUserId(user.id);
		try {
			const perms = await getUserDirectPermissions(user.id);
			setCurrentUserPerms(perms);
			setShowPermModal(true);
		} catch (e) {
			handleError(e, "加载权限失败");
		}
	};

	const handleSavePerms = async () => {
		if (currentUserId === null) return;
		try {
			await assignUserPermissions(currentUserId, currentUserPerms);
			handleSuccess("分配权限成功");
			setShowPermModal(false);
		} catch (e) {
			handleError(e, "分配失败");
		}
	};

	const handleExport = async () => {
		await exportToExcel({
			sheetName: "用户列表",
			filename: "users",
			columns: [
				{
					header: "ID",
					field: "id",
					width: 10,
				},
				{
					header: "用户名",
					field: "username",
					width: 15,
				},
				{
					header: "昵称",
					field: "nickname",
					width: 15,
				},
				{
					header: "邮箱",
					field: "email",
					width: 25,
				},
				{
					header: "手机",
					field: "phone",
					width: 15,
				},
				{
					header: "状态",
					field: "status",
					width: 10,
					formatter: (value) =>
						value !== undefined ? ExportEnumMaps.status[value as keyof typeof ExportEnumMaps.status] || value : "",
				},
				{
					header: "创建时间",
					field: "created_at",
					width: 20,
					formatter: (value) => (value ? new Date(value).toLocaleString("zh-CN") : ""),
				},
				{
					header: "更新时间",
					field: "updated_at",
					width: 20,
					formatter: (value) => (value ? new Date(value).toLocaleString("zh-CN") : ""),
				},
			],
			data: users,
		});

		handleSuccess("导出成功");
	};

	// 表格列定义
	const columns: ColumnsType<User> = [
		{ title: "ID", dataIndex: "id", width: 60, align: "center" as const },
		{ title: "用户名", dataIndex: "username", width: 100, align: "center" as const },
		{ title: "昵称", dataIndex: "nickname", width: 100, align: "center" as const, render: (text: string) => text || "-" },
		{ title: "邮箱", dataIndex: "email", width: 130, align: "center" as const, render: (text: string) => text || "-" },
		{ title: "手机", dataIndex: "phone", width: 110, align: "center" as const, render: (text: string) => text || "-" },
		{
			title: "状态",
			dataIndex: "status",
			width: 70,
			align: "center" as const,
			render: (status: number) => (
				<Tag color={status ? "success" : "error"} style={{ display: "inline-flex", alignItems: "center" }}>{status ? "正常" : "禁用"}</Tag>
			),
		},
		{
			title: "创建时间",
			dataIndex: "created_at",
			width: 130,
			align: "center" as const,
			render: (text: string) => (text ? new Date(text).toLocaleString("zh-CN") : "-"),
		},
		{
			title: "更新时间",
			dataIndex: "updated_at",
			width: 130,
			align: "center" as const,
			render: (text: string) => (text ? new Date(text).toLocaleString("zh-CN") : "-"),
		},
		{
			title: "备注",
			dataIndex: "remark",
			width: 120,
			ellipsis: true,
			align: "center" as const,
			render: (text: string | null) => text || "-",
		},
		{
			title: "操作",
			key: "action",
			width: 180,
			align: "center" as const,
			render: (_: any, record: User) => {
				// admin 用户（ID=1）不允许编辑、删除、降权
				if (record.id === 1) {
					return <span style={{ color: "#999" }}>系统管理员</span>;
				}

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
						<PermissionButton permission="system:user:update" onClick={() => handleEdit(record)} icon={<EditOutlined />} style={actionButtonStyle} />
						<PermissionDropdownButton
							icon={<MoreOutlined />}
							items={[
								{
									key: 'roles',
									permission: 'system:user:assignRoles',
									label: '分配角色',
									icon: <UserOutlined />,
									onClick: () => handleAssignRoles(record),
								},
								{
									key: 'permissions',
									permission: 'system:user:assignPermissions',
									label: '分配权限',
									icon: <KeyOutlined />,
									onClick: () => handleAssignPerms(record),
								},
								{
									key: 'divider',
									permission: '',
									label: '',
									type: 'divider',
								},
								{
									key: 'organizations',
									permission: 'system:user:assignOrgs',
									label: '分配组织',
									icon: <ApartmentOutlined />,
									onClick: () => handleAssignOrgs(record),
								},
							]}
						/>
						<PermissionButton permission="system:user:delete" onClick={() => handleDeleteClick(record.id)} icon={<DeleteOutlined />} style={actionButtonStyle} />
					</Space>
				);
			},
		},
	];

	const currentUser = users.find((u) => u.id === currentUserId);
	const userFormRules = getUserFormRules(!!editingUser?.id);

	// Transfer 数据源需要 key 属性
	const roleDataSource = allRoles.map((role) => ({ ...role, key: role.id }));
	const orgDataSource = allOrgs.map((org) => ({ ...org, key: org.id }));

	return (
		<>
			<Space style={{ marginBottom: 16 }}>
				<PermissionButton permission="system:user:create" onClick={handleAdd} icon={<PlusOutlined />}>
					新增用户
				</PermissionButton>
				<PermissionButton permission="system:user:read" onClick={handleExport} icon={<ExportOutlined />}>
					导出
				</PermissionButton>
			</Space>

			<Table
				columns={columns}
				dataSource={users}
				rowKey="id"
				loading={loading}
				bordered
				pagination={{ pageSize: 10 }}
				size="small"
			/>

			{/* 新增/编辑用户弹窗 */}
			<Modal
				title={editingUser?.id ? "编辑用户" : "新增用户"}
				open={showModal}
				onOk={handleSave}
				onCancel={handleCancel}
				width={700}
				okText="保存"
				cancelText="取消"
			>
				<Form form={form} layout="vertical">
					<Row gutter={16}>
						<Col span={12}>
							<Form.Item label="用户名" name="username" rules={userFormRules.username}>
								<Input placeholder="请输入用户名" />
							</Form.Item>
						</Col>
						<Col span={12}>
							<Form.Item label="密码" name="password" rules={userFormRules.password}>
								<Input.Password placeholder={editingUser?.id ? "留空不修改" : "请输入密码"} />
							</Form.Item>
						</Col>
					</Row>
					<Row gutter={16}>
						<Col span={12}>
							<Form.Item label="昵称" name="nickname">
								<Input placeholder="请输入昵称" />
							</Form.Item>
						</Col>
						<Col span={12}>
							<Form.Item label="邮箱" name="email" rules={userFormRules.email}>
								<Input placeholder="请输入邮箱" />
							</Form.Item>
						</Col>
					</Row>
					<Row gutter={16}>
						<Col span={12}>
							<Form.Item label="手机" name="phone" rules={userFormRules.phone}>
								<Input placeholder="请输入手机号" />
							</Form.Item>
						</Col>
						<Col span={12}>
							<Form.Item label="状态" name="status" initialValue={1}>
								{editingUser?.id === 1 ? (
									// admin 用户不允许禁用
									<span style={{ color: "#52c41a", fontWeight: 500 }}>正常（系统管理员不可禁用）</span>
								) : (
									<Radio.Group buttonStyle="solid">
										<Radio.Button value={1}>正常</Radio.Button>
										<Radio.Button value={0}>禁用</Radio.Button>
									</Radio.Group>
								)}
							</Form.Item>
						</Col>
					</Row>
				</Form>
			</Modal>

			{/* 分配角色弹窗 */}
			<Modal
				title={`分配角色 - ${currentUser?.username}`}
				open={showRoleModal}
				onOk={handleSaveRoles}
				onCancel={() => setShowRoleModal(false)}
				width={700}
				okText="保存"
				cancelText="取消"
			>
				{allRoles.length === 0 ? (
					<div style={{ textAlign: "center", padding: "40px", color: "#888" }}>暂无角色</div>
				) : (
					<>
						{currentUserId === 1 && (
							<div style={{ marginBottom: 12, color: "#faad14", fontSize: 14 }}>
								⚠️ 系统管理员必须保留 admin 角色
							</div>
						)}
						<Transfer
							dataSource={roleDataSource.map((role) => ({
								...role,
								// admin 用户不能移除 admin 角色
								disabled: currentUserId === 1 && role.role_key === "admin",
							}))}
							targetKeys={currentUserRoles}
							onChange={(targetKeys) => {
								// admin 用户必须保留 admin 角色
								if (currentUserId === 1) {
									const adminRole = allRoles.find(r => r.role_key === "admin");
									if (adminRole && !targetKeys.includes(adminRole.id)) {
										message.warning("系统管理员必须保留 admin 角色");
										return;
									}
								}
								setCurrentUserRoles(targetKeys as number[]);
							}}
							render={(item) => `${item.role_name} (${item.role_key})`}
							titles={["可选角色", "已选角色"]}
							showSearch
							filterOption={(inputValue, item) =>
								item.role_name.includes(inputValue) || item.role_key.includes(inputValue)
							}
							styles={{
								section: {
									width: 300,
									height: 400,
								},
							}}
						/>
					</>
				)}
			</Modal>

			{/* 分配组织弹窗 */}
			<Modal
				title={`分配组织 - ${currentUser?.username}`}
				open={showOrgModal}
				onOk={handleSaveOrgs}
				onCancel={() => setShowOrgModal(false)}
				width={700}
				okText="保存"
				cancelText="取消"
			>
				{allOrgs.length === 0 ? (
					<div style={{ textAlign: "center", padding: "40px", color: "#888" }}>暂无组织</div>
				) : (
					<Transfer
						dataSource={orgDataSource}
						targetKeys={currentUserOrgs}
						onChange={(targetKeys) => setCurrentUserOrgs(targetKeys as number[])}
						render={(item) => `${item.org_name} (${item.org_code})`}
						titles={["可选组织", "已选组织"]}
						showSearch
						filterOption={(inputValue, item) =>
							item.org_name.includes(inputValue) || item.org_code.includes(inputValue)
						}
						styles={{
							section: {
								width: 300,
								height: 400,
							},
						}}
					/>
				)}
			</Modal>

			{/* 分配权限弹窗 */}
			<Modal
				title={
					<div>
						<div>分配权限 - {currentUser?.username}</div>
						<p style={{ color: "#666", fontSize: "14px", marginTop: "-8px", marginBottom: 0 }}>
							为用户分配额外的直接权限（与角色权限叠加）
						</p>
					</div>
				}
				open={showPermModal}
				onOk={handleSavePerms}
				onCancel={() => setShowPermModal(false)}
				width={700}
				okText="保存"
				cancelText="取消"
			>
				<>
					<div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
						<label style={{ display: "flex", alignItems: "center", cursor: "pointer" }}>
							<input
								type="checkbox"
								checked={currentUserPerms.includes("*:*:*")}
								onChange={(e) => {
									if (e.target.checked) {
										setCurrentUserPerms(["*:*:*"]);
									} else {
										setCurrentUserPerms([]);
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
							permissions={currentUserPerms.includes("*:*:*") ? [] : currentUserPerms.filter(k => k !== "*:*:*")}
							onChange={setCurrentUserPerms}
							cascadeEnabled={cascadeEnabled}
						/>
					</div>
				</>
			</Modal>

			{/* 删除确认弹窗 */}
			<Modal
				title="删除用户"
				open={showDeleteModal}
				onOk={handleConfirmDelete}
				onCancel={() => {
					setShowDeleteModal(false);
					setDeletingUserId(null);
				}}
				okText="确定"
				cancelText="取消"
				okButtonProps={{ danger: true }}
				centered={true}
			>
				<p>确定删除此用户吗？此操作无法撤销。</p>
			</Modal>
		</>
	);
}
