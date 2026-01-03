/**
 * 通用树形数据处理工具
 */

export interface TreeConfig {
	idKey?: string;           // ID 字段名，默认 'id'
	parentIdKey?: string;     // 父 ID 字段名，默认 'parent_id'
	childrenKey?: string;     // children 字段名，默认 'children'
	sortKey?: string;         // 排序字段名，默认 'sort_order'
	rootParentValue?: any;    // 根节点的父 ID 值，默认 0
}

/**
 * 清理树形结构中的空 children
 * 递归删除空的 children 数组，让 Ant Design Table 不显示展开按钮
 *
 * @param treeData 树形数据
 * @param childrenKey children 字段名，默认 'children'
 * @returns 清理后的树形数据
 *
 * @example
 * const data = [
 *   { id: 1, name: '菜单1', children: [] },
 *   { id: 2, name: '菜单2', children: [{ id: 3, name: '子菜单', children: [] }] }
 * ];
 * const cleaned = cleanEmptyChildren(data);
 * // 结果：
 * // [
 * //   { id: 1, name: '菜单1' },           // children 被删除
 * //   { id: 2, name: '菜单2', children: [{ id: 3, name: '子菜单' }] }
 * // ]
 */
export function cleanEmptyChildren<T extends Record<string, any>>(
	treeData: T[],
	childrenKey: string = 'children'
): T[] {
	return treeData.map(item => {
		const node = { ...item } as any;
		const children = node[childrenKey];

		if (children && Array.isArray(children) && children.length > 0) {
			// 递归清理子节点
			const cleanedChildren = cleanEmptyChildren(children, childrenKey);
			node[childrenKey] = cleanedChildren;

			// 如果清理后 children 为空，删除该属性
			if (cleanedChildren.length === 0) {
				delete node[childrenKey];
			}
		} else {
			// 删除空的 children 属性（包括 undefined、null、空数组）
			delete node[childrenKey];
		}

		return node as T;
	});
}

/**
 * 将扁平数组转换为树形结构（通用）
 *
 * @param flatData 扁平数据数组
 * @param config 配置项
 * @returns 树形结构数据
 */
export function buildTree<T extends Record<string, any>>(
	flatData: T[],
	config: TreeConfig = {}
): T[] {
	const {
		idKey = 'id',
		parentIdKey = 'parent_id',
		childrenKey = 'children',
		sortKey = 'sort_order',
		rootParentValue = 0
	} = config;

	const map = new Map<any, any>();
	const roots: T[] = [];

	// 创建所有节点的副本
	for (const item of flatData) {
		map.set(item[idKey], { ...item });
	}

	// 建立父子关系
	for (const item of flatData) {
		const node = map.get(item[idKey])!;
		const parentId = item[parentIdKey];

		if (!parentId || parentId === rootParentValue) {
			roots.push(node);
		} else {
			const parent = map.get(parentId);
			if (parent) {
				if (!parent[childrenKey]) {
					parent[childrenKey] = [];
				}
				parent[childrenKey].push(node);
			}
		}
	}

	// 排序（如果指定了排序字段）
	if (sortKey) {
		const sortNodes = (nodes: any[]) => {
			nodes.sort((a, b) => (a[sortKey] || 0) - (b[sortKey] || 0));
			nodes.forEach(node => {
				if (node[childrenKey] && node[childrenKey].length > 0) {
					sortNodes(node[childrenKey]);
				}
			});
		};
		sortNodes(roots);
	}

	return roots as T[];
}
