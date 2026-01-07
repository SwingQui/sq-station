/**
 * SQL 查询 API
 * 路径前缀: /api/sql
 */

import { apiRequest } from "../../utils/core/request";

export interface QueryResult {
	columns: string[];
	rows: unknown[][];
}

/**
 * 执行 SQL 查询（需要超级管理员权限）
 */
export async function querySQL(sql: string): Promise<QueryResult> {
	return await apiRequest<QueryResult>("POST", "/api/sql/query", { sql });
}
