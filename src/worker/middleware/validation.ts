/**
 * DTO 验证中间件
 * 使用 Zod 进行请求数据验证
 */

import type { Context, Next } from "hono";
import type { z } from "zod";

/**
 * 创建验证中间件
 * @param schema Zod Schema
 * @param target 验证目标（body/query/params）
 */
export function validate<T extends z.ZodType>(
	schema: T,
	target: "body" | "query" | "params" = "body"
) {
	return async (c: Context, next: Next) => {
		try {
			let data: unknown;

			switch (target) {
				case "body":
					data = await c.req.json();
					break;
				case "query":
					data = c.req.query();
					break;
				case "params":
					data = c.req.param();
					break;
			}

			// 执行验证
			const validatedData = schema.parse(data);

			// 将验证后的数据存储到上下文
			c.set(`validated_${target}`, validatedData);

			await next();
		} catch (error: any) {
			if (error.errors) {
				// Zod 验证错误
				const messages = error.errors.map((e: any) =>
					`${e.path.join(".")}: ${e.message}`
				);
				return c.json({ code: 400, data: null, msg: messages.join("; ") });
			}
			return c.json({ code: 400, data: null, msg: "数据验证失败" });
		}
	};
}

/**
 * 从上下文获取验证后的数据
 */
export function getValidated<T>(c: Context, target: "body" | "query" | "params"): T {
	return c.get(`validated_${target}`) as T;
}
