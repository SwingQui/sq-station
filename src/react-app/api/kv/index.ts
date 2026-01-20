/**
 * KV 存储 API
 * 路径前缀: /api/kv
  *
 * 架构分层：
 * 组件 → 二次封装 (本文件) → 一次封装 (api/index.ts) → 底层 (utils/core/request)
 */

import { request } from "@/api";

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
	return await request<KVKey[]>("GET", "/api/kv");
}

/**
 * 获取单个值
 */
export async function getKVValue(key: string): Promise<KVValue> {
	return await request<KVValue>("GET", `/api/kv/${encodeURIComponent(key)}`);
}

/**
 * 创建/更新值
 */
export async function setKVValue(key: string, value: string): Promise<void> {
	return await request("PUT", `/api/kv/${encodeURIComponent(key)}`, { value });
}

/**
 * 删除值
 */
export async function deleteKVKey(key: string): Promise<void> {
	return await request("DELETE", `/api/kv/${encodeURIComponent(key)}`);
}
