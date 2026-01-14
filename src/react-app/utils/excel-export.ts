/**
 * Excel 导出工具
 * 使用 ExcelJS 库将数据导出为 Excel 文件
 * ExcelJS 是更安全、更活跃维护的 Excel 处理库
 */

import ExcelJS from 'exceljs';

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
	/** 列宽（字符数） */
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
export async function exportToExcel(options: ExcelExportOptions): Promise<void> {
	const { sheetName = "Sheet1", filename = "export", columns, data } = options;

	// 创建工作簿
	const workbook = new ExcelJS.Workbook();
	const worksheet = workbook.addWorksheet(sheetName);

	// 定义边框样式
	const borderStyle = {
		style: 'thin' as const,
		color: { argb: 'FF000000' },
	};

	const cellBorder = {
		top: borderStyle,
		left: borderStyle,
		bottom: borderStyle,
		right: borderStyle,
	};

	// 设置列定义（包括表头和宽度）
	worksheet.columns = columns.map(col => ({
		header: col.header,
		key: col.field,
		width: col.width || 15,
	}));

	// 添加数据行
	data.forEach(row => {
		const rowData: Record<string, any> = {};
		columns.forEach(col => {
			const value = row[col.field];
			// 使用格式化函数或直接使用值
			rowData[col.field] = col.formatter ? col.formatter(value, row) : (value ?? '');
		});
		const newRow = worksheet.addRow(rowData);
		// 为数据行的每个单元格添加边框和对齐
		newRow.eachCell({ includeEmpty: true }, (cell) => {
			cell.border = cellBorder;
			cell.alignment = { vertical: 'middle', horizontal: 'center' };
		});
	});

	// 设置表头样式（只给有内容的单元格）
	const headerRow = worksheet.getRow(1);
	headerRow.eachCell({ includeEmpty: false }, (cell, colNumber) => {
		cell.border = cellBorder;
		cell.font = { bold: true };
		cell.alignment = { vertical: 'middle', horizontal: 'center' };
	});

	// 确保表头行高度适当
	headerRow.height = 25;

	// 生成文件名（添加时间戳）
	const timestamp = new Date().toISOString().slice(0, 19).replace(/[-:T]/g, "");
	const fullFilename = `${filename}_${timestamp}.xlsx`;

	// 导出文件（浏览器环境）
	const buffer = await workbook.xlsx.writeBuffer();
	const blob = new Blob([buffer], {
		type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
	});

	// 创建下载链接
	const url = window.URL.createObjectURL(blob);
	const link = document.createElement('a');
	link.href = url;
	link.download = fullFilename;
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
	window.URL.revokeObjectURL(url);
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

/**
 * 从 Excel 文件读取数据（安全导入）
 * @param file 文件对象
 * @param options 读取选项
 * @returns 解析后的数据
 */
export interface ImportOptions {
	/** 工作表名称或索引（默认第一个工作表） */
	sheet?: string | number;
	/** 是否包含表头（默认 true） */
	hasHeader?: boolean;
	/** 起始行（从 1 开始，默认 1） */
	startRow?: number;
}

export interface ImportResult<T = any> {
	/** 数据行 */
	data: T[];
	/** 工作表名称 */
	sheetName: string;
	/** 总行数 */
	totalRows: number;
}

/**
 * 从 Excel 文件读取数据
 * @param file 文件对象或 ArrayBuffer
 * @param options 读取选项
 * @returns 解析后的数据
 */
export async function importFromExcel<T = any>(
	file: File | ArrayBuffer,
	options: ImportOptions = {}
): Promise<ImportResult<T>> {
	const { sheet = 0, hasHeader = true, startRow = 1 } = options;

	const workbook = new ExcelJS.Workbook();
	let data: any[] = [];

	// 处理不同的输入类型
	if (file instanceof File) {
		const arrayBuffer = await file.arrayBuffer();
		await workbook.xlsx.load(arrayBuffer);
	} else {
		await workbook.xlsx.load(file);
	}

	// 获取工作表
	const worksheet = typeof sheet === 'string'
		? workbook.getWorksheet(sheet)
		: workbook.worksheets[sheet];

	if (!worksheet) {
		throw new Error(`工作表 "${sheet}" 不存在`);
	}

	// 获取表头（如果有）
	const headers: string[] = [];
	if (hasHeader) {
		const headerRow = worksheet.getRow(startRow);
		headerRow.eachCell((cell, colNumber) => {
			headers[colNumber - 1] = cell.text;
		});
	}

	// 读取数据行
	const startDataRow = hasHeader ? startRow + 1 : startRow;
	let totalRows = 0;

	worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
		if (rowNumber >= startDataRow) {
			const rowData: any = {};
			row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
				const value = cell.value;
				if (hasHeader && headers[colNumber - 1]) {
					rowData[headers[colNumber - 1]] = value;
				} else {
					rowData[`col${colNumber}`] = value;
				}
			});
			data.push(rowData);
			totalRows++;
		}
	});

	return {
		data: data as T[],
		sheetName: worksheet.name,
		totalRows,
	};
}
