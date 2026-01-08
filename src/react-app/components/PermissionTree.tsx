/**
 * 权限树组件
 * 从数据库动态加载菜单权限，以树形结构展示
 * 支持父节点全选/取消所有子权限
 * 精确到按钮级别权限
 */

import { useEffect, useState, useRef } from "react";
import { getMenuList } from "../api/menu";
import type { Menu } from "../types";

interface PermissionTreeProps {
	permissions: string[];
	onChange: (perms: string[]) => void;
	cascadeEnabled?: boolean;  // 是否启用父子级联，默认 true
}

/**
 * 获取菜单树下所有有权限的后代
 */
function getAllDescendantPermissions(menu: Menu): string[] {
	const perms: string[] = [];
	if (menu.permission) perms.push(menu.permission);
	if (menu.children) {
		for (const child of menu.children) {
			perms.push(...getAllDescendantPermissions(child));
		}
	}
	return perms;
}

/**
 * 递归渲染权限树节点
 */
function PermissionTreeNode({
	menu,
	level = 0,
	selectedPerms,
	onToggle,
}: {
	menu: Menu;
	level?: number;
	selectedPerms: string[];
	onToggle: (perm: string) => void;
}) {
	// 只显示有权限标识的菜单项
	if (!menu.permission) return null;

	return (
		<div
			key={menu.id}
			style={{
				marginLeft: level > 0 ? `${level * 16}px` : "0",
				marginBottom: "4px",
			}}
		>
			<label
				style={{
					display: "flex",
					alignItems: "center",
					padding: "4px 8px",
					cursor: "pointer",
					borderRadius: "4px",
					transition: "background 0.2s",
					width: "100%",
				}}
				onMouseEnter={(e) => {
					e.currentTarget.style.background = "#f0f0f0";
				}}
				onMouseLeave={(e) => {
					e.currentTarget.style.background = "transparent";
				}}
			>
				<input
					type="checkbox"
					checked={selectedPerms.includes(menu.permission!)}
					onChange={() => onToggle(menu.permission!)}
					style={{ marginRight: "6px" }}
				/>
				<div style={{ flex: 1, display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "13px" }}>
					<span>
						{menu.menu_name}
						{menu.menu_type === "F" && (
							<span style={{ color: "#888", fontSize: "12px", marginLeft: "4px" }}>(按钮)</span>
						)}
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
			</label>
		</div>
	);
}

/**
 * 递归渲染权限树节点（支持任意深度，包括按钮）
 * 返回一个数组，包含当前节点的权限和所有后代权限
 */
function renderPermissionTree({
	menu,
	level,
	selectedPerms,
	onToggle,
	cascadeEnabled = true,
}: {
	menu: Menu;
	level: number;
	selectedPerms: string[];
	onToggle: (perm: string) => void;
	cascadeEnabled?: boolean;
}): React.ReactNode[] {
	const nodes: React.ReactNode[] = [];

	// 检查当前节点是否应该作为可折叠目录
	const shouldRenderAsDirectory =
		menu.menu_type === "M" ||
		(menu.menu_type === "C" && menu.children && menu.children.some((c) => c.permission));

	if (shouldRenderAsDirectory) {
		// 渲染为可折叠目录
		nodes.push(
			<PermissionDirectoryWrapper
				key={menu.id}
				menu={menu}
				selectedPerms={selectedPerms}
				onToggle={onToggle}
				cascadeEnabled={cascadeEnabled}
				level={level}
			/>
		);
	} else {
		// 渲染为平铺复选框
		if (menu.permission) {
			nodes.push(
				<PermissionTreeNode
					key={`${menu.id}-self`}
					menu={menu}
					level={level}
					selectedPerms={selectedPerms}
					onToggle={onToggle}
				/>
			);
		}

		// 递归处理子节点
		if (menu.children) {
			for (const child of menu.children) {
				nodes.push(...renderPermissionTree({
					menu: child,
					level: level + 1,
					selectedPerms,
					onToggle,
					cascadeEnabled,
				}));
			}
		}
	}

	return nodes;
}

/**
 * PermissionDirectory 的包装器，用于在递归渲染中使用
 */
