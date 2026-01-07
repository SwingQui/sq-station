import { useEffect, useState } from "react";
import { PlusOutlined, ExportOutlined } from "@ant-design/icons";
import {
	getOrganizationList,
	createOrganization,
	updateOrganization,
	deleteOrganization,
	getOrganizationPermissions,
	assignOrganizationPermissions,
} from "../../../api/organization";
import type { Organization } from "../../../types";
import PermissionButton from "../../../components/PermissionButton";
import PermissionTree from "../../../components/PermissionTree";
import { handleError, handleSuccess } from "../../../utils/error-handler";
import { exportToExcel, ExportEnumMaps } from "../../../utils/excel-export";

export default function OrganizationManage() {
	const [organizations, setOrganizations] = useState<Organization[]>([]);
	const [loading, setLoading] = useState(true);
	const [editingOrg, setEditingOrg] = useState<Organization | null>(null);
	const [showModal, setShowModal] = useState(false);
	const [showPermModal, setShowPermModal] = useState(false);
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
			handleError(e, "加载组织失败");
		} finally {
			setLoading(false);
		}
	};

	const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		const formData = new FormData(e.currentTarget);
		const orgData: any = {
			org_name: formData.get("org_name"),
			org_code: formData.get("org_code"),
			sort_order: Number(formData.get("sort_order") || 0),
			status: Number(formData.get("status")) || 1,
			remark: formData.get("remark"),
		};

		try {
			if (editingOrg) {
				await updateOrganization(editingOrg.id, orgData);
			} else {
				await createOrganization(orgData);
			}
			handleSuccess(editingOrg ? "更新成功" : "创建成功");
			setShowModal(false);
			setEditingOrg(null);
			fetchOrganizations();
		} catch (e) {
			handleError(e, "保存失败");
		}
	};

	const handleEdit = (org: Organization) => {
		setEditingOrg(org);
		setShowModal(true);
	};

	const handleDelete = async (id: number) => {
		if (!confirm("确定删除此组织吗？")) return;
		try {
			await deleteOrganization(id);
			handleSuccess("删除成功");
			fetchOrganizations();
		} catch (e) {
			handleError(e, "删除失败");
		}
	};

	const handleAdd = () => {
		setEditingOrg(null);
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

	return (
		<div style={{ padding: "20px", maxWidth: "1200px", margin: "0 auto" }}>
			<div style={{ marginBottom: "20px", display: "flex", gap: "8px" }}>
				<PermissionButton permission="system:organization:add" onClick={handleAdd} icon={<PlusOutlined />} type="primary">
					新增组织
				</PermissionButton>
				<PermissionButton permission="system:organization:export" onClick={handleExport} icon={<ExportOutlined />} type="primary" style={{ backgroundColor: "#52c41a" }}>
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
							<th style={{ padding: "12px", textAlign: "left", borderBottom: "1px solid #ddd" }}>组织名称</th>
							<th style={{ padding: "12px", textAlign: "left", borderBottom: "1px solid #ddd" }}>组织编码</th>
							<th style={{ padding: "12px", textAlign: "left", borderBottom: "1px solid #ddd" }}>排序</th>
							<th style={{ padding: "12px", textAlign: "left", borderBottom: "1px solid #ddd" }}>状态</th>
							<th style={{ padding: "12px", textAlign: "left", borderBottom: "1px solid #ddd" }}>备注</th>
							<th style={{ padding: "12px", textAlign: "left", borderBottom: "1px solid #ddd" }}>操作</th>
						</tr>
					</thead>
					<tbody>
						{organizations.map((org) => (
							<tr key={org.id}>
								<td style={{ padding: "12px", borderBottom: "1px solid #eee" }}>{org.id}</td>
								<td style={{ padding: "12px", borderBottom: "1px solid #eee" }}>{org.org_name}</td>
								<td style={{ padding: "12px", borderBottom: "1px solid #eee" }}>
									<code style={{ padding: "2px 6px", background: "#f5f5f5", borderRadius: "4px", fontSize: "12px" }}>{org.org_code}</code>
								</td>
								<td style={{ padding: "12px", borderBottom: "1px solid #eee" }}>{org.sort_order}</td>
								<td style={{ padding: "12px", borderBottom: "1px solid #eee" }}>
									<span style={{ padding: "2px 8px", borderRadius: "4px", background: org.status ? "#52c41a" : "#f5222d", color: "white", fontSize: "12px" }}>
										{org.status ? "正常" : "禁用"}
									</span>
								</td>
								<td style={{ padding: "12px", borderBottom: "1px solid #eee" }}>{org.remark || "-"}</td>
								<td style={{ padding: "12px", borderBottom: "1px solid #eee" }}>
									<PermissionButton permission="system:organization:assign" onClick={() => handleAssignPermissions(org)} style={{ padding: "4px 12px", marginRight: "4px", background: "#722ed1" }}>
										分配权限
									</PermissionButton>
									<PermissionButton permission="system:organization:edit" onClick={() => handleEdit(org)} style={{ padding: "4px 12px", marginRight: "4px" }}>
										编辑
									</PermissionButton>
									<PermissionButton permission="system:organization:delete" onClick={() => handleDelete(org.id)} style={{ padding: "4px 12px" }}>
										删除
									</PermissionButton>
								</td>
							</tr>
						))}
					</tbody>
				</table>
			)}

			{/* 组织编辑弹窗 */}
			{showModal && (
				<div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
					<div style={{ background: "white", padding: "24px", borderRadius: "8px", width: "400px", maxWidth: "90%" }}>
						<h2 style={{ marginTop: 0 }}>{editingOrg ? "编辑组织" : "新增组织"}</h2>
						<form onSubmit={handleSave}>
							<div style={{ marginBottom: "16px" }}>
								<label style={{ display: "block", marginBottom: "8px" }}>组织名称 *</label>
								<input name="org_name" defaultValue={editingOrg?.org_name} required style={{ width: "100%", padding: "8px", border: "1px solid #ddd", borderRadius: "4px" }} />
							</div>
							<div style={{ marginBottom: "16px" }}>
								<label style={{ display: "block", marginBottom: "8px" }}>组织编码 *</label>
								<input name="org_code" defaultValue={editingOrg?.org_code} required style={{ width: "100%", padding: "8px", border: "1px solid #ddd", borderRadius: "4px" }} />
								<small style={{ color: "#888" }}>如: headquarters, branch-1</small>
							</div>
							<div style={{ marginBottom: "16px" }}>
								<label style={{ display: "block", marginBottom: "8px" }}>排序</label>
								<input name="sort_order" type="number" defaultValue={editingOrg?.sort_order ?? 0} style={{ width: "100%", padding: "8px", border: "1px solid #ddd", borderRadius: "4px" }} />
							</div>
							<div style={{ marginBottom: "16px" }}>
								<label style={{ display: "block", marginBottom: "8px" }}>状态</label>
								<select name="status" defaultValue={editingOrg?.status ?? 1} style={{ width: "100%", padding: "8px", border: "1px solid #ddd", borderRadius: "4px" }}>
									<option value="1">正常</option>
									<option value="0">禁用</option>
								</select>
							</div>
							<div style={{ marginBottom: "16px" }}>
								<label style={{ display: "block", marginBottom: "8px" }}>备注</label>
								<textarea name="remark" defaultValue={editingOrg?.remark || ""} style={{ width: "100%", padding: "8px", border: "1px solid #ddd", borderRadius: "4px", minHeight: "60px" }} />
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

			{/* 权限分配弹窗 */}
			{showPermModal && (
				<div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
					<div style={{ background: "white", padding: "24px", borderRadius: "8px", width: "600px", maxWidth: "90%" }}>
						<div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
							<div>
								<h2 style={{ marginTop: 0 }}>分配权限 - {currentOrg?.org_name}</h2>
								<p style={{ color: "#666", fontSize: "14px", marginTop: "-8px", marginBottom: "16px" }}>配置该组织的权限，组织成员将自动继承</p>
							</div>
							<label style={{ display: "flex", alignItems: "center", cursor: "pointer", whiteSpace: "nowrap" }}>
								<input
									type="checkbox"
									checked={cascadeEnabled}
									onChange={(e) => setCascadeEnabled(e.target.checked)}
									style={{ marginRight: "6px" }}
								/>
								<span style={{ fontSize: "13px" }}>启用父子级联勾选</span>
							</label>
						</div>
						<div style={{ maxHeight: "400px", overflowY: "auto", padding: "16px", background: "#f9f9f9", borderRadius: "4px" }}>
							{/* 动态权限树 */}
							<PermissionTree permissions={orgPerms} onChange={setOrgPerms} cascadeEnabled={cascadeEnabled} />
						</div>
						<div style={{ display: "flex", gap: "8px", justifyContent: "flex-end", marginTop: "16px" }}>
							<button type="button" onClick={() => setShowPermModal(false)} style={{ padding: "8px 16px", background: "#ccc", border: "none", borderRadius: "4px", cursor: "pointer" }}>
								取消
							</button>
							<button type="button" onClick={handleSavePermissions} style={{ padding: "8px 16px", background: "#1890ff", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}>
								保存
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
