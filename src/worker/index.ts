import { Hono } from "hono";
import type { Env } from "./index.d";
import { cors } from "hono/cors";
import kvApi from "./api/kv";
import userApi from "./api/user";
import roleApi from "./api/role";
import menuApi from "./api/menu";
import userRoleApi from "./api/user-role";
import roleMenuApi from "./api/role-menu";
import permissionApi from "./api/permission";
import authApi from "./api/auth";
import { success, fail, badRequest } from "./utils/response";

const app = new Hono<{ Bindings: Env }>();

// CORS 配置（允许前端携带 Authorization header）
app.use("/*", cors({
	origin: "*",
	allowHeaders: ["Content-Type", "Authorization"],
	allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
}));

app.get("/api/", (c) => c.json(success({ name: "Cloudflare" })));

// SQL 执行工具 API (支持所有 SQL 操作)
app.post("/api/sql/query", async (c) => {
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

// 挂载 API - 使用复数REST规范避免路由冲突
app.route("/api/auth", authApi);
app.route("/api/kv", kvApi);
app.route("/api/users", userApi);
app.route("/api/roles", roleApi);
app.route("/api/menus", menuApi);
app.route("/api/users", userRoleApi);  // /api/users/:id/roles
app.route("/api/roles", roleMenuApi);  // /api/roles/:id/menus
// permissionApi 保持 /api/user 前缀（用于查询用户权限，区分于管理接口）
app.route("/api/user", permissionApi);  // /api/user/:id/menus, /api/user/:id/permissions

export default app;
