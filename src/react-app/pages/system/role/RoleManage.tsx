import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { PlusOutlined, ExportOutlined } from "@ant-design/icons";
import { Tree } from "antd";
import { getRoleList, createRole, updateRole, deleteRole } from "../../../api/role";
import { getMenuList } from "../../../api/menu";
import type { Role, Menu } from "../../../types";
import PermissionButton from "../../../components/PermissionButton";
import { handleError, handleSuccess } from "../../../utils/error-handler";
import { exportToExcel, ExportEnumMaps } from "../../../utils/excel-export";

// 权限树节点类型
interface PermissionTreeNode {
	title: string | ReactNode;
	key: string;
	children?: PermissionTreeNode[];
}

// 从菜单数据构建权限树（供 Ant Design Tree 使用）
function buildPermissionTreeFromMenus(menus: Menu[]): PermissionTreeNode[] {
	const result: PermissionTreeNode[] = [];

	for (const menu of menus) {
		// 检查此菜单或其后代是否有权限
		const hasPerm = hasPermissionInChildren(menu);

		if (!hasPerm) {
			continue; // 跳过没有权限的菜单分支
		}

		const node: PermissionTreeNode = {
			title: menu.permission
				? `${menu.menu_name} ${menu.menu_type === "F" ? "(按钮)" : ""} `
				: menu.menu_name,
			key: menu.permission || `menu_${menu.id}`, // 有权限用 permission，否则用唯一 ID
		};

		// 如果有权限标识，在标题中显示
		if (menu.permission) {
			node.title = (
				<div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", paddingRight: "8px" }}>
					<span>
						{menu.menu_name}
						{menu.menu_type === "F" && <span style={{ color: "#888", fontSize: "12px", marginLeft: "4px" }}>(按钮)</span>}
					</span>
					<code style={{
						color: "#666",
						fontSize: "12px",
						fontFamily: "monospace",
						background: "#f5f5f5",
						padding: "2px 6px",
						borderRadius: "3px",
					}}>
						{menu.permission}
					</code>
				</div>
			);
		}

		// 递归处理子菜单
		if (menu.children && menu.children.length > 0) {
			const children = buildPermissionTreeFromMenus(menu.children);
			if (children.length > 0) {
				node.children = children;
			}
		}

		result.push(node);
	}

	return result;
}

// 检查菜单树中是否有权限标识
function hasPermissionInChildren(menu: Menu): boolean {
	if (menu.permission) return true;
	if (menu.children) {
		return menu.children.some((child) => hasPermissionInChildren(child));
	}
	return false;
}

