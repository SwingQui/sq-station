/**
 * 认证请求 DTO
 */

import { z } from "zod";

// 登录 DTO
export const loginSchema = z.object({
	username: z.string()
		.min(1, "用户名不能为空")
		.max(50, "用户名最多50个字符"),
	password: z.string()
		.min(1, "密码不能为空")
		.max(100, "密码最多100个字符"),
});

export type LoginDto = z.infer<typeof loginSchema>;
