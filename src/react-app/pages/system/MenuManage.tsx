import React, { useEffect, useState } from "react";
import { menuService } from "../../services";
import type { Menu } from "../../services";
import PermissionButton from "../../components/PermissionButton";

export default function MenuManage() {
	const [menus, setMenus] = useState<Menu[]>([]);
	const [loading, setLoading] = useState(true);
	const [editingMenu, setEditingMenu] = useState<Menu | null>(null);
	const [showModal, setShowModal] = useState(false);
	const [parentOptions, setParentOptions] = useState<Menu[]>([]);

	useEffect(() => {
		fetchMenus();
	}, []);

	const fetchMenus = async () => {
		try {
			const data = await menuService.list();
			setMenus(data);
			// 构建父菜单选项
			const buildParentOptions = (menuList: Menu[]): Menu[] => {
				const result: Menu[] = [];
				for (const menu of menuList) {
					result.push(menu);
					if (menu.children) {
						result.push(...buildParentOptions(menu.children));
					}
				}
				return result;
			};
			setParentOptions(buildParentOptions(data));
		} catch (e) {
			console.error(e);
		} finally {
			setLoading(false);
		}
	};

	const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		const formData = new FormData(e.currentTarget);
		const menuData: any = {
			parent_id: Number(formData.get("parent_id") || 0),
			menu_name: formData.get("menu_name"),
			menu_type: formData.get("menu_type"),
			route_path: formData.get("route_path"),
			component_path: formData.get("component_path"),
			redirect: formData.get("redirect"),
			query_param: formData.get("query_param"),
			is_frame: Number(formData.get("is_frame") || 0),
			is_cache: Number(formData.get("is_cache") || 0),
			menu_visible: Number(formData.get("menu_visible") || 1),
			menu_status: Number(formData.get("menu_status") || 1),
			icon: formData.get("icon"),
			sort_order: Number(formData.get("sort_order") || 0),
			permission: formData.get("permission"),
		};

		try {
			if (editingMenu && editingMenu.id > 0) {
				await menuService.update(editingMenu.id, menuData);
			} else {
				await menuService.create(menuData);
			}
			setShowModal(false);
			setEditingMenu(null);
			fetchMenus();
		} catch (e: any) {
			console.error(e);
			alert(e.message || "保存失败");
		}
	};

	const handleEdit = (menu: Menu) => {
		setEditingMenu(menu);
		setShowModal(true);
	};

	const handleDelete = async (id: number) => {
		if (!confirm("确定删除此菜单吗？")) return;
		try {
			await menuService.delete(id);
			fetchMenus();
		} catch (e: any) {
			console.error(e);
			alert(e.message || "删除失败");
		}
	};

	const handleAdd = (parentId = 0) => {
		setEditingMenu({ id: 0, parent_id: parentId, menu_name: "", menu_type: "C", route_path: null, component_path: null, icon: null, sort_order: 0, permission: null, menu_visible: 1, menu_status: 1 } as Menu);
		setShowModal(true);
	};

	const getMenuTypeLabel = (type: string) => {
		switch (type) {
			case "M": return "目录";
			case "C": return "菜单";
			case "F": return "按钮";
			default: return type;
		}
	};

	const getMenuTypeColor = (type: string) => {
		switch (type) {
			case "M": return "#1890ff";
			case "C": return "#52c41a";
			case "F": return "#faad14";
			default: return "#888";
		}
	};

	const renderMenuTree = (menuList: Menu[], level = 0) => {
		return menuList.map((menu) => (
			<React.Fragment key={menu.id}>
				<tr>
					<td style={{ padding: "12px", borderBottom: "1px solid #eee" }}>
						<span style={{ paddingLeft: level * 20 }}>{menu.id}</span>
					</td>
					<td style={{ padding: "12px", borderBottom: "1px solid #eee" }}>
						<span style={{ paddingLeft: level * 20 }}>
							{menu.parent_id > 0 && <span style={{ color: "#ccc", marginRight: "8px" }}>├</span>}
							{menu.menu_name}
						</span>
					</td>
					<td style={{ padding: "12px", borderBottom: "1px solid #eee" }}>
						<span style={{ padding: "2px 8px", borderRadius: "4px", background: getMenuTypeColor(menu.menu_type), color: "white", fontSize: "12px" }}>
							{getMenuTypeLabel(menu.menu_type)}
						</span>
					</td>
					<td style={{ padding: "12px", borderBottom: "1px solid #eee" }}>
						<code style={{ fontSize: "12px" }}>{menu.route_path || "-"}</code>
					</td>
					<td style={{ padding: "12px", borderBottom: "1px solid #eee" }}>
						<code style={{ fontSize: "12px" }}>{menu.component_path || "-"}</code>
					</td>
					<td style={{ padding: "12px", borderBottom: "1px solid #eee" }}>{menu.icon || "-"}</td>
					<td style={{ padding: "12px", borderBottom: "1px solid #eee" }}>{menu.sort_order}</td>
					<td style={{ padding: "12px", borderBottom: "1px solid #eee" }}>
						<span style={{ padding: "2px 8px", borderRadius: "4px", background: menu.menu_status ? "#52c41a" : "#f5222d", color: "white", fontSize: "12px" }}>
							{menu.menu_status ? "正常" : "停用"}
						</span>
					</td>
					<td style={{ padding: "12px", borderBottom: "1px solid #eee" }}>
						<PermissionButton permission="system:menu:edit" onClick={() => handleEdit(menu)} style={{ padding: "4px 8px", marginRight: "4px", fontSize: "12px" }}>
							编辑
						</PermissionButton>
						<PermissionButton permission="system:menu:add" onClick={() => handleAdd(menu.id)} style={{ padding: "4px 8px", marginRight: "4px", fontSize: "12px", background: "#52c41a" }}>
							新增子菜单
						</PermissionButton>
						<PermissionButton permission="system:menu:delete" onClick={() => handleDelete(menu.id)} style={{ padding: "4px 8px", fontSize: "12px" }}>
							删除
						</PermissionButton>
					</td>
				</tr>
				{menu.children && renderMenuTree(menu.children, level + 1)}
			</React.Fragment>
		));
	};

	return (
		<div style={{ padding: "20px", maxWidth: "1400px", margin: "0 auto" }}>
			<div style={{ marginBottom: "20px" }}>
				<PermissionButton permission="system:menu:add" onClick={() => handleAdd(0)}>
					新增根菜单
				</PermissionButton>
			</div>

			{loading ? (
				<div>加载中...</div>
			) : (
				<table style={{ width: "100%", borderCollapse: "collapse" }}>
					<thead>
						<tr style={{ background: "#f5f5f5" }}>
							<th style={{ padding: "12px", textAlign: "left", borderBottom: "1px solid #ddd" }}>ID</th>
							<th style={{ padding: "12px", textAlign: "left", borderBottom: "1px solid #ddd" }}>菜单名称</th>
							<th style={{ padding: "12px", textAlign: "left", borderBottom: "1px solid #ddd" }}>类型</th>
							<th style={{ padding: "12px", textAlign: "left", borderBottom: "1px solid #ddd" }}>路由路径</th>
							<th style={{ padding: "12px", textAlign: "left", borderBottom: "1px solid #ddd" }}>组件路径</th>
							<th style={{ padding: "12px", textAlign: "left", borderBottom: "1px solid #ddd" }}>图标</th>
							<th style={{ padding: "12px", textAlign: "left", borderBottom: "1px solid #ddd" }}>排序</th>
							<th style={{ padding: "12px", textAlign: "left", borderBottom: "1px solid #ddd" }}>状态</th>
							<th style={{ padding: "12px", textAlign: "left", borderBottom: "1px solid #ddd" }}>操作</th>
						</tr>
					</thead>
					<tbody>
						{renderMenuTree(menus)}
					</tbody>
				</table>
			)}

			{/* 菜单编辑弹窗 */}
			{showModal && (
				<div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
					<div style={{ background: "white", padding: "24px", borderRadius: "8px", width: "500px", maxWidth: "90%", maxHeight: "90vh", overflowY: "auto" }}>
						<h2 style={{ marginTop: 0 }}>{editingMenu?.id ? "编辑菜单" : "新增菜单"}</h2>
						<form onSubmit={handleSave}>
							<div style={{ marginBottom: "16px" }}>
								<label style={{ display: "block", marginBottom: "8px" }}>父菜单</label>
								<select name="parent_id" defaultValue={editingMenu?.parent_id ?? 0} style={{ width: "100%", padding: "8px", border: "1px solid #ddd", borderRadius: "4px" }}>
									<option value="0">根菜单</option>
									{parentOptions.map((m) => (
										<option key={m.id} value={m.id}>{m.menu_name}</option>
									))}
								</select>
							</div>
							<div style={{ marginBottom: "16px" }}>
								<label style={{ display: "block", marginBottom: "8px" }}>菜单名称 *</label>
								<input name="menu_name" defaultValue={editingMenu?.menu_name} required style={{ width: "100%", padding: "8px", border: "1px solid #ddd", borderRadius: "4px" }} />
							</div>
							<div style={{ marginBottom: "16px" }}>
								<label style={{ display: "block", marginBottom: "8px" }}>菜单类型 *</label>
								<select name="menu_type" defaultValue={editingMenu?.menu_type || "C"} style={{ width: "100%", padding: "8px", border: "1px solid #ddd", borderRadius: "4px" }}>
									<option value="M">目录 (M)</option>
									<option value="C">菜单 (C)</option>
									<option value="F">按钮 (F)</option>
								</select>
							</div>
							<div style={{ marginBottom: "16px" }}>
								<label style={{ display: "block", marginBottom: "8px" }}>路由路径</label>
								<input name="route_path" defaultValue={editingMenu?.route_path || ""} placeholder="如: /menu/user" style={{ width: "100%", padding: "8px", border: "1px solid #ddd", borderRadius: "4px" }} />
							</div>
							<div style={{ marginBottom: "16px" }}>
								<label style={{ display: "block", marginBottom: "8px" }}>组件路径</label>
								<input name="component_path" defaultValue={editingMenu?.component_path || ""} placeholder="如: menu/UserManage" style={{ width: "100%", padding: "8px", border: "1px solid #ddd", borderRadius: "4px" }} />
							</div>
							<div style={{ marginBottom: "16px" }}>
								<label style={{ display: "block", marginBottom: "8px" }}>重定向</label>
								<input name="redirect" defaultValue={editingMenu?.redirect || ""} placeholder="如: /menu" style={{ width: "100%", padding: "8px", border: "1px solid #ddd", borderRadius: "4px" }} />
							</div>
							<div style={{ marginBottom: "16px" }}>
								<label style={{ display: "block", marginBottom: "8px" }}>路由参数</label>
								<input name="query_param" defaultValue={editingMenu?.query_param || ""} placeholder="如: {{'id': 1}}" style={{ width: "100%", padding: "8px", border: "1px solid #ddd", borderRadius: "4px" }} />
							</div>
							<div style={{ marginBottom: "16px" }}>
								<label style={{ display: "flex", alignItems: "center", gap: "8px" }}>
									<input type="checkbox" name="is_frame" value="1" defaultChecked={!!editingMenu?.is_frame} />
									是否为外链
								</label>
							</div>
							<div style={{ marginBottom: "16px" }}>
								<label style={{ display: "flex", alignItems: "center", gap: "8px" }}>
									<input type="checkbox" name="is_cache" value="1" defaultChecked={!!editingMenu?.is_cache} />
									是否不缓存
								</label>
							</div>
							<div style={{ marginBottom: "16px" }}>
								<label style={{ display: "block", marginBottom: "8px" }}>图标</label>
								<input name="icon" defaultValue={editingMenu?.icon || ""} placeholder="如: User" style={{ width: "100%", padding: "8px", border: "1px solid #ddd", borderRadius: "4px" }} />
							</div>
							<div style={{ marginBottom: "16px" }}>
								<label style={{ display: "block", marginBottom: "8px" }}>排序</label>
								<input name="sort_order" type="number" defaultValue={editingMenu?.sort_order ?? 0} style={{ width: "100%", padding: "8px", border: "1px solid #ddd", borderRadius: "4px" }} />
							</div>
							<div style={{ marginBottom: "16px" }}>
								<label style={{ display: "block", marginBottom: "8px" }}>权限标识</label>
								<input name="permission" defaultValue={editingMenu?.permission || ""} placeholder="如: system:user:list" style={{ width: "100%", padding: "8px", border: "1px solid #ddd", borderRadius: "4px" }} />
							</div>
							<div style={{ marginBottom: "16px" }}>
								<label style={{ display: "flex", alignItems: "center", gap: "8px" }}>
									<input type="checkbox" name="menu_visible" value="0" defaultChecked={editingMenu?.menu_visible === 0} />
									隐藏菜单
								</label>
							</div>
							<div style={{ marginBottom: "16px" }}>
								<label style={{ display: "block", marginBottom: "8px" }}>状态</label>
								<select name="menu_status" defaultValue={editingMenu?.menu_status ?? 1} style={{ width: "100%", padding: "8px", border: "1px solid #ddd", borderRadius: "4px" }}>
									<option value="1">正常</option>
									<option value="0">停用</option>
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
