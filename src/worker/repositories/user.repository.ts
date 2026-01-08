/**
 * 用户数据仓储层
 * 封装所有与 sys_user 表相关的数据库操作
 */

import { BaseRepository } from "./base.repository";
import type { SysUser } from "../core/types/database";

export interface CreateUserDto {
	username: string;
	password: string;
	nickname?: string | null;
	email?: string | null;
	phone?: string | null;
	avatar?: string | null;
	status?: number;
	remark?: string | null;
}

export interface UpdateUserDto {
	username: string;
	password?: string;
	nickname?: string | null;
	email?: string | null;
	phone?: string | null;
	avatar?: string | null;
	status?: number;
	remark?: string | null;
}

export class UserRepository extends BaseRepository {
	/**
	 * 查询所有用户
	 */
	async findAll(): Promise<Omit<SysUser, "password">[]> {
		const sql = `
			SELECT id, username, nickname, email, phone, avatar, status, remark, created_at
			FROM sys_user
			ORDER BY id
		`;
		const result = await this.executeQuery<Omit<SysUser, "password">>(sql);
		return result.results;
	}

	/**
	 * 根据 ID 查询用户
	 */
	async findById(id: number): Promise<Omit<SysUser, "password"> | null> {
		const sql = `
			SELECT id, username, nickname, email, phone, avatar, status, roles, remark, created_at
			FROM sys_user
			WHERE id = ?
		`;
		return await this.executeFirst<Omit<SysUser, "password">>(sql, [id]);
	}

	/**
	 * 根据 ID 查询用户（包含密码）
	 */
	async findByIdWithPassword(id: number): Promise<SysUser | null> {
		const sql = `
			SELECT id, username, password, nickname, email, phone, avatar, status, remark, created_at
			FROM sys_user
			WHERE id = ?
		`;
		return await this.executeFirst<SysUser>(sql, [id]);
	}

	/**
	 * 根据用户名查询用户
	 */
	async findByUsername(username: string): Promise<SysUser | null> {
		const sql = `
			SELECT id, username, password, nickname, email, phone, avatar, status
			FROM sys_user
			WHERE username = ?
		`;
		return await this.executeFirst<SysUser>(sql, [username]);
	}

	/**
	 * 创建用户
	 */
	async create(data: CreateUserDto): Promise<number> {
		const sql = `
			INSERT INTO sys_user (username, password, nickname, email, phone, avatar, status, remark)
			VALUES (?, ?, ?, ?, ?, ?, ?, ?)
		`;
		const result = await this.executeRun(sql, [
			data.username,
			data.password,
			data.nickname || null,
			data.email || null,
			data.phone || null,
			data.avatar || null,
			data.status ?? 1,
			data.remark || null
		]);
		return result.meta.last_row_id!;
	}

	/**
	 * 更新用户
	 */
	async update(id: number, data: UpdateUserDto): Promise<void> {
		if (data.password && data.password.trim()) {
			// 包含密码更新
			const sql = `
				UPDATE sys_user
				SET username = ?, password = ?, nickname = ?, email = ?, phone = ?,
				    avatar = ?, status = ?, remark = ?, updated_at = CURRENT_TIMESTAMP
				WHERE id = ?
			`;
			await this.executeRun(sql, [
				data.username,
				data.password,
				data.nickname || null,
				data.email || null,
				data.phone || null,
				data.avatar || null,
				data.status ?? 1,
				data.remark || null,
				id
			]);
		} else {
			// 不包含密码更新
			const sql = `
				UPDATE sys_user
				SET username = ?, nickname = ?, email = ?, phone = ?,
				    avatar = ?, status = ?, remark = ?, updated_at = CURRENT_TIMESTAMP
				WHERE id = ?
			`;
			await this.executeRun(sql, [
				data.username,
				data.nickname || null,
				data.email || null,
				data.phone || null,
				data.avatar || null,
				data.status ?? 1,
				data.remark || null,
				id
			]);
		}
	}

	/**
	 * 删除用户
	 */
	async delete(id: number): Promise<void> {
		const sql = "DELETE FROM sys_user WHERE id = ?";
		await this.executeRun(sql, [id]);
	}

	/**
	 * 检查用户名是否存在
	 */
	async existsByUsername(username: string): Promise<boolean> {
		const sql = "SELECT COUNT(*) as count FROM sys_user WHERE username = ?";
		const result = await this.executeFirst<{ count: number }>(sql, [username]);
		return (result?.count ?? 0) > 0;
	}

	/**
	 * 检查用户名是否存在（排除指定 ID）
	 */
	async existsByUsernameExcludeId(username: string, excludeId: number): Promise<boolean> {
		const sql = "SELECT COUNT(*) as count FROM sys_user WHERE username = ? AND id != ?";
		const result = await this.executeFirst<{ count: number }>(sql, [username, excludeId]);
		return (result?.count ?? 0) > 0;
	}
}