export default function RoleManage() {
	const [roles, setRoles] = useState<Role[]>([]);
	const [menus, setMenus] = useState<Menu[]>([]);
	const [loading, setLoading] = useState(true);
	const [editingRole, setEditingRole] = useState<Role | null>(null);
	const [showModal, setShowModal] = useState(false);
	const [showPermModal, setShowPermModal] = useState(false);
	const [selectedRole, setSelectedRole] = useState<Role | null>(null);
	const [selectedPerms, setSelectedPerms] = useState<string[]>([]);
	const [permissionTreeData, setPermissionTreeData] = useState<PermissionTreeNode[]>([]);

	useEffect(() => {
		fetchRoles();
		fetchMenus();
	}, []);

	const fetchRoles = async () => {
		try {
			const data = await getRoleList();
			setRoles(data);
		} catch (e) {
			console.error(e);
		} finally {
			setLoading(false);
		}
	};

	const fetchMenus = async () => {
		try {
			const data = await getMenuList();
			setMenus(data);
		} catch (e) {
			console.error(e);
		}
	};

	const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		const formData = new FormData(e.currentTarget);
		const roleData: any = {
			role_name: formData.get("role_name"),
			role_key: formData.get("role_key"),
			sort_order: Number(formData.get("sort_order") || 0),
			status: Number(formData.get("status") || 1),
			remark: formData.get("remark"),
		};

		try {
			if (editingRole) {
				await updateRole(editingRole.id, roleData);
			} else {
				await createRole(roleData);
			}
			setShowModal(false);
			setEditingRole(null);
			fetchRoles();
		} catch (e) {
			handleError(e, "保存失败");
		}
	};

	const handleEdit = (role: Role) => {
		setEditingRole(role);
		setShowModal(true);
	};

	const handleDelete = async (id: number) => {
		if (!confirm("确定删除此角色吗？")) return;
		try {
			await deleteRole(id);
			handleSuccess("删除成功");
			fetchRoles();
		} catch (e) {
			handleError(e, "删除失败");
		}
	};

	const handleAdd = () => {
		setEditingRole(null);
		setShowModal(true);
	};

	// 权限配置
	const handlePermConfig = (role: Role) => {
		setSelectedRole(role);
		// Parse existing permissions
		let perms: string[] = [];
		try {
			perms = role.permissions ? JSON.parse(role.permissions) : [];
		} catch (e) {
			console.error("Failed to parse permissions:", role.permissions);
		}
		setSelectedPerms(perms);
		// 构建权限树数据
		const treeData = buildPermissionTreeFromMenus(menus);
		setPermissionTreeData(treeData);
		setShowPermModal(true);
	};

	const handleSavePerms = async () => {
		if (!selectedRole) return;
		try {
			const updateData: any = {
				role_name: selectedRole.role_name,
				role_key: selectedRole.role_key,
				permissions: JSON.stringify(selectedPerms),
			};
			if (selectedRole.sort_order !== undefined) updateData.sort_order = selectedRole.sort_order;
			if (selectedRole.status !== undefined) updateData.status = selectedRole.status;
			if (selectedRole.remark !== undefined) updateData.remark = selectedRole.remark;

			await updateRole(selectedRole.id, updateData);
			handleSuccess("权限配置成功");
			setShowPermModal(false);
			setSelectedRole(null);
			fetchRoles();
		} catch (e) {
			handleError(e, "保存失败");
		}
	};

	const handleExport = () => {
		exportToExcel({
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

	return (
		<div style={{ padding: "20px", maxWidth: "1200px", margin: "0 auto" }}>
			<div style={{ marginBottom: "20px", display: "flex", gap: "8px" }}>
				<PermissionButton permission="system:role:create" onClick={handleAdd} icon={<PlusOutlined />}>
					新增角色
				</PermissionButton>
				<PermissionButton permission="system:role:read" onClick={handleExport} icon={<ExportOutlined />}>
					导出
				</PermissionButton>
			</div>

			{loading ? (
				<div>加载中...</div>
			) : (
				<table style={{ width: "100%", borderCollapse: "collapse" }}>
					<thead>
						<tr style={{ background: "#f5f5f5" }}>
							<th style={{ padding: "12px", textAlign: "left", borderBottom: "1px solid #ddd" }}>ID</th>
							<th style={{ padding: "12px", textAlign: "left", borderBottom: "1px solid #ddd" }}>角色名称</th>
							<th style={{ padding: "12px", textAlign: "left", borderBottom: "1px solid #ddd" }}>权限标识</th>
							<th style={{ padding: "12px", textAlign: "left", borderBottom: "1px solid #ddd" }}>排序</th>
							<th style={{ padding: "12px", textAlign: "left", borderBottom: "1px solid #ddd" }}>状态</th>
							<th style={{ padding: "12px", textAlign: "left", borderBottom: "1px solid #ddd" }}>创建时间</th>
							<th style={{ padding: "12px", textAlign: "left", borderBottom: "1px solid #ddd" }}>操作</th>
						</tr>
					</thead>
					<tbody>
						{roles.map((role) => (
							<tr key={role.id}>
								<td style={{ padding: "12px", borderBottom: "1px solid #eee" }}>{role.id}</td>
								<td style={{ padding: "12px", borderBottom: "1px solid #eee" }}>{role.role_name}</td>
								<td style={{ padding: "12px", borderBottom: "1px solid #eee" }}>
									<code style={{ padding: "2px 6px", background: "#f5f5f5", borderRadius: "4px", fontSize: "12px" }}>{role.role_key}</code>
								</td>
								<td style={{ padding: "12px", borderBottom: "1px solid #eee" }}>{role.sort_order}</td>
								<td style={{ padding: "12px", borderBottom: "1px solid #eee" }}>
									<span style={{ padding: "2px 8px", borderRadius: "4px", background: role.status ? "#52c41a" : "#f5222d", color: "white", fontSize: "12px" }}>
										{role.status ? "正常" : "禁用"}
									</span>
								</td>
								<td style={{ padding: "12px", borderBottom: "1px solid #eee" }}>{new Date(role.created_at).toLocaleString("zh-CN")}</td>
								<td style={{ padding: "12px", borderBottom: "1px solid #eee" }}>
									<PermissionButton permission="system:role:update" onClick={() => handleEdit(role)} style={{ padding: "4px 12px", marginRight: "4px" }}>
										编辑
									</PermissionButton>
									<PermissionButton permission="system:role:configPermissions" onClick={() => handlePermConfig(role)} style={{ padding: "4px 12px", marginRight: "4px" }}>
										配置权限
									</PermissionButton>
									<PermissionButton permission="system:role:delete" onClick={() => handleDelete(role.id)} style={{ padding: "4px 12px" }}>
										删除
									</PermissionButton>
								</td>
							</tr>
						))}
					</tbody>
				</table>
			)}

			{/* 角色编辑弹窗 */}
			{showModal && (
				<div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
					<div style={{ background: "white", padding: "24px", borderRadius: "8px", width: "400px", maxWidth: "90%" }}>
						<h2 style={{ marginTop: 0 }}>{editingRole ? "编辑角色" : "新增角色"}</h2>
						<form onSubmit={handleSave}>
							<div style={{ marginBottom: "16px" }}>
								<label style={{ display: "block", marginBottom: "8px" }}>角色名称 *</label>
								<input name="role_name" defaultValue={editingRole?.role_name} required style={{ width: "100%", padding: "8px", border: "1px solid #ddd", borderRadius: "4px" }} />
							</div>
							<div style={{ marginBottom: "16px" }}>
								<label style={{ display: "block", marginBottom: "8px" }}>权限标识 *</label>
								<input name="role_key" defaultValue={editingRole?.role_key} required style={{ width: "100%", padding: "8px", border: "1px solid #ddd", borderRadius: "4px" }} />
								<small style={{ color: "#888" }}>如: admin, user, editor</small>
							</div>
							<div style={{ marginBottom: "16px" }}>
								<label style={{ display: "block", marginBottom: "8px" }}>排序</label>
								<input name="sort_order" type="number" defaultValue={editingRole?.sort_order ?? 0} style={{ width: "100%", padding: "8px", border: "1px solid #ddd", borderRadius: "4px" }} />
							</div>
							<div style={{ marginBottom: "16px" }}>
								<label style={{ display: "block", marginBottom: "8px" }}>状态</label>
								<select name="status" defaultValue={editingRole?.status ?? 1} style={{ width: "100%", padding: "8px", border: "1px solid #ddd", borderRadius: "4px" }}>
									<option value="1">正常</option>
									<option value="0">禁用</option>
								</select>
							</div>
							<div style={{ marginBottom: "16px" }}>
								<label style={{ display: "block", marginBottom: "8px" }}>备注</label>
								<textarea name="remark" defaultValue={editingRole?.remark || ""} style={{ width: "100%", padding: "8px", border: "1px solid #ddd", borderRadius: "4px", minHeight: "60px" }} />
							</div>
							<div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
								<button type="button" onClick={() => setShowModal(false)} style={{ padding: "8px 16px", background: "#ccc", border: "none", borderRadius: "4px", cursor: "pointer" }}>
									取消
								</button>
								<button type="submit" style={{ padding: "8px 16px", background: "#1890ff", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}>
									保存
								</button>
							</div>
						</form>
					</div>
				</div>
			)}

			{/* 权限配置弹窗 */}
			{showPermModal && (
				<div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
					<div style={{ background: "white", padding: "24px", borderRadius: "8px", width: "700px", maxWidth: "90%" }}>
						<div>
							<h2 style={{ marginTop: 0 }}>配置权限 - {selectedRole?.role_name}</h2>
							<p style={{ color: "#666", fontSize: "14px", marginTop: "-8px", marginBottom: "16px" }}>配置该角色拥有的权限列表</p>
						</div>
						<div style={{ maxHeight: "450px", overflowY: "auto", padding: "16px", background: "#f9f9f9", borderRadius: "4px" }}>
							{/* 超级管理员通配符 */}
							<label style={{ display: "flex", alignItems: "center", cursor: "pointer", marginBottom: "16px" }}>
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
								<span style={{ fontSize: "13px", fontWeight: "bold", color: "#f5222d" }}>*:*:* (所有权限)</span>
							</label>

							{/* Ant Design Tree */}
							<div style={{ width: "100%" }}>
								<Tree
									checkable
									blockNode={true}
									checkedKeys={selectedPerms.includes("*:*:*") ? [] : selectedPerms.filter(k => k !== "*:*:*")}
									onCheck={(checkedKeys) => {
										const keys = checkedKeys as string[];
										// 如果选中了超级管理员，只保留超级管理员权限
										if (keys.includes("*:*:*")) {
											setSelectedPerms(["*:*:*"]);
										} else {
											setSelectedPerms(keys);
										}
									}}
									treeData={permissionTreeData}
									defaultExpandAll
									showLine={{ showLeafIcon: false }}
									style={{ fontSize: "13px", width: "100%" }}
								/>
							</div>
						</div>
						<div style={{ display: "flex", gap: "8px", justifyContent: "flex-end", marginTop: "16px" }}>
							<button type="button" onClick={() => setShowPermModal(false)} style={{ padding: "8px 16px", background: "#ccc", border: "none", borderRadius: "4px", cursor: "pointer" }}>
								取消
							</button>
							<button type="button" onClick={handleSavePerms} style={{ padding: "8px 16px", background: "#1890ff", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}>
								保存
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
