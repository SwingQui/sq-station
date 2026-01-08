import { useEffect, useState } from "react";
import { PlusOutlined } from "@ant-design/icons";
import {
	getPermissionGroups,
	createPermissionGroup,
	updatePermissionGroup,
	deletePermissionGroup,
	type OAuthPermissionGroup,
	type CreatePermissionGroupDto,
	type UpdatePermissionGroupDto
} from "../../../api/oauth-permission-group";
import { getPermissionsConfig, type PermissionGroup } from "../../../api/config";
import PermissionButton from "../../../components/PermissionButton";
import { handleError, handleSuccess } from "../../../utils/error-handler";

export default function OAuthPermissionGroupManage() {
	const [groups, setGroups] = useState<OAuthPermissionGroup[]>([]);
	const [permissionGroups, setPermissionGroups] = useState<PermissionGroup[]>([]);
	const [loading, setLoading] = useState(true);
	const [showModal, setShowModal] = useState(false);
	const [editingGroup, setEditingGroup] = useState<OAuthPermissionGroup | null>(null);
	const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

	useEffect(() => {
		fetchGroups();
		fetchPermissions();
	}, []);

	const fetchGroups = async () => {
		try {
			const data = await getPermissionGroups();
			setGroups(data);
		} catch (e) {
			console.error(e);
		} finally {
			setLoading(false);
		}
	};

	const fetchPermissions = async () => {
		try {
			const config = await getPermissionsConfig();
			setPermissionGroups(config.groups);
		} catch (e) {
			console.error(e);
		}
	};

	const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		const formData = new FormData(e.currentTarget);

		try {
			if (editingGroup) {
				const data: UpdatePermissionGroupDto = {
					group_key: formData.get("group_key") as string,
					group_name: formData.get("group_name") as string,
					description: formData.get("description") as string || undefined,
					permissions: selectedPermissions,
					sort_order: Number(formData.get("sort_order")) || 0,
					status: Number(formData.get("status")) || 1,
				};
				await updatePermissionGroup(editingGroup.id, data);
				handleSuccess("更新成功");
			} else {
				const data: CreatePermissionGroupDto = {
					group_key: formData.get("group_key") as string,
					group_name: formData.get("group_name") as string,
					description: formData.get("description") as string || undefined,
					permissions: selectedPermissions,
					sort_order: Number(formData.get("sort_order")) || 0,
					status: Number(formData.get("status")) || 1,
				};
				await createPermissionGroup(data);
				handleSuccess("创建成功");
			}
			setShowModal(false);
			setEditingGroup(null);
			setSelectedPermissions([]);
			fetchGroups();
		} catch (e) {
			handleError(e, "保存失败");
		}
	};

	const handleEdit = (group: OAuthPermissionGroup) => {
		setEditingGroup(group);
		try {
			const permissions = JSON.parse(group.permissions || "[]") as string[];
			setSelectedPermissions(permissions);
		} catch (e) {
			setSelectedPermissions([]);
		}
		setShowModal(true);
	};

	const handleDelete = async (id: number) => {
		if (!confirm("确定删除此权限组吗？删除后将无法恢复！")) return;
		try {
			await deletePermissionGroup(id);
			handleSuccess("删除成功");
			fetchGroups();
		} catch (e) {
			handleError(e, "删除失败");
		}
	};

	const handleAdd = () => {
		setEditingGroup(null);
		setSelectedPermissions([]);
		setShowModal(true);
	};

	const togglePermission = (permKey: string) => {
		setSelectedPermissions((prev) =>
			prev.includes(permKey) ? prev.filter((p) => p !== permKey) : [...prev, permKey]
		);
	};

	return (
		<div style={{ padding: "20px", maxWidth: "1400px", margin: "0 auto" }}>
			<div style={{ marginBottom: "20px" }}>
				<PermissionButton
					permission="oauth:group:create"
					onClick={handleAdd}
					icon={<PlusOutlined />}
				>
					新增权限组
				</PermissionButton>
			</div>

			{loading ? (
				<div>加载中...</div>
			) : (
				<table style={{ width: "100%", borderCollapse: "collapse" }}>
					<thead>
						<tr style={{ background: "#f5f5f5" }}>
							<th style={{ padding: "12px", textAlign: "left", borderBottom: "1px solid #ddd" }}>ID</th>
							<th style={{ padding: "12px", textAlign: "left", borderBottom: "1px solid #ddd" }}>权限组标识</th>
							<th style={{ padding: "12px", textAlign: "left", borderBottom: "1px solid #ddd" }}>权限组名称</th>
							<th style={{ padding: "12px", textAlign: "left", borderBottom: "1px solid #ddd" }}>描述</th>
							<th style={{ padding: "12px", textAlign: "left", borderBottom: "1px solid #ddd" }}>权限数量</th>
							<th style={{ padding: "12px", textAlign: "left", borderBottom: "1px solid #ddd" }}>排序</th>
							<th style={{ padding: "12px", textAlign: "left", borderBottom: "1px solid #ddd" }}>状态</th>
							<th style={{ padding: "12px", textAlign: "left", borderBottom: "1px solid #ddd" }}>创建时间</th>
							<th style={{ padding: "12px", textAlign: "left", borderBottom: "1px solid #ddd" }}>操作</th>
						</tr>
					</thead>
					<tbody>
						{groups.map((group) => {
							let permCount = 0;
							try {
								permCount = JSON.parse(group.permissions || "[]").length;
							} catch (e) {
								permCount = 0;
							}

							return (
								<tr key={group.id}>
									<td style={{ padding: "12px", borderBottom: "1px solid #eee" }}>{group.id}</td>
									<td style={{ padding: "12px", borderBottom: "1px solid #eee" }}>
										<code style={{ padding: "2px 6px", background: "#f5f5f5", borderRadius: "4px", fontSize: "12px" }}>
											{group.group_key}
										</code>
									</td>
									<td style={{ padding: "12px", borderBottom: "1px solid #eee" }}>
										<strong>{group.group_name}</strong>
									</td>
									<td style={{ padding: "12px", borderBottom: "1px solid #eee", color: "#666" }}>
										{group.description || "-"}
									</td>
									<td style={{ padding: "12px", borderBottom: "1px solid #eee" }}>
										<span style={{ padding: "2px 8px", borderRadius: "4px", background: "#e6f7ff", fontSize: "12px" }}>
											{permCount} 个权限
										</span>
									</td>
									<td style={{ padding: "12px", borderBottom: "1px solid #eee" }}>{group.sort_order}</td>
									<td style={{ padding: "12px", borderBottom: "1px solid #eee" }}>
										<span
											style={{
												padding: "2px 8px",
												borderRadius: "4px",
												background: group.status ? "#52c41a" : "#f5222d",
												color: "white",
												fontSize: "12px"
											}}
										>
											{group.status ? "正常" : "禁用"}
										</span>
									</td>
									<td style={{ padding: "12px", borderBottom: "1px solid #eee" }}>
										{group.created_at ? new Date(group.created_at).toLocaleString("zh-CN") : "-"}
									</td>
									<td style={{ padding: "12px", borderBottom: "1px solid #eee" }}>
										<PermissionButton
											permission="oauth:group:update"
											onClick={() => handleEdit(group)}
											style={{ padding: "4px 12px", marginRight: "4px" }}
										>
											编辑
										</PermissionButton>
										<PermissionButton
											permission="oauth:group:delete"
											onClick={() => handleDelete(group.id)}
											style={{ padding: "4px 12px" }}
										>
											删除
										</PermissionButton>
									</td>
								</tr>
							);
						})}
					</tbody>
				</table>
			)}

			{/* 创建/编辑弹窗 */}
			{showModal && (
				<div
					style={{
						position: "fixed",
						top: 0,
						left: 0,
						right: 0,
						bottom: 0,
						background: "rgba(0,0,0,0.5)",
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						zIndex: 1000
					}}
				>
					<div
						style={{
							background: "white",
							padding: "24px",
							borderRadius: "8px",
							width: "700px",
							maxWidth: "90%",
							maxHeight: "90vh",
							overflowY: "auto"
						}}
					>
						<h2 style={{ marginTop: 0 }}>{editingGroup ? "编辑权限组" : "新增权限组"}</h2>
						<form onSubmit={handleSave}>
							<div style={{ marginBottom: "16px" }}>
								<label style={{ display: "block", marginBottom: "8px" }}>权限组标识 *</label>
								<input
									name="group_key"
									defaultValue={editingGroup?.group_key}
									disabled={!!editingGroup}
									required
									style={{ width: "100%", padding: "8px", border: "1px solid #ddd", borderRadius: "4px" }}
								/>
								<small style={{ color: "#888" }}>唯一标识，创建后不可修改（如: user_read, r2_full）</small>
							</div>
							<div style={{ marginBottom: "16px" }}>
								<label style={{ display: "block", marginBottom: "8px" }}>权限组名称 *</label>
								<input
									name="group_name"
									defaultValue={editingGroup?.group_name}
									required
									style={{ width: "100%", padding: "8px", border: "1px solid #ddd", borderRadius: "4px" }}
								/>
							</div>
							<div style={{ marginBottom: "16px" }}>
								<label style={{ display: "block", marginBottom: "8px" }}>描述</label>
								<textarea
									name="description"
									defaultValue={editingGroup?.description || ""}
									style={{ width: "100%", padding: "8px", border: "1px solid #ddd", borderRadius: "4px", minHeight: "60px" }}
								/>
							</div>
							<div style={{ marginBottom: "16px" }}>
								<label style={{ display: "block", marginBottom: "8px" }}>权限列表 *</label>
								<small style={{ color: "#888" }}>选择该权限组包含的权限</small>
								<div
									style={{
										maxHeight: "300px",
										overflowY: "auto",
										padding: "16px",
										background: "#f9f9f9",
										borderRadius: "4px",
										border: "1px solid #ddd",
										marginTop: "8px"
									}}
								>
									{permissionGroups.map((group) => (
										<div key={group.name} style={{ marginBottom: "16px" }}>
											<h4 style={{ margin: "0 0 8px 0", fontSize: "14px", fontWeight: "bold", color: "#1890ff" }}>
												{group.name}
											</h4>
											{group.permissions.map((perm) => (
												<label
													key={perm.key}
													style={{
														display: "inline-flex",
														alignItems: "center",
														padding: "4px 8px",
														marginRight: "12px",
														marginBottom: "4px",
														cursor: "pointer",
														border: "1px solid #e0e0e0",
														borderRadius: "4px",
														background: selectedPermissions.includes(perm.key) ? "#e6f7ff" : "white"
													}}
												>
													<input
														type="checkbox"
														checked={selectedPermissions.includes(perm.key)}
														onChange={() => togglePermission(perm.key)}
														style={{ marginRight: "6px" }}
													/>
													<span style={{ fontSize: "12px" }}>{perm.name}</span>
												</label>
											))}
										</div>
									))}
								</div>
								<div style={{ marginTop: "8px", fontSize: "12px", color: "#666" }}>
									已选择 {selectedPermissions.length} 个权限
								</div>
							</div>
							<div style={{ marginBottom: "16px" }}>
								<label style={{ display: "block", marginBottom: "8px" }}>排序</label>
								<input
									name="sort_order"
									type="number"
									defaultValue={editingGroup?.sort_order ?? 0}
									style={{ width: "100%", padding: "8px", border: "1px solid #ddd", borderRadius: "4px" }}
								/>
							</div>
							<div style={{ marginBottom: "16px" }}>
								<label style={{ display: "block", marginBottom: "8px" }}>状态</label>
								<select
									name="status"
									defaultValue={editingGroup?.status ?? 1}
									style={{ width: "100%", padding: "8px", border: "1px solid #ddd", borderRadius: "4px" }}
								>
									<option value="1">正常</option>
									<option value="0">禁用</option>
								</select>
							</div>
							<div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
								<button
									type="button"
									onClick={() => {
										setShowModal(false);
										setEditingGroup(null);
										setSelectedPermissions([]);
									}}
									style={{ padding: "8px 16px", background: "#ccc", border: "none", borderRadius: "4px", cursor: "pointer" }}
								>
									取消
								</button>
								<button
									type="submit"
									style={{ padding: "8px 16px", background: "#1890ff", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}
								>
									保存
								</button>
							</div>
						</form>
					</div>
				</div>
			)}
		</div>
	);
}
