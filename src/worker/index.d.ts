import { KVNamespace } from "@cloudflare/workers-types";

export interface Env {
	KV_BINDING: KVNamespace;
	DB: D1Database;
	JWT_SECRET?: string;
	JWT_EXPIRES_IN?: string;
}

export interface AuthUser {
	userId: number;
	username: string;
}

// 扩展 Hono Context 类型
export type Variables = {
	currentUser?: AuthUser;
};