function PermissionDirectoryWrapper({
	menu,
	selectedPerms,
	onToggle,
	level,
	cascadeEnabled = true,
}: {
	menu: Menu;
	selectedPerms: string[];
	onToggle: (perm: string) => void;
	level: number;
	cascadeEnabled?: boolean;
}) {
	return (
		<PermissionDirectoryInner menu={menu} selectedPerms={selectedPerms} onToggle={onToggle} cascadeEnabled={cascadeEnabled} level={level} />
	);
}

/**
 * 递归渲染目录及其子项（带复选框）
 */
function PermissionDirectoryInner({
	menu,
	selectedPerms,
	onToggle,
	onToggleMultiple,
	cascadeEnabled = true,
	level = 0,
}: {
	menu: Menu;
	selectedPerms: string[];
	onToggle: (perm: string) => void;
	onToggleMultiple?: (perms: string[]) => void;
	cascadeEnabled?: boolean;
	level?: number;
}) {
	const [isExpanded, setIsExpanded] = useState(true);
	const checkboxRef = useRef<HTMLInputElement>(null);

	// 获取有权限的子菜单
	const childrenWithPermissions = menu.children?.filter(
		(child) => child.permission || (child.children && child.children.some((c) => c.permission))
	);

	if (!childrenWithPermissions || childrenWithPermissions.length === 0) {
		return null;
	}

	// 获取所有子权限
	const allChildPerms = getAllDescendantPermissions(menu);

	// 计算复选框的选中状态
	const getCheckboxState = (): 'checked' | 'indeterminate' | 'unchecked' => {
		// 如果目录有自己的 permission，检查它是否被选中
		if (menu.permission) {
			const ownPermSelected = selectedPerms.includes(menu.permission);
			// 如果启用级联，还需要检查子权限的状态
			if (cascadeEnabled && allChildPerms.length > 0) {
				const selectedChildCount = allChildPerms.filter(p => selectedPerms.includes(p)).length;
				if (!ownPermSelected && selectedChildCount === 0) return 'unchecked';
				if (ownPermSelected && selectedChildCount === allChildPerms.length) return 'checked';
				return 'indeterminate';
			}
			return ownPermSelected ? 'checked' : 'unchecked';
		}

		// 如果目录没有 permission，只检查子权限（仅在启用级联时）
		if (cascadeEnabled && allChildPerms.length > 0) {
			const selectedChildCount = allChildPerms.filter(p => selectedPerms.includes(p)).length;
			if (selectedChildCount === 0) return 'unchecked';
			if (selectedChildCount === allChildPerms.length) return 'checked';
			return 'indeterminate';
		}

		return 'unchecked';
	};

	const checkboxState = getCheckboxState();

	// 处理复选框变化
	const handleCheckboxChange = (checked: boolean) => {
		// 如果目录有自己的 permission，先处理它
		if (menu.permission) {
			if (checked) {
				// 选择自己的 permission
				if (!selectedPerms.includes(menu.permission)) {
					onToggle(menu.permission);
				}
			} else {
				// 取消选择自己的 permission
				if (selectedPerms.includes(menu.permission)) {
					onToggle(menu.permission);
				}
			}
		}

		// 如果启用级联，处理所有子权限
		if (cascadeEnabled && allChildPerms.length > 0 && onToggleMultiple) {
			if (checked) {
				const newPerms = [...new Set([...selectedPerms, ...allChildPerms])];
				onToggleMultiple(newPerms);
			} else {
				const newPerms = selectedPerms.filter(p => !allChildPerms.includes(p));
				onToggleMultiple(newPerms);
			}
		}
	};

	// 更新复选框的 indeterminate 状态
	useEffect(() => {
		if (checkboxRef.current) {
			checkboxRef.current.indeterminate = checkboxState === 'indeterminate';
		}
	}, [checkboxState]);

	return (
		<div key={menu.id} style={{ marginBottom: "12px" }}>
			{/* 目录标题（带复选框） */}
			<div
				onClick={() => setIsExpanded(!isExpanded)}
				style={{
					display: "flex",
					alignItems: "center",
					justifyContent: "space-between",
					padding: "6px 8px",
					cursor: "pointer",
					background: "#e8f4ff",
					borderRadius: "4px",
					marginBottom: "8px",
					fontWeight: "bold",
					fontSize: "13px",
					userSelect: "none",
				}}
			>
				<div style={{ display: "flex", alignItems: "center" }}>
					{/* 始终显示复选框 */}
					<input
						ref={checkboxRef}
						type="checkbox"
						checked={checkboxState === 'checked'}
						onChange={(e) => {
							e.stopPropagation();
							handleCheckboxChange(e.target.checked);
						}}
						onClick={(e) => e.stopPropagation()}
						style={{ marginRight: "8px" }}
					/>
					<span style={{
						marginRight: "6px",
						fontSize: "14px",
						fontWeight: "bold",
						width: "16px",
						display: "inline-flex",
						justifyContent: "center"
					}}>
						{isExpanded ? "−" : "+"}
					</span>
					<span>{menu.menu_name}</span>
				</div>
				{/* 如果目录有权限标识，显示在右侧 */}
				{menu.permission && (
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
				)}
			</div>

			{/* 子项 */}
			{isExpanded && (
				<div
					style={{
						paddingLeft: "8px",
						borderLeft: "1px solid #e0e0e0",
						marginLeft: "12px",
					}}
				>
					{childrenWithPermissions.map((child) => {
						// 如果是目录，递归渲染
						if (child.menu_type === "M") {
							return (
								<PermissionDirectoryInner
									key={child.id}
									menu={child}
									selectedPerms={selectedPerms}
									onToggle={onToggle}
									onToggleMultiple={onToggleMultiple}
									cascadeEnabled={cascadeEnabled}
									level={0}
								/>
							);
						}
						// 使用递归函数渲染非目录节点（包括按钮）
						return renderPermissionTree({
							menu: child,
							level: level,
							selectedPerms,
							onToggle,
							cascadeEnabled,
						});
					})}
				</div>
			)}
		</div>
	);
}

