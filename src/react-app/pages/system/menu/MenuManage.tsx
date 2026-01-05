import React, { useEffect, useState } from "react";
import { Table, Button, Modal, Form, Input, Select, Space, Popconfirm, message, Tag, Row, Col, Radio } from "antd";
import { PlusOutlined, DeleteOutlined, ExportOutlined, EditOutlined, PlusCircleOutlined } from "@ant-design/icons";
import { getMenuList, createMenu, updateMenu, deleteMenu } from "../../../api/menu";
import type { Menu } from "../../../types";
import PermissionButton from "../../../components/PermissionButton";
import Icon from "../../../components/Icon";
import IconSelect from "../../../components/IconSelect";
import { cleanEmptyChildren } from "../../../utils/data/tree";
import { handleError, handleSuccess } from "../../../utils/error-handler";
import "./MenuManage.css";

interface TableRow extends Menu {
	key?: number;
	children?: TableRow[];
}

export default function MenuManage() {
	const [menus, setMenus] = useState<TableRow[]>([]);
	const [loading, setLoading] = useState(true);
	const [editingMenu, setEditingMenu] = useState<Menu | null>(null);
	const [showModal, setShowModal] = useState(false);
	const [parentOptions, setParentOptions] = useState<Menu[]>([]);
	const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
	const [form] = Form.useForm();

	useEffect(() => {
		fetchMenus();
	}, []);

	const fetchMenus = async () => {
		try {
			const data = await getMenuList();
			// 清理空的 children 数组，让没有子菜单的行不显示展开按钮
			const cleanedData = cleanEmptyChildren(data);
			setMenus(cleanedData as TableRow[]);
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
			handleError(e, "加载菜单失败");
		} finally {
			setLoading(false);
		}
	};

	const handleSave = async () => {
		try {
			const values = await form.validateFields();
			const menuData = {
				...values,
				parent_id: Number(values.parent_id || 0),
				sort_order: Number(values.sort_order || 0),
			};

			if (editingMenu && editingMenu.id > 0) {
				await updateMenu(editingMenu.id, menuData);
				handleSuccess("更新成功");
			} else {
				await createMenu(menuData);
				handleSuccess("创建成功");
			}
			setShowModal(false);
			setEditingMenu(null);
			form.resetFields();
			fetchMenus();
		} catch (e) {
			handleError(e, "保存失败");
		}
	};

	const handleEdit = (menu: Menu) => {
		setEditingMenu(menu);
		form.setFieldsValue(menu);
		setShowModal(true);
	};

	const handleDelete = async (id: number) => {
		try {
			await deleteMenu(id);
			handleSuccess("删除成功");
			fetchMenus();
		} catch (e) {
			handleError(e, "删除失败");
		}
	};

	const handleAdd = (parentId = 0) => {
		setEditingMenu({ id: 0, parent_id: parentId, menu_name: "", menu_type: "C", route_path: null, component_path: null, icon: null, sort_order: 0, permission: null, menu_visible: 1, menu_status: 1 } as Menu);
		form.setFieldsValue({ parent_id: parentId, menu_type: "C", menu_visible: 1, menu_status: 1 });
		setShowModal(true);
	};

	const handleBatchDelete = async () => {
		if (selectedRowKeys.length === 0) {
			message.warning("请先选择要删除的菜单");
			return;
		}
		try {
			for (const id of selectedRowKeys) {
				await deleteMenu(Number(id));
			}
			handleSuccess(`成功删除 ${selectedRowKeys.length} 个菜单`);
			setSelectedRowKeys([]);
			fetchMenus();
		} catch (e) {
			handleError(e, "删除失败");
		}
	};

	const handleExport = () => {
		const data = JSON.stringify(menus, null, 2);
		const blob = new Blob([data], { type: "application/json" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = `menus_${Date.now()}.json`;
		a.click();
		URL.revokeObjectURL(url);
		message.success("导出成功");
	};

	// 计算菜单层级深度
	const getMenuLevel = (record: TableRow, allMenus: TableRow[]): number => {
		const findLevel = (id: number, menus: TableRow[], level: number = 0): number => {
			for (const menu of menus) {
				if (menu.id === id) {
					if (menu.parent_id === 0) return level;
					return findLevel(menu.parent_id, allMenus, level + 1);
				}
				if (menu.children) {
					const found = findLevel(id, menu.children, level);
					if (found >= 0) return found;
				}
			}
			return -1;
		};

		const level = findLevel(record.id, allMenus, 0);
		return level >= 0 ? level : 0;
	};

	const columns = [
		{
			// 独立的展开列
			key: "expand",
			width: 48,
			align: "center" as const,
			render: () => null,
		},
		{
			title: "ID",
			dataIndex: "id",
			width: 48,
			align: "center" as const,
		},
		{
			title: "菜单名称",
			dataIndex: "menu_name",
			width: 150,
			render: (text: string, record: TableRow) => {
				const level = getMenuLevel(record, menus);
				const prefix = "├ ".repeat(level);
				return <span>{prefix}{text}</span>;
			},
		},
		{
			title: "类型",
			dataIndex: "menu_type",
			width: 48,
			align: "center" as const,
			render: (type: string) => {
				const config: Record<string, { color: string; text: string }> = {
					M: { color: "blue", text: "目录" },
					C: { color: "green", text: "菜单" },
					F: { color: "orange", text: "按钮" },
				};
				const { color, text } = config[type] || { color: "default", text: type };
				return <Tag color={color}>{text}</Tag>;
			},
		},
		{
			title: "路由路径",
			dataIndex: "route_path",
			width: 150,
			align: "center" as const,
			render: (path: string | null) => {
				if (!path) return "-";
				return (
					<code
						style={{
							cursor: "pointer",
							overflow: "hidden",
							textOverflow: "ellipsis",
							whiteSpace: "nowrap",
							display: "block",
							maxWidth: "150px",
						}}
						title={path}
						onClick={() => {
							navigator.clipboard.writeText(path);
							message.success("已复制: " + path);
						}}
					>
						{path}
					</code>
				);
			},
		},
		{
			title: "组件路径",
			dataIndex: "component_path",
			width: 150,
			align: "center" as const,
			render: (path: string | null) => {
				if (!path) return "-";
				const fullPath = `/${path}`;
				return (
					<code
						style={{
							cursor: "pointer",
							overflow: "hidden",
							textOverflow: "ellipsis",
							whiteSpace: "nowrap",
							display: "block",
							maxWidth: "150px",
						}}
						title={fullPath}
						onClick={() => {
							navigator.clipboard.writeText(fullPath);
							message.success("已复制: " + fullPath);
						}}
					>
						{fullPath}
					</code>
				);
			},
		},
		{
			title: "图标",
			dataIndex: "icon",
			width: 60,
			align: "center" as const,
			render: (icon: string | null) => icon ? <Icon name={icon} /> : "-",
		},
		{
			title: "权限",
			dataIndex: "permission",
			width: 150,
			align: "center" as const,
			render: (permission: string | null) => {
				if (!permission) return "-";
				return (
					<code
						style={{
							cursor: "pointer",
							overflow: "hidden",
							textOverflow: "ellipsis",
							whiteSpace: "nowrap",
							display: "block",
							maxWidth: "150px",
						}}
						title={permission}
						onClick={() => {
							navigator.clipboard.writeText(permission);
							message.success("已复制: " + permission);
						}}
					>
						{permission}
					</code>
				);
			},
		},
		{
			title: "排序",
			dataIndex: "sort_order",
			width: 48,
			align: "center" as const,
		},
		{
			title: "状态",
			dataIndex: "menu_status",
			width: 48,
			align: "center" as const,
			render: (status: number) => (
				<Tag color={status ? "success" : "error"}>
					{status ? "正常" : "停用"}
				</Tag>
			),
		},
		{
			title: "操作",
			key: "action",
			width: 180,
			align: "center" as const,
			fixed: "right" as const,
			render: (_: any, record: TableRow) => (
				<Space size="small">
					<PermissionButton permission="system:menu:add" onClick={() => handleAdd(record.id)} icon={<PlusCircleOutlined />} type="primary" />
					<PermissionButton permission="system:menu:edit" onClick={() => handleEdit(record)} icon={<EditOutlined />} />
					<Popconfirm title="确定删除此菜单吗？" onConfirm={() => handleDelete(record.id)}>
						<PermissionButton permission="system:menu:delete" danger icon={<DeleteOutlined />} />
					</Popconfirm>
				</Space>
			),
		},
	];

	return (
		<div style={{ padding: "24px" }}>
			<div style={{ marginBottom: "16px", display: "flex", gap: "8px" }}>
				<PermissionButton permission="system:menu:add" onClick={() => handleAdd(0)} icon={<PlusOutlined />} type="primary">
					新增根菜单
				</PermissionButton>
				<Popconfirm title="确定删除选中的菜单吗？" onConfirm={handleBatchDelete} disabled={selectedRowKeys.length === 0}>
					<Button icon={<DeleteOutlined />} disabled={selectedRowKeys.length === 0} danger>
						批量删除 ({selectedRowKeys.length})
					</Button>
				</Popconfirm>
				<Button icon={<ExportOutlined />} onClick={handleExport} type="primary" style={{ backgroundColor: "#52c41a" }}>
					导出
				</Button>
			</div>

			<Table
				className="menu-manage-table"
				rowKey="id"
				columns={columns}
				dataSource={menus}
				loading={loading}
				rowSelection={{
					selectedRowKeys,
					onChange: (keys) => setSelectedRowKeys(keys),
				}}
				pagination={false}
				defaultExpandAllRows
				size="small"
				bordered
				scroll={{ x: 1090 }}
			/>

			<Modal
				title={editingMenu?.id ? "编辑菜单" : "新增菜单"}
				open={showModal}
				onCancel={() => {
					setShowModal(false);
					setEditingMenu(null);
					form.resetFields();
				}}
				onOk={handleSave}
				width={600}
			>
				<Form form={form}>
					<Row gutter={16}>
						<Col span={8}>
							<Form.Item label="父菜单" name="parent_id" labelCol={{ span: 24 }}>
								<Select placeholder="选择父菜单">
									<Select.Option value={0}>根菜单</Select.Option>
									{parentOptions.map((m) => (
										<Select.Option key={m.id} value={m.id}>{m.menu_name}</Select.Option>
									))}
								</Select>
							</Form.Item>
						</Col>
						<Col span={8}>
							<Form.Item label="菜单名称" name="menu_name" rules={[{ required: true, message: "请输入菜单名称" }]} labelCol={{ span: 24 }}>
								<Input placeholder="请输入菜单名称" />
							</Form.Item>
						</Col>
						<Col span={8}>
							<Form.Item label="菜单类型" name="menu_type" rules={[{ required: true, message: "请选择菜单类型" }]} labelCol={{ span: 24 }}>
								<Select>
									<Select.Option value="M">目录 (M)</Select.Option>
									<Select.Option value="C">菜单 (C)</Select.Option>
									<Select.Option value="F">按钮 (F)</Select.Option>
								</Select>
							</Form.Item>
						</Col>
					</Row>
					<Row gutter={16}>
						<Col span={8}>
							<Form.Item label="路由路径" name="route_path" labelCol={{ span: 24 }}>
								<Input placeholder="如: /dashboard/system/user" />
							</Form.Item>
						</Col>
						<Col span={8}>
							<Form.Item label="组件路径" name="component_path" labelCol={{ span: 24 }}>
								<Input placeholder="如: system/user/UserManage" />
							</Form.Item>
						</Col>
						<Col span={8}>
							<Form.Item label="重定向" name="redirect" labelCol={{ span: 24 }}>
								<Input placeholder="如: /dashboard" />
							</Form.Item>
						</Col>
					</Row>
					<Row gutter={16}>
						<Col span={8}>
							<Form.Item label="图标" name="icon" labelCol={{ span: 24 }}>
								<IconSelect placeholder="选择图标" />
							</Form.Item>
						</Col>
						<Col span={8}>
							<Form.Item label="排序" name="sort_order" labelCol={{ span: 24 }}>
								<Input type="number" placeholder="请输入排序号" />
							</Form.Item>
						</Col>
						<Col span={8}>
							<Form.Item label="状态" name="menu_status" labelCol={{ span: 24 }}>
								<Radio.Group buttonStyle="solid">
									<Radio.Button value={1}>正常</Radio.Button>
									<Radio.Button value={0}>停用</Radio.Button>
								</Radio.Group>
							</Form.Item>
						</Col>
					</Row>
					<Row gutter={16}>
						<Col span={12}>
							<Form.Item label="路由参数" name="query_param" labelCol={{ span: 24 }}>
								<Input placeholder='如: {"id": 1}' />
							</Form.Item>
						</Col>
						<Col span={12}>
							<Form.Item label="权限标识" name="permission" labelCol={{ span: 24 }}>
								<Input placeholder="如: system:user:list" />
							</Form.Item>
						</Col>
					</Row>
					<Row gutter={16}>
						<Col span={8}>
							<Form.Item label="是否为外链" name="is_frame" labelCol={{ span: 24 }}>
								<Radio.Group buttonStyle="solid">
									<Radio.Button value={1}>是</Radio.Button>
									<Radio.Button value={0}>否</Radio.Button>
								</Radio.Group>
							</Form.Item>
						</Col>
						<Col span={8}>
							<Form.Item label="是否缓存" name="is_cache" labelCol={{ span: 24 }}>
								<Radio.Group buttonStyle="solid">
									<Radio.Button value={1}>缓存</Radio.Button>
									<Radio.Button value={0}>不缓存</Radio.Button>
								</Radio.Group>
							</Form.Item>
						</Col>
						<Col span={8}>
							<Form.Item label="菜单显隐" name="menu_visible" labelCol={{ span: 24 }}>
								<Radio.Group buttonStyle="solid">
									<Radio.Button value={1}>显示</Radio.Button>
									<Radio.Button value={0}>隐藏</Radio.Button>
								</Radio.Group>
							</Form.Item>
						</Col>
					</Row>
				</Form>
			</Modal>
		</div>
	);
}
