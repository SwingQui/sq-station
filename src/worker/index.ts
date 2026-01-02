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

const app = new Hono<{ Bindings: Env }>();

// CORS 配置（允许前端携带 Authorization header）
app.use("/*", cors({
	origin: "*",
	allowHeaders: ["Content-Type", "Authorization"],
	allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
}));

app.get("/api/", (c) => c.json({ name: "Cloudflare" }));

// SQL 执行工具 API (支持所有 SQL 操作)
app.post("/api/sql/query", async (c) => {
	const { sql } = await c.req.json();
	if (!sql || typeof sql !== "string") {
		return c.json({ error: "SQL 语句不能为空" }, 400);
	}

	try {
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

			return c.json({
				columns,
				rows,
			});
		} else {
			// INSERT/UPDATE/DELETE/CREATE/DROP 等：返回执行结果
			const result = await c.env.DB.prepare(sql).run();

			return c.json({
				success: true,
				message: "执行成功",
				changes: result.meta.changes,
				last_row_id: result.meta.last_row_id,
			});
		}
	} catch (e: any) {
		return c.json({ error: e.message || "执行失败" }, 400);
	}
});

// 挂载 API
app.route("/api/auth", authApi);
app.route("/api/kv", kvApi);
app.route("/api/user", userApi);
app.route("/api/role", roleApi);
app.route("/api/menu", menuApi);
app.route("/api/user", userRoleApi);
app.route("/api/role", roleMenuApi);
app.route("/api/user", permissionApi);

export default app;
