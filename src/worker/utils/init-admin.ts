/**
 * 管理员初始化工具
 * 从环境变量中读取管理员配置，更新到数据库
 */

import type { Env } from "../index.d";
import { hashPasswordWithUsername } from "./password";

/**
 * 初始化管理员账户
 * 检查管理员密码是否为 placeholder，如果是则使用环境变量中的配置更新
 */
export async function initAdminAccount(env: Env): Promise<void> {
	try {
		// 直接查询包含密码的用户信息
		const admin = await env.DB.prepare("SELECT * FROM sys_user WHERE id = 1")
			.first<{ password: string }>();

		if (!admin) {
			console.warn("[InitAdmin] 管理员用户不存在，跳过初始化");
			return;
		}

		// 检查密码是否为 placeholder
		if (admin.password !== "placeholder") {
			console.log("[InitAdmin] 管理员密码已设置，跳过初始化");
			return;
		}

		// 从环境变量读取管理员配置
		const adminUsername = (env as any).ADMIN_USERNAME || "admin";
		const adminPassword = (env as any).ADMIN_PASSWORD || "admin";
		const adminNickname = (env as any).ADMIN_NICKNAME || "系统管理员";

		// 使用项目的密码加密算法（username 作为 salt）
		const hashedPassword = await hashPasswordWithUsername(adminPassword, adminUsername);

		// 更新管理员信息
		await env.DB.prepare(`
			UPDATE sys_user
			SET username = ?, password = ?, nickname = ?, roles = '["admin"]'
			WHERE id = 1
		`).bind(adminUsername, hashedPassword, adminNickname).run();

		console.log(`[InitAdmin] 管理员账户已初始化: username=${adminUsername}, nickname=${adminNickname}`);
	} catch (error) {
		console.error("[InitAdmin] 初始化管理员账户失败:", error);
		throw error;
	}
}

/**
 * 确保 admin 角色存在
 */
export async function ensureAdminRole(env: Env): Promise<void> {
	try {
		// 检查 admin 角色是否存在
		const role = await env.DB.prepare("SELECT * FROM sys_role WHERE role_key = ?")
			.bind("admin")
			.first();

		if (!role) {
			// 创建 admin 角色
			await env.DB.prepare(`
				INSERT INTO sys_role (role_name, role_key, sort_order, status, is_admin, permissions)
				VALUES (?, ?, ?, ?, ?, ?)
			`).bind("超级管理员", "admin", 1, 1, 1, '["*:*:*"]').run();

			console.log("[InitAdmin] admin 角色已创建");
		}
	} catch (error) {
		console.error("[InitAdmin] 确保 admin 角色存在失败:", error);
	}
}

/**
 * 完整的初始化流程
 */
export async function initializeSystem(env: Env): Promise<void> {
	try {
		console.log("[InitAdmin] 开始系统初始化...");

		// 1. 确保 admin 角色存在
		await ensureAdminRole(env);

		// 2. 初始化管理员账户
		await initAdminAccount(env);

		// 3. 确保管理员和角色的关联
		const adminRole = await env.DB.prepare("SELECT id FROM sys_role WHERE role_key = ?")
			.bind("admin")
			.first<{ id: number }>();

		if (adminRole) {
			// 检查关联是否存在
			const existing = await env.DB.prepare(
				"SELECT * FROM sys_user_role WHERE user_id = 1 AND role_id = ?"
			).bind(adminRole.id).first();

			if (!existing) {
				await env.DB.prepare("INSERT INTO sys_user_role (user_id, role_id) VALUES (?, ?)")
					.bind(1, adminRole.id)
					.run();
				console.log("[InitAdmin] 管理员角色关联已创建");
			}
		}

		console.log("[InitAdmin] 系统初始化完成");
	} catch (error) {
		console.error("[InitAdmin] 系统初始化失败:", error);
		// 初始化失败不应阻止应用启动
	}
}
