/**
 * 自定义 Hooks 统一导出
 * 提供可复用的逻辑封装
 */

// ==================== 权限 Hook ====================
export { usePermission } from "./usePermission";

// ==================== 异步数据 Hook ====================
export { useAsyncData } from "./useAsyncData";
export type { UseAsyncDataResult } from "./useAsyncData";

// ==================== 模态框 Hook ====================
export { useModal } from "./useModal";
export type { UseModalReturn } from "./useModal";

// ==================== 确认对话框 Hook ====================
export { useConfirm, useDeleteConfirm } from "./useConfirm";
export type { UseConfirmReturn, ConfirmOptions } from "./useConfirm";

// ==================== 表格 Hook ====================
export { useTable, useSimpleTable } from "./useTable";
export type { UseTableReturn, PaginationParams, UseTableOptions } from "./useTable";

// ==================== 表单 Hook ====================
export { useForm, useFormSimple } from "./useForm";
export type { UseFormReturn, ValidationRule, UseFormOptions } from "./useForm";
