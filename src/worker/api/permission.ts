import { Hono } from "hono";
import type { Env } from "../index.d";

const app = new Hono<{ Bindings: Env }>();

// 获取用户的菜单权限 (树形结构)
app.get("/:id/menus", async (c) => {
	const id = c.req.param("id");
	const { results } = await c.env.DB.prepare(
		`SELECT DISTINCT m.* FROM sys_menu m
		 INNER JOIN sys_role_menu rm ON m.id = rm.menu_id
		 INNER JOIN sys_user_role ur ON rm.role_id = ur.role_id
		 WHERE ur.user_id = ? AND m.menu_status = 1
		 ORDER BY m.sort_order`
	).bind(id).all();

	// 构建树形结构
	const buildTree = (parentId: number = 0): any[] => {
		return results
			.filter((m: any) => m.parent_id === parentId)
			.map((m: any) => ({
				...m,
				children: buildTree(m.id)
			}));
	};

	return c.json({ menus: buildTree() });
});

// 验证用户权限
app.get("/:id/permissions", async (c) => {
	const id = c.req.param("id");
	const { results } = await c.env.DB.prepare(
		`SELECT DISTINCT m.permission FROM sys_menu m
		 INNER JOIN sys_role_menu rm ON m.id = rm.menu_id
		 INNER JOIN sys_user_role ur ON rm.role_id = ur.role_id
		 WHERE ur.user_id = ? AND m.permission IS NOT NULL AND m.permission != ''`
	).bind(id).all();
	const permissions = results.map((r: any) => r.permission);
	return c.json({ permissions });
});

export default app;
