/**
 * Excel 导出工具
 * 使用 xlsx 库将数据导出为 Excel 文件
 */

import * as XLSX from "xlsx";

/**
 * Excel 列定义
 */
export interface ExcelColumn {
	/** 列标题 */
	header: string;
	/** 数据字段名 */
	field: string;
	/** 格式化函数 */
	formatter?: (value: any, row: any) => string | number;
	/** 列宽 */
	width?: number;
}

/**
 * Excel 导出配置
 */
export interface ExcelExportOptions {
	/** 工作表名称 */
	sheetName?: string;
	/** 文件名（不含扩展名） */
	filename?: string;
	/** 列定义 */
	columns: ExcelColumn[];
	/** 数据 */
	data: any[];
}

/**
 * 将数据导出为 Excel 文件
 * @param options 导出配置
 */
export function exportToExcel(options: ExcelExportOptions): void {
	const { sheetName = "Sheet1", filename = "export", columns, data } = options;

	// 生成表头和数据行
	const headers = columns.map(col => col.header);
	const rows = data.map(row =>
		columns.map(col => {
			const value = row[col.field];
			return col.formatter ? col.formatter(value, row) : value ?? "";
		})
	);

	// 合并表头和数据
	const worksheetData = [headers, ...rows];

	// 创建工作表
	const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

	// 设置列宽
	const colWidths = columns.map(col => ({
		wch: col.width || 15
	}));
	worksheet["!cols"] = colWidths;

	// 创建工作簿
	const workbook = XLSX.utils.book_new();
	XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

	// 生成文件名（添加时间戳）
	const timestamp = new Date().toISOString().slice(0, 19).replace(/[-:T]/g, "");
	const fullFilename = `${filename}_${timestamp}.xlsx`;

	// 导出文件
	XLSX.writeFile(workbook, fullFilename);
}

/**
 * 扁平化树形数据（用于导出菜单等层级数据）
 * @param data 树形数据
 * @param childrenKey 子节点字段名
 * @returns 扁平化数组
 */
export function flattenTreeData<T extends { children?: T[] }>(
	data: T[],
	childrenKey: keyof T = "children" as any
): Array<T & { __level?: number }> {
	const result: Array<T & { __level?: number }> = [];

	const flatten = (items: T[], level: number = 0) => {
		for (const item of items) {
			const { [childrenKey]: children, ...rest } = item as any;
			result.push({ ...rest, __level: level });
			if (children && children.length > 0) {
				flatten(children, level + 1);
			}
		}
	};

	flatten(data);
	return result;
}

/**
 * 格式化层级显示文本
 * @param text 原始文本
 * @param level 层级深度
 * @param prefix 每层级前缀
 * @returns 格式化后的文本
 */
export function formatLevelText(text: string, level: number, prefix: string = "├ "): string {
	return prefix.repeat(level) + text;
}

/**
 * 导出枚举值映射（用于状态、类型等字段的显示）
 */
export const ExportEnumMaps = {
	/** 菜单类型 */
	menuType: {
		M: "目录",
		C: "菜单",
		F: "按钮",
	},
	/** 菜单状态 */
	menuStatus: {
		0: "停用",
		1: "正常",
	},
	/** 菜单可见性 */
	menuVisible: {
		0: "隐藏",
		1: "显示",
	},
	/** 通用状态 */
	status: {
		0: "禁用",
		1: "正常",
	},
	/** 是否 */
	yesNo: {
		0: "否",
		1: "是",
	},
};
