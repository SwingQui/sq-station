import { useEffect, useState } from "react";
import { PlusOutlined, KeyOutlined, CopyOutlined } from "@ant-design/icons";
import {
	getOAuthClients,
	createOAuthClient,
	updateOAuthClient,
	deleteOAuthClient,
	resetOAuthClientSecret,
	type OAuthClient,
	type CreateOAuthClientDto,
	type UpdateOAuthClientDto
} from "../../../api/oauth";
import { getPermissionGroups, type OAuthPermissionGroup } from "../../../api/oauth-permission-group";
import PermissionButton from "../../../components/PermissionButton";
import { handleError, handleSuccess } from "../../../utils/error-handler";

export default function OAuthClientManage() {
	const [clients, setClients] = useState<OAuthClient[]>([]);
	const [oauthPermissionGroups, setOauthPermissionGroups] = useState<OAuthPermissionGroup[]>([]);
	const [loading, setLoading] = useState(true);
	const [showModal, setShowModal] = useState(false);
	const [showSecretModal, setShowSecretModal] = useState(false);
	const [editingClient, setEditingClient] = useState<OAuthClient | null>(null);
	const [newSecret, setNewSecret] = useState("");
	const [selectedPermissionGroupIds, setSelectedPermissionGroupIds] = useState<number[]>([]);

	useEffect(() => {
		fetchClients();
		fetchOAuthPermissionGroups();
	}, []);

	const fetchClients = async () => {
		try {
			const data = await getOAuthClients();
			setClients(data);
		} catch (e) {
			console.error(e);
		} finally {
			setLoading(false);
		}
	};

	const fetchOAuthPermissionGroups = async () => {
		try {
			const data = await getPermissionGroups();
			setOauthPermissionGroups(data);
		} catch (e) {
			console.error(e);
		}
	};

	const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		const formData = new FormData(e.currentTarget);

		// 权限组必选
		if (selectedPermissionGroupIds.length === 0) {
			handleError(new Error("请至少选择一个权限组"), "验证失败");
			return;
		}

		try {
			if (editingClient) {
				const updateData: UpdateOAuthClientDto = {
					client_name: formData.get("client_name") as string,
					description: formData.get("description") as string || undefined,
					permission_group_ids: selectedPermissionGroupIds,
					expires_in: Number(formData.get("expires_in")) || 3600,
					status: Number(formData.get("status") || 1),
				};
				await updateOAuthClient(editingClient.id, updateData);
				handleSuccess("更新成功");
			} else {
				const createData: CreateOAuthClientDto = {
					client_name: formData.get("client_name") as string,
					description: formData.get("description") as string || undefined,
					permission_group_ids: selectedPermissionGroupIds,
					expires_in: Number(formData.get("expires_in")) || 3600,
					status: Number(formData.get("status") || 1),
				};
				const result = await createOAuthClient(createData);
				handleSuccess("创建成功");
				// 显示新创建的密钥
				setNewSecret(result.client_secret);
				setShowSecretModal(true);
			}
			setShowModal(false);
			setEditingClient(null);
			setSelectedPermissionGroupIds([]);
			fetchClients();
		} catch (e) {
			handleError(e, "保存失败");
		}
	};

	const handleEdit = (client: OAuthClient) => {
		setEditingClient(client);
		try {
			const groupIds = client.permission_group_ids ? JSON.parse(client.permission_group_ids) as number[] : [];
			setSelectedPermissionGroupIds(groupIds);
		} catch (e) {
			setSelectedPermissionGroupIds([]);
		}
		setShowModal(true);
	};

	const handleDelete = async (id: number) => {
		if (!confirm("确定删除此客户端吗？删除后将无法恢复！")) return;
		try {
			await deleteOAuthClient(id);
			handleSuccess("删除成功");
			fetchClients();
		} catch (e) {
			handleError(e, "删除失败");
		}
	};

	const handleAdd = () => {
		setEditingClient(null);
		setSelectedPermissionGroupIds([]);
		setShowModal(true);
	};

	const handleResetSecret = async (client: OAuthClient) => {
		if (!confirm(`确定重置客户端 "${client.client_name}" 的密钥吗？重置后原密钥将立即失效！`)) return;
		try {
			const result = await resetOAuthClientSecret(client.id);
			setNewSecret(result.client_secret);
			setShowSecretModal(true);
			handleSuccess("密钥已重置");
		} catch (e) {
			handleError(e, "重置失败");
		}
	};

	const copyToClipboard = (text: string) => {
		navigator.clipboard.writeText(text).then(() => {
			handleSuccess("已复制到剪贴板");
		});
	};

	const togglePermissionGroup = (groupId: number) => {
		setSelectedPermissionGroupIds((prev) =>
			prev.includes(groupId) ? prev.filter((id) => id !== groupId) : [...prev, groupId]
		);
	};

	return (
		<div style={{ padding: "20px", maxWidth: "1400px", margin: "0 auto" }}>
			<div style={{ marginBottom: "20px" }}>
				<PermissionButton
					permission="oauth:client:create"
					onClick={handleAdd}
					icon={<PlusOutlined />}
				>
					新增客户端
				</PermissionButton>
			</div>

			{loading ? (
				<div>加载中...</div>
			) : (
				<table style={{ width: "100%", borderCollapse: "collapse" }}>
					<thead>
						<tr style={{ background: "#f5f5f5" }}>
							<th style={{ padding: "12px", textAlign: "left", borderBottom: "1px solid #ddd" }}>ID</th>
							<th style={{ padding: "12px", textAlign: "left", borderBottom: "1px solid #ddd" }}>客户端名称</th>
							<th style={{ padding: "12px", textAlign: "left", borderBottom: "1px solid #ddd" }}>Client ID</th>
							<th style={{ padding: "12px", textAlign: "left", borderBottom: "1px solid #ddd" }}>描述</th>
							<th style={{ padding: "12px", textAlign: "left", borderBottom: "1px solid #ddd" }}>权限组</th>
							<th style={{ padding: "12px", textAlign: "left", borderBottom: "1px solid #ddd" }}>有效期</th>
							<th style={{ padding: "12px", textAlign: "left", borderBottom: "1px solid #ddd" }}>状态</th>
							<th style={{ padding: "12px", textAlign: "left", borderBottom: "1px solid #ddd" }}>创建时间</th>
							<th style={{ padding: "12px", textAlign: "left", borderBottom: "1px solid #ddd" }}>操作</th>
						</tr>
					</thead>
					<tbody>
						{clients.map((client) => {
							let groupCount = 0;
							try {
								groupCount = JSON.parse(client.permission_group_ids || "[]").length;
							} catch (e) {
								groupCount = 0;
							}

							return (
								<tr key={client.id}>
									<td style={{ padding: "12px", borderBottom: "1px solid #eee" }}>{client.id}</td>
									<td style={{ padding: "12px", borderBottom: "1px solid #eee" }}>
										<strong>{client.client_name}</strong>
									</td>
									<td style={{ padding: "12px", borderBottom: "1px solid #eee" }}>
										<code style={{ padding: "2px 6px", background: "#f5f5f5", borderRadius: "4px", fontSize: "12px" }}>
											{client.client_id}
											<button
												onClick={() => copyToClipboard(client.client_id)}
												style={{ marginLeft: "4px", border: "none", background: "transparent", cursor: "pointer" }}
												title="复制"
											>
												<CopyOutlined />
											</button>
										</code>
									</td>
									<td style={{ padding: "12px", borderBottom: "1px solid #eee", color: "#666" }}>
										{client.description || "-"}
									</td>
									<td style={{ padding: "12px", borderBottom: "1px solid #eee" }}>
										<span style={{ padding: "2px 8px", borderRadius: "4px", background: "#e6f7ff", fontSize: "12px" }}>
											{groupCount} 个权限组
										</span>
									</td>
									<td style={{ padding: "12px", borderBottom: "1px solid #eee" }}>
										{client.expires_in}s ({Math.floor(client.expires_in / 60)}分钟)
									</td>
									<td style={{ padding: "12px", borderBottom: "1px solid #eee" }}>
										<span
											style={{
												padding: "2px 8px",
												borderRadius: "4px",
												background: client.status ? "#52c41a" : "#f5222d",
												color: "white",
												fontSize: "12px"
											}}
										>
											{client.status ? "正常" : "禁用"}
										</span>
									</td>
									<td style={{ padding: "12px", borderBottom: "1px solid #eee" }}>
										{client.created_at ? new Date(client.created_at).toLocaleString("zh-CN") : "-"}
									</td>
									<td style={{ padding: "12px", borderBottom: "1px solid #eee" }}>
										<PermissionButton
											permission="oauth:client:update"
											onClick={() => handleEdit(client)}
											style={{ padding: "4px 12px", marginRight: "4px" }}
										>
											编辑
										</PermissionButton>
										<PermissionButton
											permission="oauth:client:resetSecret"
											onClick={() => handleResetSecret(client)}
											style={{ padding: "4px 12px", marginRight: "4px", background: "#722ed1" }}
											icon={<KeyOutlined />}
										>
											重置密钥
										</PermissionButton>
										<PermissionButton
											permission="oauth:client:delete"
											onClick={() => handleDelete(client.id)}
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
						<h2 style={{ marginTop: 0 }}>{editingClient ? "编辑客户端" : "新增客户端"}</h2>
						<form onSubmit={handleSave}>
							<div style={{ marginBottom: "16px" }}>
								<label style={{ display: "block", marginBottom: "8px" }}>客户端名称 *</label>
								<input
									name="client_name"
									defaultValue={editingClient?.client_name}
									required
									style={{ width: "100%", padding: "8px", border: "1px solid #ddd", borderRadius: "4px" }}
								/>
							</div>
							<div style={{ marginBottom: "16px" }}>
								<label style={{ display: "block", marginBottom: "8px" }}>描述</label>
								<textarea
									name="description"
									defaultValue={editingClient?.description || ""}
									style={{ width: "100%", padding: "8px", border: "1px solid #ddd", borderRadius: "4px", minHeight: "60px" }}
								/>
							</div>
							<div style={{ marginBottom: "16px" }}>
								<label style={{ display: "block", marginBottom: "8px" }}>权限组 * </label>
								<small style={{ color: "#888" }}>选择一个或多个权限组，客户端权限将完全由权限组决定。修改权限组后，所有绑定的客户端权限会自动更新。</small>
								<div
									style={{
										padding: "16px",
										background: "#f9f9f9",
										borderRadius: "4px",
										border: "1px solid #ddd",
										marginTop: "8px"
									}}
								>
									{oauthPermissionGroups.length === 0 ? (
										<div style={{ color: "#999", fontSize: "13px" }}>暂无权限组</div>
									) : (
										<div style={{ display: "flex", flexWrap: "wrap", gap: "12px" }}>
											{oauthPermissionGroups.map((group) => (
												<label
													key={group.id}
													style={{
														display: "inline-flex",
														alignItems: "center",
														padding: "8px 12px",
														cursor: "pointer",
														border: "1px solid #e0e0e0",
														borderRadius: "6px",
														background: selectedPermissionGroupIds.includes(group.id) ? "#e6f7ff" : "white",
														transition: "all 0.2s"
													}}
												>
													<input
														type="checkbox"
														checked={selectedPermissionGroupIds.includes(group.id)}
														onChange={() => togglePermissionGroup(group.id)}
														style={{ marginRight: "8px" }}
													/>
													<div>
														<div style={{ fontWeight: "bold", fontSize: "13px" }}>{group.group_name}</div>
														<div style={{ fontSize: "11px", color: "#666", marginTop: "2px" }}>
															{group.description || "无描述"}
														</div>
													</div>
												</label>
											))}
										</div>
									)}
								</div>
							</div>
							<div style={{ marginBottom: "16px" }}>
								<label style={{ display: "block", marginBottom: "8px" }}>Token 有效期（秒） *</label>
								<input
									name="expires_in"
									type="number"
									defaultValue={editingClient?.expires_in ?? 3600}
									min="60"
									step="60"
									required
									style={{ width: "100%", padding: "8px", border: "1px solid #ddd", borderRadius: "4px" }}
								/>
								<small style={{ color: "#888" }}>建议值: 3600 (1小时), 7200 (2小时), 86400 (24小时)</small>
							</div>
							<div style={{ marginBottom: "16px" }}>
								<label style={{ display: "block", marginBottom: "8px" }}>状态</label>
								<select
									name="status"
									defaultValue={editingClient?.status ?? 1}
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
										setEditingClient(null);
										setSelectedPermissionGroupIds([]);
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

			{/* 密钥显示弹窗 */}
			{showSecretModal && (
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
					<div style={{ background: "white", padding: "24px", borderRadius: "8px", width: "500px", maxWidth: "90%" }}>
						<h2 style={{ marginTop: 0, color: "#faad14" }}>
							<KeyOutlined /> 密钥已生成
						</h2>
						<p style={{ color: "#f5222d", fontWeight: "bold" }}>请立即复制并妥善保存，关闭此窗口后将无法再次查看！</p>
						<div style={{ background: "#f5f5f5", padding: "12px", borderRadius: "4px", marginBottom: "16px" }}>
							<label style={{ display: "block", marginBottom: "8px", fontWeight: "bold" }}>Client Secret:</label>
							<div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
								<code
									style={{
										flex: 1,
										padding: "8px",
										background: "white",
										border: "1px solid #ddd",
										borderRadius: "4px",
										fontSize: "14px",
										wordBreak: "break-all"
									}}
								>
									{newSecret}
								</code>
								<button
									type="button"
									onClick={() => copyToClipboard(newSecret)}
									style={{ padding: "8px 12px", background: "#1890ff", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}
								>
									<CopyOutlined /> 复制
								</button>
							</div>
						</div>
						<button
							type="button"
							onClick={() => {
								setShowSecretModal(false);
								setNewSecret("");
							}}
							style={{ width: "100%", padding: "8px 16px", background: "#1890ff", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}
						>
							我已保存，关闭
						</button>
					</div>
				</div>
			)}
		</div>
	);
}
