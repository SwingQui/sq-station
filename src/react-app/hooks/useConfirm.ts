/**
 * 确认对话框 Hook
 * 统一管理确认对话框的显示和回调
 */

import { useCallback } from "react";
import { Modal } from "antd";

export interface UseConfirmReturn {
	confirm: (message: string, onConfirm: () => void | Promise<void>, options?: ConfirmOptions) => void;
}

export interface ConfirmOptions {
	title?: string;
	okText?: string;
	cancelText?: string;
	onCancel?: () => void;
}

/**
 * 确认对话框 Hook
 *
 * @example
 * ```tsx
 * const confirm = useConfirm();
 *
 * const handleDelete = (id: number) => {
 *   confirm("确定要删除吗？", async () => {
 *     await deleteUser(id);
 *     message.success("删除成功");
 *   });
 * };
 *
 * <Button danger onClick={() => handleDelete(user.id)}>删除</Button>
 * ```
 */
export function useConfirm(): UseConfirmReturn {
	const confirm = useCallback((
		message: string,
		onConfirm: () => void | Promise<void>,
		options?: ConfirmOptions
	) => {
		Modal.confirm({
			title: options?.title || "确认操作",
			content: message,
			okText: options?.okText || "确定",
			cancelText: options?.cancelText || "取消",
			onOk: async () => {
				await onConfirm();
			},
			onCancel: options?.onCancel,
		});
	}, []);

	return { confirm };
}

/**
 * 删除确认 Hook
 * 专门用于删除操作的确认
 *
 * @example
 * ```tsx
 * const deleteConfirm = useDeleteConfirm();
 *
 * <Button danger onClick={() => deleteConfirm("用户", async () => {
 *   await deleteUser(id);
 *   refresh();
 * })}>删除</Button>
 * ```
 */
export function useDeleteConfirm(): UseConfirmReturn {
	const confirm = useCallback((
		itemName: string,
		onConfirm: () => void | Promise<void>,
		options?: Omit<ConfirmOptions, "title">
	) => {
		Modal.confirm({
			title: "删除确认",
			content: `确定要删除"${itemName}"吗？删除后将无法恢复。`,
			okText: "确定",
			cancelText: "取消",
			okButtonProps: { danger: true },
			onOk: async () => {
				await onConfirm();
			},
			onCancel: options?.onCancel,
		});
	}, []);

	return { confirm };
}
