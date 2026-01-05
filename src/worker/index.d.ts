import { KVNamespace } from "@cloudflare/workers-types";

export type { KVNamespace };

export interface Env {
	KV_BINDING: KVNamespace;
	DB: D1Database;
	JWT_SECRET?: string;
	JWT_EXPIRES_IN?: string;
}

export interface AuthUser {
	userId: number;
	username: string;
	permissions?: string[];
}

// 导入服务类型（避免循环依赖，使用类型导入）
import type { UserService } from "./services/user.service";
import type { RoleService } from "./services/role.service";
import type { MenuService } from "./services/menu.service";
import type { UserRoleService } from "./services/user-role.service";
import type { RoleMenuService } from "./services/role-menu.service";
import type { OrganizationService } from "./services/organization.service";
import type { UserRepository } from "./repositories/user.repository";

// 扩展 Hono Context 类型
export type Variables = {
	currentUser?: AuthUser;
	userService?: UserService;
	roleService?: RoleService;
	menuService?: MenuService;
	userRoleService?: UserRoleService;
	roleMenuService?: RoleMenuService;
	orgService?: OrganizationService;
	userRepo?: UserRepository;
};
