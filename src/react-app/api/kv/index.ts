/**
 * KV 存储 API
 * 路径前缀: /api/kv
 */

import { apiRequest } from "../../utils/core/request";

export interface KVKey {
	name: string;
	metadata?: Record<string, unknown>;
}

export interface KVValue {
	value: string;
}

/**
 * 获取所有 keys
 */
export async function getKVList(): Promise<KVKey[]> {
	return await apiRequest<KVKey[]>("GET", "/api/kv");
}

/**
 * 获取单个值
 */
export async function getKVValue(key: string): Promise<KVValue> {
	return await apiRequest<KVValue>("GET", `/api/kv/${encodeURIComponent(key)}`);
}

/**
 * 创建/更新值
 */
export async function setKVValue(key: string, value: string): Promise<void> {
	return await apiRequest("PUT", `/api/kv/${encodeURIComponent(key)}`, { value });
}

/**
 * 删除值
 */
export async function deleteKVKey(key: string): Promise<void> {
	return await apiRequest("DELETE", `/api/kv/${encodeURIComponent(key)}`);
}
