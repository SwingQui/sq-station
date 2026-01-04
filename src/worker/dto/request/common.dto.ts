/**
 * 通用请求 DTO
 */

import { z } from "zod";

// ID 参数 DTO
export const idParamSchema = z.object({
	id: z.string().regex(/^\d+$/, "ID必须为数字").transform(Number),
});

export type IdParamDto = z.infer<typeof idParamSchema>;

// 分页查询 DTO
export const paginationSchema = z.object({
	page: z.string().regex(/^\d+$/, "页码必须为数字").transform(Number).default(1),
	pageSize: z.string().regex(/^\d+$/, "每页数量必须为数字").transform(Number).default(10),
});

export type PaginationDto = z.infer<typeof paginationSchema>;
