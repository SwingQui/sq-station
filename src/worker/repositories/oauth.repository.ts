/**
 * OAuth 仓储层
 * 处理 OAuth Token 生成相关的数据库操作
 */

import { BaseRepository } from "./base.repository";
import type { SysOAuthClient } from "../core/types/database";

export class OAuthRepository extends BaseRepository {
	/**
	 * 根据 client_id 查询客户端
	 */
	async findByClientId(clientId: string): Promise<SysOAuthClient | null> {
		const sql = "SELECT * FROM sys_oauth_client WHERE client_id = ?";
		return await this.executeFirst<SysOAuthClient>(sql, [clientId]);
	}

	/**
	 * 根据 ID 查询客户端
	 */
	async findById(id: number): Promise<SysOAuthClient | null> {
		const sql = "SELECT * FROM sys_oauth_client WHERE id = ?";
		return await this.executeFirst<SysOAuthClient>(sql, [id]);
	}

	/**
	 * 查询所有客户端
	 */
	async findAll(): Promise<SysOAuthClient[]> {
		const sql = "SELECT * FROM sys_oauth_client ORDER BY created_at DESC";
		const result = await this.executeQuery<SysOAuthClient>(sql);
		return result.results;
	}

	/**
	 * 查询启用的客户端列表
	 */
	async findActiveClients(): Promise<SysOAuthClient[]> {
		const sql = "SELECT * FROM sys_oauth_client WHERE status = 1 ORDER BY created_at DESC";
		const result = await this.executeQuery<SysOAuthClient>(sql);
		return result.results;
	}

	/**
	 * 创建客户端
	 */
	async create(data: {
		client_id: string;
		client_secret: string;
		client_name: string;
		description?: string;
		scope?: string;
		expires_in?: number;
		status?: number;
	}): Promise<number> {
		const sql = `
			INSERT INTO sys_oauth_client (
				client_id, client_secret, client_name, description,
				scope, expires_in, status
			)
			VALUES (?, ?, ?, ?, ?, ?, ?)
		`;
		const result = await this.executeRun(sql, [
			data.client_id,
			data.client_secret,
			data.client_name,
			data.description || null,
			data.scope || '[]',
			data.expires_in || 3600,
			data.status ?? 1,
		]);
		return result.meta.last_row_id!;
	}

	/**
	 * 更新客户端
	 */
	async update(
		id: number,
		data: {
			client_name?: string;
			description?: string;
			scope?: string;
			expires_in?: number;
			status?: number;
		}
	): Promise<void> {
		const updates: string[] = [];
		const params: any[] = [];

		if (data.client_name !== undefined) {
			updates.push("client_name = ?");
			params.push(data.client_name);
		}
		if (data.description !== undefined) {
			updates.push("description = ?");
			params.push(data.description);
		}
		if (data.scope !== undefined) {
			updates.push("scope = ?");
			params.push(data.scope);
		}
		if (data.expires_in !== undefined) {
			updates.push("expires_in = ?");
			params.push(data.expires_in);
		}
		if (data.status !== undefined) {
			updates.push("status = ?");
			params.push(data.status);
		}

		if (updates.length === 0) return;

		updates.push("updated_at = CURRENT_TIMESTAMP");
		params.push(id);

		const sql = `UPDATE sys_oauth_client SET ${updates.join(', ')} WHERE id = ?`;
		await this.executeRun(sql, params);
	}

	/**
	 * 更新客户端密钥
	 */
	async updateSecret(id: number, clientSecret: string): Promise<void> {
		const sql = `
			UPDATE sys_oauth_client
			SET client_secret = ?, updated_at = CURRENT_TIMESTAMP
			WHERE id = ?
		`;
		await this.executeRun(sql, [clientSecret, id]);
	}

	/**
	 * 删除客户端
	 */
	async delete(id: number): Promise<void> {
		const sql = "DELETE FROM sys_oauth_client WHERE id = ?";
		await this.executeRun(sql, [id]);
	}

	/**
	 * 统计客户端数量
	 */
	async count(): Promise<number> {
		const sql = "SELECT COUNT(*) as count FROM sys_oauth_client";
		const result = await this.executeFirst<{ count: number }>(sql);
		return result?.count ?? 0;
	}

	/**
	 * 获取客户端的有效权限（从绑定的权限组获取）
	 * 客户端权限 = 所有绑定权限组的权限并集（无自定义权限）
	 * @param clientId 客户端 ID
	 * @returns 权限并集列表
	 */
	async getClientEffectiveScopes(clientId: string): Promise<string[]> {
		const client = await this.findByClientId(clientId);
		if (!client) return [];

		// 解析权限组ID列表
		let groupIds: number[] = [];
		if ((client as any).permission_group_ids) {
			try {
				groupIds = JSON.parse((client as any).permission_group_ids || "[]") as number[];
			} catch (e) {
				console.error("Failed to parse permission_group_ids:", e);
			}
		}

		// 如果没有绑定权限组，返回空权限
		if (groupIds.length === 0) {
			return [];
		}

		// 获取所有权限组的权限
		const allPermissions: string[] = [];
		for (const groupId of groupIds) {
			const group = await this.executeFirst<{ permissions: string }>(
				"SELECT permissions FROM sys_oauth_permission_group WHERE id = ? AND status = 1",
				[groupId]
			);
			if (group) {
				try {
					const permissions = JSON.parse(group.permissions) as string[];
					allPermissions.push(...permissions);
				} catch (e) {
					console.error("Failed to parse group permissions:", e);
				}
			}
		}

		// 去重并处理超级管理员通配符
		const uniquePermissions = [...new Set(allPermissions)];
		if (uniquePermissions.includes("*:*:*")) {
			return ["*:*:*"];
		}
		return uniquePermissions;
	}

	/**
	 * 更新客户端（包含 permission_group_ids）
	 */
	async updateWithGroups(
		id: number,
		data: {
			client_name?: string;
			description?: string;
			expires_in?: number;
			status?: number;
			permission_group_ids?: string;
		}
	): Promise<void> {
		const updates: string[] = [];
		const params: any[] = [];

		if (data.client_name !== undefined) {
			updates.push("client_name = ?");
			params.push(data.client_name);
		}
		if (data.description !== undefined) {
			updates.push("description = ?");
			params.push(data.description);
		}
		if (data.expires_in !== undefined) {
			updates.push("expires_in = ?");
			params.push(data.expires_in);
		}
		if (data.status !== undefined) {
			updates.push("status = ?");
			params.push(data.status);
		}
		if (data.permission_group_ids !== undefined) {
			updates.push("permission_group_ids = ?");
			params.push(data.permission_group_ids);
		}

		if (updates.length === 0) return;

		updates.push("updated_at = CURRENT_TIMESTAMP");
		params.push(id);

		const sql = `UPDATE sys_oauth_client SET ${updates.join(', ')} WHERE id = ?`;
		await this.executeRun(sql, params);
	}
}
