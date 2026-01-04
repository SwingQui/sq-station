import { Hono } from "hono";
import type { Env, Variables } from "./index.d";
import { cors } from "hono/cors";
// 导入新的 Controller 层
import kvController from "./controllers/kv.controller";
import userController from "./controllers/user.controller";
import roleController from "./controllers/role.controller";
import menuController from "./controllers/menu.controller";
import userRoleController from "./controllers/user-role.controller";
import roleMenuController from "./controllers/role-menu.controller";
import permissionController from "./controllers/permission.controller";
import authController from "./controllers/auth.controller";
import organizationController from "./controllers/organization.controller";
import userOrganizationController from "./controllers/user-organization.controller";
import orgRoleController from "./controllers/org-role.controller";
import { success, fail, badRequest } from "./utils/response";
import { createAuthRouter } from "./utils/auth-helper";

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

// 创建统一的 API 路由器（authMiddleware 内部有白名单，login 等公开路由会通过白名单）
const apiRouter = createAuthRouter();

// 挂载 auth API（包含 login、logout 等公开路由）
apiRouter.route("/auth", authController);

// 挂载受保护的 API
apiRouter.route("/kv", kvController);
apiRouter.route("/users", userController);
apiRouter.route("/roles", roleController);
apiRouter.route("/menus", menuController);
apiRouter.route("/users", userRoleController);  // /api/users/:id/roles
apiRouter.route("/roles", roleMenuController);  // /api/roles/:id/menus
apiRouter.route("/user", permissionController);  // /api/user/:id/menus, /api/user/:id/permissions
apiRouter.route("/organization", organizationController);
apiRouter.route("/user-organization", userOrganizationController);
apiRouter.route("/org-role", orgRoleController);

// SQL 执行工具 API (支持所有 SQL 操作) - 需要认证+管理员权限
apiRouter.post("/sql/query", async (c) => {
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

// 将所有 API 路由统一挂载到主应用
app.route("/api", apiRouter);

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
