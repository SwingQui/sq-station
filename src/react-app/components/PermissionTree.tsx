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
 * 检查父节点的选中状态
 */
type CheckedState = 'checked' | 'indeterminate' | 'unchecked';

function getParentCheckedState(menu: Menu, selectedPerms: string[]): CheckedState {
	const allPerms = getAllDescendantPermissions(menu);
	if (allPerms.length === 0) return 'unchecked';

	const selectedCount = allPerms.filter(p => selectedPerms.includes(p)).length;

	if (selectedCount === 0) return 'unchecked';
	if (selectedCount === allPerms.length) return 'checked';
	return 'indeterminate';
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
					display: "inline-flex",
					alignItems: "center",
					padding: "4px 8px",
					cursor: "pointer",
					borderRadius: "4px",
					transition: "background 0.2s",
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
				<span style={{ fontSize: "13px" }}>
					{menu.menu_name}
					{menu.menu_type === "F" && (
						<span style={{ color: "#888", fontSize: "12px", marginLeft: "4px" }}>(按钮)</span>
					)}
				</span>
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

	// 只在启用级联时计算父节点的选中状态
	const checkedState = cascadeEnabled ? getParentCheckedState(menu, selectedPerms) : 'unchecked';
	const showParentCheckbox = cascadeEnabled;

	// 处理父节点复选框变化
	const handleParentChange = (checked: boolean) => {
		const allPerms = getAllDescendantPermissions(menu);
		if (onToggleMultiple) {
			if (checked) {
				const newPerms = [...new Set([...selectedPerms, ...allPerms])];
				onToggleMultiple(newPerms);
			} else {
				const newPerms = selectedPerms.filter(p => !allPerms.includes(p));
				onToggleMultiple(newPerms);
			}
		}
	};

	// 更新复选框的 indeterminate 状态（只在启用级联时）
	useEffect(() => {
		if (checkboxRef.current && cascadeEnabled) {
			checkboxRef.current.indeterminate = checkedState === 'indeterminate';
		}
	}, [checkedState, cascadeEnabled]);

	return (
		<div key={menu.id} style={{ marginBottom: "12px" }}>
			{/* 目录标题（带复选框） */}
			<div
				onClick={() => setIsExpanded(!isExpanded)}
				style={{
					display: "flex",
					alignItems: "center",
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
				{/* 只在启用级联时显示父节点复选框 */}
				{showParentCheckbox && (
					<input
						ref={checkboxRef}
						type="checkbox"
						checked={checkedState === 'checked'}
						onChange={(e) => {
							e.stopPropagation();
							handleParentChange(e.target.checked);
						}}
						onClick={(e) => e.stopPropagation()}
						style={{ marginRight: "8px" }}
					/>
				)}
				<span style={{ marginRight: "6px", transition: "transform 0.2s", transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)" }}>
					▶
				</span>
				{menu.menu_name}
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
