/**
 * 用户请求 DTO
 * 使用 Zod 进行数据验证
 */

import { z } from "zod";

// 创建用户 DTO
export const createUserSchema = z.object({
	username: z.string()
		.min(3, "用户名至少3个字符")
		.max(20, "用户名最多20个字符")
		.regex(/^[a-zA-Z0-9_]+$/, "用户名只能包含字母、数字和下划线"),
	password: z.string()
		.min(6, "密码至少6个字符")
		.max(32, "密码最多32个字符"),
	nickname: z.string().max(50, "昵称最多50个字符").optional().nullable(),
	email: z.string().email("邮箱格式不正确").optional().nullable(),
	phone: z.string().regex(/^1[3-9]\d{9}$/, "手机号格式不正确").optional().nullable(),
	avatar: z.string().url("头像URL格式不正确").optional().nullable(),
	status: z.number().int().min(0).max(1).optional().default(1),
	remark: z.string().max(200, "备注最多200个字符").optional().nullable(),
});

export type CreateUserDto = z.infer<typeof createUserSchema>;

// 更新用户 DTO
export const updateUserSchema = createUserSchema.partial();

export type UpdateUserDto = z.infer<typeof updateUserSchema>;
