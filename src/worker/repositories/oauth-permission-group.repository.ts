/**
 * OAuth 权限组仓储
 * 负责权限组的数据库操作
 */

export interface OAuthPermissionGroup {
	id: number;
	group_key: string;
	group_name: string;
	description: string | null;
	permissions: string; // JSON 字符串
	sort_order: number;
	status: number;
	created_at?: string;
	updated_at?: string;
}

export interface CreatePermissionGroupDto {
	group_key: string;
	group_name: string;
	description?: string;
	permissions: string[];
	sort_order?: number;
	status?: number;
}

export interface UpdatePermissionGroupDto {
	group_key?: string;
	group_name?: string;
	description?: string;
	permissions?: string[];
	sort_order?: number;
	status?: number;
}

export class OAuthPermissionGroupRepository {
	constructor(private db: D1Database) {}

	/**
	 * 获取所有权限组
	 */
	async findAll(): Promise<OAuthPermissionGroup[]> {
		const result = await this.db
			.prepare("SELECT * FROM sys_oauth_permission_group ORDER BY sort_order ASC, id ASC")
			.all<OAuthPermissionGroup>();
		return result.results || [];
	}

	/**
	 * 根据 ID 获取权限组
	 */
	async findById(id: number): Promise<OAuthPermissionGroup | null> {
		return await this.db
			.prepare("SELECT * FROM sys_oauth_permission_group WHERE id = ?")
			.bind(id)
			.first<OAuthPermissionGroup>();
	}

	/**
	 * 根据 group_key 获取权限组
	 */
	async findByGroupKey(groupKey: string): Promise<OAuthPermissionGroup | null> {
		return await this.db
			.prepare("SELECT * FROM sys_oauth_permission_group WHERE group_key = ?")
			.bind(groupKey)
			.first<OAuthPermissionGroup>();
	}

	/**
	 * 创建权限组
	 */
	async create(data: CreatePermissionGroupDto): Promise<number> {
		const result = await this.db
			.prepare(
				`INSERT INTO sys_oauth_permission_group (group_key, group_name, description, permissions, sort_order, status)
				 VALUES (?, ?, ?, ?, ?, ?)`
			)
			.bind(
				data.group_key,
				data.group_name,
				data.description || null,
				JSON.stringify(data.permissions),
				data.sort_order ?? 0,
				data.status ?? 1
			)
			.run();
		return result.meta.last_row_id;
	}

	/**
	 * 更新权限组
	 */
	async update(id: number, data: UpdatePermissionGroupDto): Promise<void> {
		const updates: string[] = [];
		const values: (string | number | null)[] = [];

		if (data.group_key !== undefined) {
			updates.push("group_key = ?");
			values.push(data.group_key);
		}
		if (data.group_name !== undefined) {
			updates.push("group_name = ?");
			values.push(data.group_name);
		}
		if (data.description !== undefined) {
			updates.push("description = ?");
			values.push(data.description);
		}
		if (data.permissions !== undefined) {
			updates.push("permissions = ?");
			values.push(JSON.stringify(data.permissions));
		}
		if (data.sort_order !== undefined) {
			updates.push("sort_order = ?");
			values.push(data.sort_order);
		}
		if (data.status !== undefined) {
			updates.push("status = ?");
			values.push(data.status);
		}

		if (updates.length === 0) return;

		values.push(id);
		await this.db
			.prepare(`UPDATE sys_oauth_permission_group SET ${updates.join(", ")} WHERE id = ?`)
			.bind(...values)
			.run();
	}

	/**
	 * 删除权限组
	 */
	async delete(id: number): Promise<void> {
		await this.db
			.prepare("DELETE FROM sys_oauth_permission_group WHERE id = ?")
			.bind(id)
			.run();
	}
}
