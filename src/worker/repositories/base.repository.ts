/**
 * 基础仓储类
 * 提供数据库操作的通用方法
 */

import type { DbResult, DbExecResult } from "../core/types/database";

export abstract class BaseRepository {
	constructor(protected db: D1Database) {}

	/**
	 * 执行查询操作（SELECT）
	 */
	protected async executeQuery<T>(
		sql: string,
		params: any[] = []
	): Promise<DbResult<T>> {
		let stmt = this.db.prepare(sql);
		for (const param of params) {
			stmt = stmt.bind(param);
		}
		return await stmt.all();
	}

	/**
	 * 执行更新操作（INSERT/UPDATE/DELETE）
	 */
	protected async executeRun(
		sql: string,
		params: any[] = []
	): Promise<DbExecResult> {
		let stmt = this.db.prepare(sql);
		for (const param of params) {
			stmt = stmt.bind(param);
		}
		return await stmt.run();
	}

	/**
	 * 执行单条查询（FIRST）
	 */
	protected async executeFirst<T>(
		sql: string,
		params: any[] = []
	): Promise<T | null> {
		let stmt = this.db.prepare(sql);
		for (const param of params) {
			stmt = stmt.bind(param);
		}
		const result = await stmt.first();
		return (result as T | null);
	}

	/**
	 * 批量执行操作（用于事务）
	 */
	protected async executeBatch(
		statements: { sql: string; params: any[] }[]
	): Promise<DbExecResult[]> {
		const results: DbExecResult[] = [];
		for (const { sql, params } of statements) {
			const result = await this.executeRun(sql, params);
			results.push(result);
		}
		return results;
	}
}