/**
 * 目录组件（根级别使用）
 */
function PermissionDirectory({
	menu,
	selectedPerms,
	onToggleSingle,
	onToggleMultiple,
	cascadeEnabled = true,
	level = 0,
}: {
	menu: Menu;
	selectedPerms: string[];
	onToggleSingle: (perm: string, checked: boolean) => void;
	onToggleMultiple: (perms: string[]) => void;
	cascadeEnabled?: boolean;
	level?: number;
}) {
	return (
		<PermissionDirectoryInner
			menu={menu}
			selectedPerms={selectedPerms}
			onToggle={(perm) => {
				const checked = !selectedPerms.includes(perm);
				onToggleSingle(perm, checked);
			}}
			onToggleMultiple={onToggleMultiple}
			cascadeEnabled={cascadeEnabled}
			level={level}
		/>
	);
}

export default function PermissionTree({ permissions, onChange, cascadeEnabled = true }: PermissionTreeProps) {
	const [menus, setMenus] = useState<Menu[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const fetchMenus = async () => {
			try {
				const data = await getMenuList();
				setMenus(data);
			} catch (e) {
				console.error("Failed to fetch menus:", e);
			} finally {
				setLoading(false);
			}
		};
		fetchMenus();
	}, []);

	// 处理单个权限切换
	const handleToggleSingle = (perm: string, checked: boolean) => {
		if (checked) {
			onChange([...permissions, perm]);
		} else {
			onChange(permissions.filter((p) => p !== perm));
		}
	};

	// 处理批量权限切换
	const handleToggleMultiple = (newPerms: string[]) => {
		onChange(newPerms);
	};

	if (loading) {
		return <div style={{ padding: "16px", textAlign: "center", color: "#999" }}>加载中...</div>;
	}

	// 只显示根目录（parent_id = 0）
	const rootMenus = menus.filter((m) => m.parent_id === 0);

	// 过滤出有权限子项的根目录
	const rootMenusWithPermissions = rootMenus.filter((root) => {
		return hasPermissionInChildren(root);
	});

	if (rootMenusWithPermissions.length === 0) {
		return <div style={{ padding: "16px", textAlign: "center", color: "#999" }}>暂无权限数据</div>;
	}

	return (
		<div>
			{rootMenusWithPermissions.map((menu) => (
				<PermissionDirectory
					key={menu.id}
					menu={menu}
					selectedPerms={permissions}
					onToggleSingle={handleToggleSingle}
					onToggleMultiple={handleToggleMultiple}
					cascadeEnabled={cascadeEnabled}
				/>
			))}
		</div>
	);
}

/**
 * 检查菜单树中是否有权限标识
 */
function hasPermissionInChildren(menu: Menu): boolean {
	if (menu.permission) return true;
	if (menu.children) {
		return menu.children.some((child) => hasPermissionInChildren(child));
	}
	return false;
}
