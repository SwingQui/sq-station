import { Hono } from "hono";
import type { Env, Variables } from "./index.d";
import { cors } from "hono/cors";
// 导入新的 Controller 层
import kvController from "./controllers/kv.controller";
import r2Controller from "./controllers/r2.controller";
import userController from "./controllers/user.controller";
import roleController from "./controllers/role.controller";
import menuController from "./controllers/menu.controller";
import userRoleController from "./controllers/user-role.controller";
import roleMenuController from "./controllers/role-menu.controller";
import permissionController from "./controllers/permission.controller";
import organizationController from "./controllers/organization.controller";
import userOrganizationController from "./controllers/user-organization.controller";
import orgPermissionController from "./controllers/org-permission.controller";
import configController from "./controllers/config.controller";
import { success, fail, badRequest, unauthorized, notFound, handleError } from "./utils/response";
import { createAuthRouter, createPublicRouter } from "./utils/auth-helper";
import { AuthService } from "./services/auth.service";
import { UserRepository } from "./repositories/user.repository";
import { MenuRepository } from "./repositories/menu.repository";

const app = new Hono<{ Bindings: Env; Variables: Variables }>();

// CORS 配置（允许前端携带 Authorization header）
app.use("/*", cors({
	origin: "*",
	allowHeaders: ["Content-Type", "Authorization"],
	allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
}));

// 处理 CORS 预检请求（OPTIONS）
// 必须在所有路由之前显式处理，避免请求体被多次读取
app.options("/*", () => {
	return new Response(null, {
		status: 204,  // No Content
		headers: {
			"Access-Control-Allow-Origin": "*",
			"Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
			"Access-Control-Allow-Headers": "Content-Type, Authorization",
			"Access-Control-Max-Age": "86400",  // 24 小时缓存预检结果
		},
	});
});

app.get("/api/", (c) => c.json(success({ name: "Cloudflare" })));

// ==================== 公开 API 路由器（不需要认证）====================
const publicApiRouter = createPublicRouter();

// 公开登录、登出 API
publicApiRouter.post("/login", async (c) => {
	try {
		const data = await c.req.json();

		const userRepo = new UserRepository(c.env.DB);
		const menuRepo = new MenuRepository(c.env.DB);
		const authService = new AuthService(userRepo, menuRepo);

		const result = await authService.login(
			data,
			c.env.JWT_SECRET || "default-secret-key",
			c.env.JWT_EXPIRES_IN || "24 * 60 * 60"
		);

		return c.json(success(result, "登录成功"));
	} catch (e: any) {
		if (e.message.includes("用户名或密码") || e.message.includes("不能为空") || e.message.includes("已被禁用")) {
			return c.json(unauthorized(e.message));
		}
		return c.json(fail(500, handleError(e, "登录失败")));
	}
});

publicApiRouter.post("/logout", (c) => {
	return c.json(success(null, "登出成功"));
});

// 将公开路由挂载到 /api/auth（不应用 authMiddleware）
app.route("/api/auth", publicApiRouter);

// ==================== 受保护 API 路由器（需要认证）====================
const protectedApiRouter = createAuthRouter();

// ==================== 认证相关 API（登录后可访问）====================
// 获取用户信息（需要认证）
protectedApiRouter.get("/auth/me", async (c) => {
	try {
		const currentUser = c.get("currentUser");
		if (!currentUser) {
			return c.json(unauthorized("未登录"));
		}

		const userRepo = new UserRepository(c.env.DB);
		const menuRepo = new MenuRepository(c.env.DB);
		const authService = new AuthService(userRepo, menuRepo);

		const result = await authService.getUserInfo(currentUser.userId);

		return c.json(success(result));
	} catch (e: any) {
		if (e.message === "用户不存在") {
			return c.json(notFound(e.message));
		}
		return c.json(fail(500, handleError(e, "获取用户信息失败")));
	}
});

