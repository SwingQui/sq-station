/**
 * SQL 查询 API
 * 路径前缀: /api/sql
  *
 * 架构分层：
 * 组件 → 二次封装 (本文件) → 一次封装 (api/index.ts) → 底层 (utils/core/request)
 */

import { request } from "@/api";

export interface QueryResult {
	columns: string[];
	rows: unknown[][];
}

/**
 * 执行 SQL 查询（需要超级管理员权限）
 */
export async function querySQL(sql: string): Promise<QueryResult> {
	return await request<QueryResult>("POST", "/api/sql/query", { sql });
}
