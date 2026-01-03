import { useEffect, useState } from "react";
import { userService } from "../../services";
import type { User } from "../../services";
import PermissionButton from "../../components/PermissionButton";

export default function UserManage() {
	const [users, setUsers] = useState<User[]>([]);
	const [loading, setLoading] = useState(true);
	const [editingUser, setEditingUser] = useState<User | null>(null);
	const [showModal, setShowModal] = useState(false);

	useEffect(() => {
		fetchUsers();
	}, []);

	const fetchUsers = async () => {
		try {
			const data = await userService.list();
			setUsers(data);
		} catch (e) {
			console.error(e);
			alert("加载失败");
		} finally {
			setLoading(false);
		}
	};

	const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		const formData = new FormData(e.currentTarget);
		const userData: any = {
			username: formData.get("username"),
			password: formData.get("password"),
			nickname: formData.get("nickname"),
			email: formData.get("email"),
			phone: formData.get("phone"),
			status: Number(formData.get("status") || 1),
		};

		try {
			if (editingUser) {
				await userService.update(editingUser.id, userData);
			} else {
				await userService.create(userData);
			}
			setShowModal(false);
			setEditingUser(null);
			fetchUsers();
		} catch (e: any) {
			console.error(e);
			alert(e.message || "保存失败");
		}
	};

	const handleEdit = (user: User) => {
		setEditingUser(user);
		setShowModal(true);
	};

	const handleDelete = async (id: number) => {
		if (!confirm("确定删除此用户吗？")) return;
		try {
			await userService.delete(id);
			fetchUsers();
		} catch (e: any) {
			console.error(e);
			alert(e.message || "删除失败");
		}
	};

	const handleAdd = () => {
		setEditingUser(null);
		setShowModal(true);
	};

	return (
		<div style={{ padding: "20px", maxWidth: "1200px", margin: "0 auto" }}>
			<div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
				<h1>用户管理</h1>
				<PermissionButton permission="system:user:add" onClick={handleAdd}>
					新增用户
				</PermissionButton>
			</div>

			{loading ? (
				<div>加载中...</div>
			) : (
				<table style={{ width: "100%", borderCollapse: "collapse" }}>
					<thead>
						<tr style={{ background: "#f5f5f5" }}>
							<th style={{ padding: "12px", textAlign: "left", borderBottom: "1px solid #ddd" }}>ID</th>
							<th style={{ padding: "12px", textAlign: "left", borderBottom: "1px solid #ddd" }}>用户名</th>
							<th style={{ padding: "12px", textAlign: "left", borderBottom: "1px solid #ddd" }}>昵称</th>
							<th style={{ padding: "12px", textAlign: "left", borderBottom: "1px solid #ddd" }}>邮箱</th>
							<th style={{ padding: "12px", textAlign: "left", borderBottom: "1px solid #ddd" }}>手机</th>
							<th style={{ padding: "12px", textAlign: "left", borderBottom: "1px solid #ddd" }}>状态</th>
							<th style={{ padding: "12px", textAlign: "left", borderBottom: "1px solid #ddd" }}>创建时间</th>
							<th style={{ padding: "12px", textAlign: "left", borderBottom: "1px solid #ddd" }}>操作</th>
						</tr>
					</thead>
					<tbody>
						{users.map((user) => (
							<tr key={user.id}>
								<td style={{ padding: "12px", borderBottom: "1px solid #eee" }}>{user.id}</td>
								<td style={{ padding: "12px", borderBottom: "1px solid #eee" }}>{user.username}</td>
								<td style={{ padding: "12px", borderBottom: "1px solid #eee" }}>{user.nickname || "-"}</td>
								<td style={{ padding: "12px", borderBottom: "1px solid #eee" }}>{user.email || "-"}</td>
								<td style={{ padding: "12px", borderBottom: "1px solid #eee" }}>{user.phone || "-"}</td>
								<td style={{ padding: "12px", borderBottom: "1px solid #eee" }}>
									<span style={{ padding: "2px 8px", borderRadius: "4px", background: user.status ? "#52c41a" : "#f5222d", color: "white", fontSize: "12px" }}>
										{user.status ? "正常" : "禁用"}
									</span>
								</td>
								<td style={{ padding: "12px", borderBottom: "1px solid #eee" }}>{new Date(user.created_at).toLocaleString("zh-CN")}</td>
								<td style={{ padding: "12px", borderBottom: "1px solid #eee" }}>
									<PermissionButton permission="system:user:edit" onClick={() => handleEdit(user)} style={{ padding: "4px 12px", marginRight: "8px" }}>
										编辑
									</PermissionButton>
									<PermissionButton permission="system:user:delete" onClick={() => handleDelete(user.id)} style={{ padding: "4px 12px" }}>
										删除
									</PermissionButton>
								</td>
							</tr>
						))}
					</tbody>
				</table>
			)}

			{showModal && (
				<div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
					<div style={{ background: "white", padding: "24px", borderRadius: "8px", width: "400px", maxWidth: "90%" }}>
						<h2 style={{ marginTop: 0 }}>{editingUser ? "编辑用户" : "新增用户"}</h2>
						<form onSubmit={handleSave}>
							<div style={{ marginBottom: "16px" }}>
								<label style={{ display: "block", marginBottom: "8px" }}>用户名 *</label>
								<input name="username" defaultValue={editingUser?.username} required style={{ width: "100%", padding: "8px", border: "1px solid #ddd", borderRadius: "4px" }} />
							</div>
							<div style={{ marginBottom: "16px" }}>
								<label style={{ display: "block", marginBottom: "8px" }}>密码{editingUser ? " (留空不修改)" : " *"}</label>
								<input name="password" type="password" required={!editingUser} style={{ width: "100%", padding: "8px", border: "1px solid #ddd", borderRadius: "4px" }} />
							</div>
							<div style={{ marginBottom: "16px" }}>
								<label style={{ display: "block", marginBottom: "8px" }}>昵称</label>
								<input name="nickname" defaultValue={editingUser?.nickname || ""} style={{ width: "100%", padding: "8px", border: "1px solid #ddd", borderRadius: "4px" }} />
							</div>
							<div style={{ marginBottom: "16px" }}>
								<label style={{ display: "block", marginBottom: "8px" }}>邮箱</label>
								<input name="email" type="email" defaultValue={editingUser?.email || ""} style={{ width: "100%", padding: "8px", border: "1px solid #ddd", borderRadius: "4px" }} />
							</div>
							<div style={{ marginBottom: "16px" }}>
								<label style={{ display: "block", marginBottom: "8px" }}>手机</label>
								<input name="phone" defaultValue={editingUser?.phone || ""} style={{ width: "100%", padding: "8px", border: "1px solid #ddd", borderRadius: "4px" }} />
							</div>
							<div style={{ marginBottom: "16px" }}>
								<label style={{ display: "block", marginBottom: "8px" }}>状态</label>
								<select name="status" defaultValue={editingUser?.status ?? 1} style={{ width: "100%", padding: "8px", border: "1px solid #ddd", borderRadius: "4px" }}>
									<option value="1">正常</option>
									<option value="0">禁用</option>
								</select>
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
		</div>
	);
}