protectedApiRouter.post("/auth/refresh", async (c) => {
	try {
		const currentUser = c.get("currentUser");
		if (!currentUser) {
			return c.json(unauthorized("未登录"));
		}

		const userRepo = new UserRepository(c.env.DB);
		const menuRepo = new MenuRepository(c.env.DB);
		const authService = new AuthService(userRepo, menuRepo);

		const token = await authService.refreshToken(
			currentUser.userId,
			currentUser.username,
			c.env.JWT_SECRET || "default-secret-key",
			c.env.JWT_EXPIRES_IN || "24 * 60 * 60"
		);

		return c.json(success({ token }, "刷新成功"));
	} catch (e: any) {
		return c.json(fail(500, handleError(e, "刷新 Token 失败")));
	}
});

// 挂载受保护的 API
// ==================== 用户管理路由 ====================
// 权限检查已在控制器内部实现
protectedApiRouter.route("/users", userController);
protectedApiRouter.route("/users", userRoleController);  // /api/users/:id/roles

// ==================== 角色管理路由 ====================
// 权限检查已在控制器内部实现
protectedApiRouter.route("/roles", roleController);
protectedApiRouter.route("/roles", roleMenuController);  // /api/roles/:id/menus

// ==================== 菜单管理路由 ====================
// 权限检查已在控制器内部实现
protectedApiRouter.route("/menus", menuController);

// ==================== 组织管理路由 ====================
protectedApiRouter.route("/organization", organizationController);

// ==================== 用户组织关联路由 ====================
protectedApiRouter.route("/user-organization", userOrganizationController);

// ==================== 组织权限路由 ====================
protectedApiRouter.route("/organization", orgPermissionController);

// ==================== 权限相关路由 ====================
protectedApiRouter.route("/permissions", permissionController);
protectedApiRouter.route("/user", permissionController);

// ==================== 配置相关路由（公开访问，用于获取权限元数据）====================
// 配置 API 可以公开访问，因为只返回静态的权限定义
app.route("/api/config", configController);

// ==================== KV 存储路由 ====================
protectedApiRouter.route("/kv", kvController);

// ==================== R2 存储路由 ====================
protectedApiRouter.route("/r2", r2Controller);

// SQL 执行工具 API (支持所有 SQL 操作) - 需要认证+管理员权限
protectedApiRouter.post("/sql/query", async (c) => {
	// 检查是否为超级管理员
	const currentUser = c.get("currentUser");
	if (!currentUser || (currentUser.userId !== 1 && currentUser.username !== "admin")) {
		return c.json(fail(403, "权限不足：仅超级管理员可执行 SQL 查询"), 403);
	}

	try {
		const { sql } = await c.req.json();
		if (!sql || typeof sql !== "string") {
			return c.json(badRequest("SQL 语句不能为空"));
		}

		// 判断是否为 SELECT 查询
		const isSelect = sql.trim().toUpperCase().startsWith("SELECT");

		if (isSelect) {
			// SELECT 查询：返回结果集
			const result = await c.env.DB.prepare(sql).all();

			// 提取列名（从第一行的键）
			const columns = result.results.length > 0
				? Object.keys(result.results[0])
				: [];

			// 转换数据为二维数组
			const rows = result.results.map((row: any) =>
				columns.map((col) => row[col])
			);

			return c.json(success({ columns, rows }));
		} else {
			// INSERT/UPDATE/DELETE/CREATE/DROP 等：返回执行结果
			const result = await c.env.DB.prepare(sql).run();

			return c.json(success({
				changes: result.meta.changes,
				last_row_id: result.meta.last_row_id,
			}, "执行成功"));
		}
	} catch (e: any) {
		return c.json(fail(400, e.message || "执行失败"));
	}
});

// 将受保护路由挂载到 /api（应用 authMiddleware）
app.route("/api", protectedApiRouter);

// ==================== 本地开发支持 ====================

// 根路径健康检查（用于测试 Worker 是否正常运行）
app.get("/", (c) => {
	return c.json(success({
		status: "ok",
		timestamp: new Date().toISOString(),
		worker: "sq-station",
	}));
});

// ==================== 开发环境支持结束 ====================

export default app;
