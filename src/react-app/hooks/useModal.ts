/**
 * 模态框状态管理 Hook
 * 统一管理模态框的显示/隐藏状态和数据
 */

import { useState, useCallback } from "react";

export interface UseModalReturn<T = any> {
	visible: boolean;
	data: T | null;
	open: (data?: T) => void;
	close: () => void;
	toggle: () => void;
	setData: (data: T | null) => void;
}

/**
 * 模态框状态管理 Hook
 *
 * @example
 * ```tsx
 * const modal = useModal<User>();
 *
 * // 打开模态框并传入数据
 * <Button onClick={() => modal.open(user)}>编辑</Button>
 *
 * // 关闭模态框
 * <Modal visible={modal.visible} onClose={modal.close}>
 *   {modal.data && <UserForm data={modal.data} />}
 * </Modal>
 * ```
 */
export function useModal<T = any>(initialData?: T): UseModalReturn<T> {
	const [visible, setVisible] = useState(false);
	const [data, setData] = useState<T | null>(initialData ?? null);

	const open = useCallback((newData?: T) => {
		setData(newData ?? null);
		setVisible(true);
	}, []);

	const close = useCallback(() => {
		setVisible(false);
		// 延迟清空数据，避免关闭动画时数据消失
		setTimeout(() => setData(null), 300);
	}, []);

	const toggle = useCallback(() => {
		setVisible(prev => !prev);
	}, []);

	const setDataValue = useCallback((newData: T | null) => {
		setData(newData);
	}, []);

	return {
		visible,
		data,
		open,
		close,
		toggle,
		setData: setDataValue,
	};
}
