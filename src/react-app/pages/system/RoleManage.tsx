import { useEffect, useState } from "react";

interface Role {
	id: number;
	role_name: string;
	role_key: string;
	sort_order: number;
	status: number;
	remark: string | null;
	created_at: string;
}

interface Menu {
	id: number;
	menu_name: string;
	menu_type: string;
	children?: Menu[];
}

export default function RoleManage() {
	const [roles, setRoles] = useState<Role[]>([]);
	const [menus, setMenus] = useState<Menu[]>([]);
	const [loading, setLoading] = useState(true);
	const [editingRole, setEditingRole] = useState<Role | null>(null);
	const [showModal, setShowModal] = useState(false);
	const [showMenuModal, setShowMenuModal] = useState(false);
	const [selectedRole, setSelectedRole] = useState<Role | null>(null);
	const [selectedMenus, setSelectedMenus] = useState<number[]>([]);

	useEffect(() => {
		fetchRoles();
		fetchMenus();
	}, []);

	const fetchRoles = async () => {
		try {
			const res = await fetch("/api/roles");
			const data = await res.json();
			setRoles(data.roles || []);
		} catch (e) {
			console.error(e);
		} finally {
			setLoading(false);
		}
	};

	const fetchMenus = async () => {
		try {
			const res = await fetch("/api/menus");
			const data = await res.json();
			setMenus(data.menus || []);
		} catch (e) {
			console.error(e);
		}
	};

	const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		const formData = new FormData(e.currentTarget);
		const roleData = {
			role_name: formData.get("role_name"),
			role_key: formData.get("role_key"),
			sort_order: Number(formData.get("sort_order") || 0),
			status: Number(formData.get("status") || 1),
			remark: formData.get("remark"),
		};

		try {
			const url = editingRole ? `/api/roles/${editingRole.id}` : "/api/roles";
			const method = editingRole ? "PUT" : "POST";
			await fetch(url, {
				method,
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(roleData),
			});
			setShowModal(false);
			setEditingRole(null);
			fetchRoles();
		} catch (e) {
			console.error(e);
			alert("保存失败");
		}
	};

	const handleEdit = (role: Role) => {
		setEditingRole(role);
		setShowModal(true);
	};

	const handleDelete = async (id: number) => {
		if (!confirm("确定删除此角色吗？")) return;
		try {
			await fetch(`/api/roles/${id}`, { method: "DELETE" });
			fetchRoles();
		} catch (e) {
			console.error(e);
			alert("删除失败");
		}
	};

	const handleAdd = () => {
		setEditingRole(null);
		setShowModal(true);
	};

	const handleMenuAssign = async (role: Role) => {
		setSelectedRole(role);
		// 获取角色已分配的菜单
		try {
			const res = await fetch(`/api/roles/${role.id}/menus`);
			const data = await res.json();
			const menuIds = data.menus.map((m: Menu) => m.id);
			setSelectedMenus(menuIds);
			setShowMenuModal(true);
		} catch (e) {
			console.error(e);
		}
	};

	const handleSaveMenus = async () => {
		if (!selectedRole) return;
		try {
			await fetch(`/api/roles/${selectedRole.id}/menus`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ menuIds: selectedMenus }),
			});
			setShowMenuModal(false);
			setSelectedRole(null);
			alert("菜单分配成功");
		} catch (e) {
			console.error(e);
			alert("保存失败");
		}
	};

	const toggleMenu = (menuId: number) => {
		setSelectedMenus((prev) =>
			prev.includes(menuId) ? prev.filter((id) => id !== menuId) : [...prev, menuId]
		);
	};

	const renderMenuTree = (menuList: Menu[], level = 0) => {
		return menuList.map((menu) => (
			<div key={menu.id} style={{ marginLeft: level * 20 }}>
				<label style={{ display: "flex", alignItems: "center", padding: "4px 0" }}>
					<input
						type="checkbox"
						checked={selectedMenus.includes(menu.id)}
						onChange={() => toggleMenu(menu.id)}
						style={{ marginRight: "8px" }}
					/>
					<span style={{ fontSize: level === 0 ? "14px" : "13px" }}>
						{menu.menu_name} ({menu.menu_type === "M" ? "目录" : menu.menu_type === "C" ? "菜单" : "按钮"})
					</span>
				</label>
				{menu.children && renderMenuTree(menu.children, level + 1)}
			</div>
		));
	};

	return (
		<div style={{ padding: "20px", maxWidth: "1200px", margin: "0 auto" }}>
			<div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
				<h1>角色管理</h1>
				<button onClick={handleAdd} style={{ padding: "8px 16px", background: "#1890ff", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}>
					新增角色
				</button>
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
									<button onClick={() => handleEdit(role)} style={{ padding: "4px 12px", marginRight: "8px", background: "#1890ff", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}>
										编辑
									</button>
									<button onClick={() => handleMenuAssign(role)} style={{ padding: "4px 12px", marginRight: "8px", background: "#52c41a", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}>
										菜单
									</button>
									<button onClick={() => handleDelete(role.id)} style={{ padding: "4px 12px", background: "#ff4d4f", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}>
										删除
									</button>
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

			{/* 菜单分配弹窗 */}
			{showMenuModal && (
				<div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
					<div style={{ background: "white", padding: "24px", borderRadius: "8px", width: "500px", maxWidth: "90%" }}>
						<h2 style={{ marginTop: 0 }}>分配菜单 - {selectedRole?.role_name}</h2>
						<div style={{ maxHeight: "400px", overflowY: "auto", padding: "16px", background: "#f9f9f9", borderRadius: "4px" }}>
							{renderMenuTree(menus)}
						</div>
						<div style={{ display: "flex", gap: "8px", justifyContent: "flex-end", marginTop: "16px" }}>
							<button type="button" onClick={() => setShowMenuModal(false)} style={{ padding: "8px 16px", background: "#ccc", border: "none", borderRadius: "4px", cursor: "pointer" }}>
								取消
							</button>
							<button type="button" onClick={handleSaveMenus} style={{ padding: "8px 16px", background: "#1890ff", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}>
								保存
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
