/**
 * 表格数据管理 Hook
 * 统一管理表格的数据、分页、加载状态等
 */

import { useState, useCallback, useEffect } from "react";
import { handleError } from "../utils/error-handler";

export interface PaginationParams {
	current: number;
	pageSize: number;
	total: number;
}

export interface UseTableReturn<T> {
	data: T[];
	loading: boolean;
	pagination: PaginationParams;
	refresh: () => Promise<void>;
	setPage: (page: number) => void;
	setPageSize: (pageSize: number) => void;
}

export interface UseTableOptions<T> {
	fetchFunction: (params: PaginationParams) => Promise<{ data: T[]; total: number }>;
	initialPageSize?: number;
	immediate?: boolean;
}

/**
 * 表格数据管理 Hook
 *
 * @example
 * ```tsx
 * const { data, loading, pagination, refresh, setPage, setPageSize } = useTable({
 *   fetchFunction: async ({ current, pageSize }) => {
 *     const result = await getUserList({ page: current, pageSize });
 *     return { data: result.list, total: result.total };
 *   },
 *   initialPageSize: 10,
 * });
 *
 * <Table
 *   dataSource={data}
 *   loading={loading}
 *   pagination={{
 *     current: pagination.current,
 *     pageSize: pagination.pageSize,
 *     total: pagination.total,
 *     onChange: setPage,
 *     onShowSizeChange: (_, size) => setPageSize(size),
 *   }}
 * />
 * ```
 */
export function useTable<T>(options: UseTableOptions<T>): UseTableReturn<T> {
	const { fetchFunction, initialPageSize = 10, immediate = true } = options;

	const [data, setData] = useState<T[]>([]);
	const [loading, setLoading] = useState(false);
	const [pagination, setPagination] = useState<PaginationParams>({
		current: 1,
		pageSize: initialPageSize,
		total: 0,
	});

	const fetchData = useCallback(async () => {
		setLoading(true);
		try {
			const result = await fetchFunction(pagination);
			setData(result.data);
			setPagination(prev => ({ ...prev, total: result.total }));
		} catch (error) {
			handleError(error, "加载数据失败");
			setData([]);
		} finally {
			setLoading(false);
		}
	}, [fetchFunction, pagination]);

	const refresh = useCallback(async () => {
		await fetchData();
	}, [fetchData]);

	const setPage = useCallback((page: number) => {
		setPagination(prev => ({ ...prev, current: page }));
	}, []);

	const setPageSize = useCallback((pageSize: number) => {
		setPagination(prev => ({ ...prev, pageSize, current: 1 }));
	}, []);

	useEffect(() => {
		if (immediate) {
			fetchData();
		}
	}, [fetchData, immediate, pagination.pageSize, pagination.current]);

	return {
		data,
		loading,
		pagination,
		refresh,
		setPage,
		setPageSize,
	};
}

/**
 * 简化版表格 Hook（适用于前端分页）
 *
 * @example
 * ```tsx
 * const { data, loading, pagination, refresh } = useSimpleTable({
 *   fetchFunction: () => getUserList(),
 *   initialPageSize: 10,
 * });
 * ```
 */
export function useSimpleTable<T>(
	fetchFunction: () => Promise<T[]>,
	initialPageSize: number = 10
): UseTableReturn<T> {
	const [data, setData] = useState<T[]>([]);
	const [loading, setLoading] = useState(false);
	const [pagination, setPagination] = useState<PaginationParams>({
		current: 1,
		pageSize: initialPageSize,
		total: 0,
	});

	const fetchData = useCallback(async () => {
		setLoading(true);
		try {
			const result = await fetchFunction();
			setData(result);
			setPagination(prev => ({ ...prev, total: result.length }));
		} catch (error) {
			handleError(error, "加载数据失败");
			setData([]);
		} finally {
			setLoading(false);
		}
	}, [fetchFunction]);

	const refresh = useCallback(async () => {
		await fetchData();
	}, [fetchData]);

	const setPage = useCallback((page: number) => {
		setPagination(prev => ({ ...prev, current: page }));
	}, []);

	const setPageSize = useCallback((pageSize: number) => {
		setPagination(prev => ({ ...prev, pageSize, current: 1 }));
	}, []);

	// 前端分页数据切片
	const paginatedData = data.slice(
		(pagination.current - 1) * pagination.pageSize,
		pagination.current * pagination.pageSize
	);

	return {
		data: paginatedData,
		loading,
		pagination,
		refresh,
		setPage,
		setPageSize,
	};
}
