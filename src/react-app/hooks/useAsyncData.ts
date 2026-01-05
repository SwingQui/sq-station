/**
 * 通用的异步数据获取 Hook
 * 自动处理加载状态、错误状态和数据状态
 */

import { useState, useEffect, useCallback } from "react";
import { handleError } from "../utils/error-handler";

export interface UseAsyncDataResult<T> {
	data: T | null;
	loading: boolean;
	error: string | null;
	refetch: () => Promise<void>;
}

/**
 * 异步数据获取 Hook
 * @param asyncFunction 异步获取数据的函数
 * @param deps 依赖数组，当依赖变化时重新获取数据
 * @param options 配置选项
 * @returns 数据状态和刷新函数
 */
export function useAsyncData<T>(
	asyncFunction: () => Promise<T>,
	deps: any[] = [],
	options?: {
		immediate?: boolean; // 是否立即执行，默认 true
		errorMessage?: string; // 自定义错误消息
		onError?: (error: unknown) => void; // 错误回调
		onSuccess?: (data: T) => void; // 成功回调
	}
): UseAsyncDataResult<T> {
	const [data, setData] = useState<T | null>(null);
	const [loading, setLoading] = useState(options?.immediate !== false);
	const [error, setError] = useState<string | null>(null);

	const execute = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			const result = await asyncFunction();
			setData(result);
			options?.onSuccess?.(result);
		} catch (err) {
			const errorMsg = err instanceof Error ? err.message : '加载失败';
			setError(errorMsg);
			handleError(err, options?.errorMessage || errorMsg);
			options?.onError?.(err);
		} finally {
			setLoading(false);
		}
	}, [asyncFunction, ...deps]);

	useEffect(() => {
		if (options?.immediate !== false) {
			execute();
		}
	}, [execute, options?.immediate]);

	return { data, loading, error, refetch: execute };
}
