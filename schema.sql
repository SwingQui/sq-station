-- ====================================
-- 若依风格权限系统数据库表结构
-- ====================================

-- 删除旧表（重新创建时使用）
DROP TABLE IF EXISTS sys_org_role;
DROP TABLE IF EXISTS sys_user_organization;
DROP TABLE IF EXISTS sys_role_menu;
DROP TABLE IF EXISTS sys_user_role;
DROP TABLE IF EXISTS sys_organization;
DROP TABLE IF EXISTS sys_menu;
DROP TABLE IF EXISTS sys_role;
DROP TABLE IF EXISTS sys_user;

-- 用户表
CREATE TABLE IF NOT EXISTS sys_user (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  nickname TEXT,
  email TEXT,
  phone TEXT,
  avatar TEXT,
  status INTEGER DEFAULT 1,  -- 0:禁用 1:正常
  roles TEXT DEFAULT '[]',  -- 用户角色数组 JSON 格式，如 ["admin","user"]
  remark TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 角色表
CREATE TABLE IF NOT EXISTS sys_role (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  role_name TEXT NOT NULL UNIQUE,
  role_key TEXT NOT NULL UNIQUE,  -- 角色权限字符串
  sort_order INTEGER DEFAULT 0,
  status INTEGER DEFAULT 1,  -- 0:禁用 1:正常
  is_admin INTEGER DEFAULT 0,  -- 0:普通角色 1:超级管理员角色
  permissions TEXT DEFAULT '[]',  -- 权限数组 JSON 格式，如 ["system:user:list","system:role:add"] 或 ["*:*:*"]
  remark TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 菜单表 (包含路由信息)
CREATE TABLE IF NOT EXISTS sys_menu (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  parent_id INTEGER DEFAULT 0,  -- 父菜单ID，0为根菜单
  menu_name TEXT NOT NULL,  -- 菜单名称
  menu_type TEXT NOT NULL,  -- 类型: M=目录 C=菜单 F=按钮
  route_path TEXT,  -- 路由地址
  component_path TEXT,  -- 组件路径
  redirect TEXT,  -- 重定向地址
  query_param TEXT,  -- 路由参数
  is_frame INTEGER DEFAULT 0,  -- 是否为外链 0否 1是
  is_cache INTEGER DEFAULT 0,  -- 是否缓存 0否 1是
  menu_visible INTEGER DEFAULT 1,  -- 显示状态 0否 1是
  menu_status INTEGER DEFAULT 1,  -- 菜单状态 1正常 0停用
  icon TEXT,  -- 菜单图标
  sort_order INTEGER DEFAULT 0,  -- 排序
  permission TEXT,  -- 权限标识
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 用户角色关联表 (逻辑外键，无物理约束)
CREATE TABLE IF NOT EXISTS sys_user_role (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  role_id INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, role_id)
);

-- 角色菜单关联表 (逻辑外键，无物理约束)
CREATE TABLE IF NOT EXISTS sys_role_menu (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  role_id INTEGER NOT NULL,
  menu_id INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(role_id, menu_id)
);

-- 用户权限表 (用户直接分配的权限)
CREATE TABLE IF NOT EXISTS sys_user_permission (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  permission TEXT NOT NULL,  -- 权限字符串，如 "system:menu:list"
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by INTEGER,
  UNIQUE(user_id, permission)
);

-- 用户权限表索引
CREATE INDEX IF NOT EXISTS idx_user_permission_user_id ON sys_user_permission(user_id);

-- ====================================
-- 组织架构相关表
-- ====================================

-- 组织表
CREATE TABLE IF NOT EXISTS sys_organization (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  org_name TEXT NOT NULL UNIQUE,
  org_code TEXT NOT NULL UNIQUE,
  sort_order INTEGER DEFAULT 0,
  status INTEGER DEFAULT 1,
  remark TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 用户组织关联表
CREATE TABLE IF NOT EXISTS sys_user_organization (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  org_id INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, org_id)
);

-- 组织角色关联表
CREATE TABLE IF NOT EXISTS sys_org_role (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  org_id INTEGER NOT NULL,
  role_id INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(org_id, role_id)
);

-- 组织权限表 (组织直接分配的权限)
CREATE TABLE IF NOT EXISTS sys_org_permission (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  org_id INTEGER NOT NULL,
  permission TEXT NOT NULL,  -- 权限字符串，如 "system:user:list"
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by INTEGER,
  UNIQUE(org_id, permission)
);

-- 组织权限表索引
CREATE INDEX IF NOT EXISTS idx_org_permission_org_id ON sys_org_permission(org_id);

-- ====================================
-- 初始化数据
-- ====================================

-- 初始化管理员账号
-- 密码已使用 PBKDF2-SHA256 加密（username 作为 salt）
-- admin 密码: admin13672210421
-- user 密码: user123
INSERT OR IGNORE INTO sys_user (id, username, password, nickname, status, roles) VALUES
(1, 'admin', 'admin$9e97f7ff5e604b010c3ab72e59c239044e12e227016291f55f2cebb022943a10', '管理员', 1, '["admin"]'),
(2, 'user', 'user$a52197d73c0a6a5bec9a30fb0342759f1920ac154b0244376fa874f639338bec', '普通用户', 1, '["user"]');

-- 初始化角色
INSERT OR IGNORE INTO sys_role (id, role_name, role_key, sort_order, status, is_admin) VALUES
(1, '超级管理员', 'admin', 1, 1, 1),
(2, '普通用户', 'user', 2, 1, 0);

-- 初始化角色权限
-- 超级管理员拥有所有权限（通配符）
UPDATE sys_role SET permissions = '["*:*:*"]' WHERE role_key = 'admin';
-- 普通用户初始权限（可根据需要调整）
UPDATE sys_role SET permissions = '["dashboard:home:view","home:view"]' WHERE role_key = 'user';

-- ====================================
-- 初始化菜单 (参考若依设计)
-- ====================================

-- 仪表盘首页（根菜单）
INSERT INTO sys_menu (parent_id, menu_name, menu_type, route_path, component_path, icon, sort_order, permission, menu_visible, menu_status) VALUES
(0, '仪表盘首页', 'C', '/dashboard/home', 'dashboard/home/Home', 'home', 1, 'dashboard:home:view', 1, 1);

-- 系统管理目录（根目录）
INSERT INTO sys_menu (parent_id, menu_name, menu_type, route_path, icon, sort_order, menu_visible, menu_status) VALUES
(0, '系统管理', 'M', NULL, 'setting', 2, 1, 1);

-- 系统管理子菜单
INSERT INTO sys_menu (parent_id, menu_name, menu_type, route_path, component_path, icon, sort_order, permission, menu_visible, menu_status) VALUES
((SELECT id FROM sys_menu WHERE menu_name = '系统管理' AND menu_type = 'M' AND parent_id = 0), '用户管理', 'C', '/dashboard/system/user', 'system/user/UserManage', 'user', 1, 'system:user:read', 1, 1),
((SELECT id FROM sys_menu WHERE menu_name = '系统管理' AND menu_type = 'M' AND parent_id = 0), '角色管理', 'C', '/dashboard/system/role', 'system/role/RoleManage', 'role', 2, 'system:role:read', 1, 1),
((SELECT id FROM sys_menu WHERE menu_name = '系统管理' AND menu_type = 'M' AND parent_id = 0), '菜单管理', 'C', '/dashboard/system/menu', 'system/menu/MenuManage', 'menu', 3, 'system:menu:read', 1, 1),
((SELECT id FROM sys_menu WHERE menu_name = '系统管理' AND menu_type = 'M' AND parent_id = 0), 'KV管理', 'C', '/dashboard/system/kv', 'system/kv/KVManage', 'database', 4, 'system:kv:view', 1, 1),
((SELECT id FROM sys_menu WHERE menu_name = '系统管理' AND menu_type = 'M' AND parent_id = 0), 'R2存储', 'C', '/dashboard/system/r2', 'system/r2/R2Manage', 'folder-open', 5, 'system:r2:view', 1, 1),
((SELECT id FROM sys_menu WHERE menu_name = '系统管理' AND menu_type = 'M' AND parent_id = 0), '表查询', 'C', '/dashboard/system/sql', 'system/sql/SQLSearch', 'database', 6, 'system:sqlSearch', 1, 1);

-- 内容管理目录（根目录）
INSERT INTO sys_menu (parent_id, menu_name, menu_type, route_path, icon, sort_order, menu_visible, menu_status) VALUES
(0, '内容管理', 'M', NULL, 'content', 3, 1, 1);

-- 内容管理子菜单（前台页面）
INSERT INTO sys_menu (parent_id, menu_name, menu_type, route_path, component_path, icon, sort_order, permission, menu_visible, menu_status) VALUES
((SELECT id FROM sys_menu WHERE menu_name = '内容管理' AND menu_type = 'M'), '首页', 'C', '/', 'Home', 'home', 1, 'home:view', 1, 1);

-- 用户角色关联
INSERT OR IGNORE INTO sys_user_role (id, user_id, role_id) VALUES
(1, 1, 1),  -- admin -> 超级管理员
(2, 2, 2);  -- user -> 普通用户

-- 角色菜单关联 (超级管理员拥有所有权限)
INSERT OR IGNORE INTO sys_role_menu (role_id, menu_id)
SELECT 1, id FROM sys_menu;

-- 角色菜单关联 (普通用户只能访问内容管理下的页面)
INSERT OR IGNORE INTO sys_role_menu (role_id, menu_id) VALUES
(2, (SELECT id FROM sys_menu WHERE menu_name = '内容管理' AND menu_type = 'M')),  -- 内容管理目录
(2, (SELECT id FROM sys_menu WHERE route_path = '/')),                          -- 首页
(2, (SELECT id FROM sys_menu WHERE route_path = '/dashboard/home'));               -- 仪表盘首页

-- ====================================
-- 按钮级权限
-- ====================================
-- 用户管理按钮权限
INSERT OR IGNORE INTO sys_menu (parent_id, menu_name, menu_type, permission, sort_order, menu_visible, menu_status) VALUES
((SELECT id FROM sys_menu WHERE route_path = '/dashboard/system/user'), '新增用户', 'F', 'system:user:create', 1, 0, 1),
((SELECT id FROM sys_menu WHERE route_path = '/dashboard/system/user'), '编辑用户', 'F', 'system:user:update', 2, 0, 1),
((SELECT id FROM sys_menu WHERE route_path = '/dashboard/system/user'), '删除用户', 'F', 'system:user:delete', 3, 0, 1),
((SELECT id FROM sys_menu WHERE route_path = '/dashboard/system/user'), '分配角色', 'F', 'system:user:assignRoles', 4, 0, 1),
((SELECT id FROM sys_menu WHERE route_path = '/dashboard/system/user'), '分配权限', 'F', 'system:user:assignPermissions', 5, 0, 1);

-- 角色管理按钮权限
INSERT OR IGNORE INTO sys_menu (parent_id, menu_name, menu_type, permission, sort_order, menu_visible, menu_status) VALUES
((SELECT id FROM sys_menu WHERE route_path = '/dashboard/system/role'), '新增角色', 'F', 'system:role:create', 1, 0, 1),
((SELECT id FROM sys_menu WHERE route_path = '/dashboard/system/role'), '编辑角色', 'F', 'system:role:update', 2, 0, 1),
((SELECT id FROM sys_menu WHERE route_path = '/dashboard/system/role'), '删除角色', 'F', 'system:role:delete', 3, 0, 1),
((SELECT id FROM sys_menu WHERE route_path = '/dashboard/system/role'), '分配菜单', 'F', 'system:role:assignMenus', 4, 0, 1),
((SELECT id FROM sys_menu WHERE route_path = '/dashboard/system/role'), '配置权限', 'F', 'system:role:configPermissions', 5, 0, 1);

-- 菜单管理按钮权限
INSERT OR IGNORE INTO sys_menu (parent_id, menu_name, menu_type, permission, sort_order, menu_visible, menu_status) VALUES
((SELECT id FROM sys_menu WHERE route_path = '/dashboard/system/menu'), '新增菜单', 'F', 'system:menu:create', 1, 0, 1),
((SELECT id FROM sys_menu WHERE route_path = '/dashboard/system/menu'), '编辑菜单', 'F', 'system:menu:update', 2, 0, 1),
((SELECT id FROM sys_menu WHERE route_path = '/dashboard/system/menu'), '删除菜单', 'F', 'system:menu:delete', 3, 0, 1);

-- R2存储按钮权限
INSERT OR IGNORE INTO sys_menu (parent_id, menu_name, menu_type, permission, sort_order, menu_visible, menu_status) VALUES
-- 文件管理权限（简化版）
((SELECT id FROM sys_menu WHERE route_path = '/dashboard/system/r2'), '查看文件', 'F', 'r2:file:view', 1, 0, 1),
((SELECT id FROM sys_menu WHERE route_path = '/dashboard/system/r2'), '文件管理', 'F', 'r2:file:manage', 2, 0, 1),
((SELECT id FROM sys_menu WHERE route_path = '/dashboard/system/r2'), '删除文件', 'F', 'r2:file:delete', 3, 0, 1),
-- 文件夹管理权限
((SELECT id FROM sys_menu WHERE route_path = '/dashboard/system/r2'), '查看文件夹', 'F', 'r2:folder:view', 4, 0, 1),
((SELECT id FROM sys_menu WHERE route_path = '/dashboard/system/r2'), '创建文件夹', 'F', 'r2:folder:create', 5, 0, 1),
((SELECT id FROM sys_menu WHERE route_path = '/dashboard/system/r2'), '删除文件夹', 'F', 'r2:folder:delete', 6, 0, 1);

-- 确保超级管理员拥有所有权限（包括新添加的按钮权限）
INSERT OR IGNORE INTO sys_role_menu (role_id, menu_id)
SELECT 1, id FROM sys_menu WHERE NOT EXISTS (
	SELECT 1 FROM sys_role_menu WHERE role_id = 1 AND menu_id = sys_menu.id
);

-- ====================================
-- 组织管理菜单
-- ====================================
-- 组织管理菜单（在系统管理目录下）
INSERT OR IGNORE INTO sys_menu (parent_id, menu_name, menu_type, route_path, component_path, icon, sort_order, permission, menu_visible, menu_status) VALUES
((SELECT id FROM sys_menu WHERE menu_name = '系统管理' AND menu_type = 'M' AND parent_id = 0), '组织管理', 'C', '/dashboard/system/organization', 'system/organization/OrganizationManage', 'team', 6, 'system:organization:read', 1, 1);

-- 组织管理按钮权限
INSERT OR IGNORE INTO sys_menu (parent_id, menu_name, menu_type, permission, sort_order, menu_visible, menu_status) VALUES
((SELECT id FROM sys_menu WHERE route_path = '/dashboard/system/organization'), '新增组织', 'F', 'system:organization:create', 1, 0, 1),
((SELECT id FROM sys_menu WHERE route_path = '/dashboard/system/organization'), '编辑组织', 'F', 'system:organization:update', 2, 0, 1),
((SELECT id FROM sys_menu WHERE route_path = '/dashboard/system/organization'), '删除组织', 'F', 'system:organization:delete', 3, 0, 1),
((SELECT id FROM sys_menu WHERE route_path = '/dashboard/system/organization'), '分配角色', 'F', 'system:organization:assignRoles', 4, 0, 1);

-- 用户管理按钮权限（添加分配组织权限）
INSERT OR IGNORE INTO sys_menu (parent_id, menu_name, menu_type, permission, sort_order, menu_visible, menu_status) VALUES
((SELECT id FROM sys_menu WHERE route_path = '/dashboard/system/user'), '分配组织', 'F', 'system:user:assignOrgs', 6, 0, 1);

-- 确保超级管理员拥有组织管理相关权限
INSERT OR IGNORE INTO sys_role_menu (role_id, menu_id)
SELECT 1, id FROM sys_menu WHERE NOT EXISTS (
	SELECT 1 FROM sys_role_menu WHERE role_id = 1 AND menu_id = sys_menu.id
);

-- ====================================
-- 初始化示例组织数据
-- ====================================
INSERT OR IGNORE INTO sys_organization (id, org_name, org_code, sort_order, status) VALUES
(1, '总公司', 'HQ', 1, 1),
(2, '技术部', 'TECH', 2, 1),
(3, '市场部', 'MARKET', 3, 1);

-- ====================================
-- OAuth 客户端管理
-- ====================================

-- OAuth 客户端表
CREATE TABLE IF NOT EXISTS sys_oauth_client (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id TEXT NOT NULL UNIQUE,        -- 客户端 ID（公开）
  client_secret TEXT NOT NULL,           -- 客户端密钥（加密存储）
  client_name TEXT NOT NULL,             -- 客户端名称
  description TEXT,                      -- 描述
  scope TEXT DEFAULT '[]',               -- 授权的权限列表 JSON，如 ["system:user:list","r2:file:upload"]
  expires_in INTEGER DEFAULT 3600,       -- Token 有效期（秒）
  status INTEGER DEFAULT 1,              -- 状态：0=禁用 1=正常
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- OAuth 客户端管理菜单（在系统管理目录下）
INSERT OR IGNORE INTO sys_menu (parent_id, menu_name, menu_type, route_path, component_path, icon, sort_order, permission, menu_visible, menu_status) VALUES
((SELECT id FROM sys_menu WHERE menu_name = '系统管理' AND menu_type = 'M' AND parent_id = 0), 'OAuth客户端', 'C', '/dashboard/system/oauth', 'system/oauth/OAuthClientManage', 'api', 7, 'oauth:client:read', 1, 1);

-- OAuth 客户端管理按钮权限
INSERT OR IGNORE INTO sys_menu (parent_id, menu_name, menu_type, permission, sort_order, menu_visible, menu_status) VALUES
((SELECT id FROM sys_menu WHERE route_path = '/dashboard/system/oauth'), '新增客户端', 'F', 'oauth:client:create', 1, 0, 1),
((SELECT id FROM sys_menu WHERE route_path = '/dashboard/system/oauth'), '编辑客户端', 'F', 'oauth:client:update', 2, 0, 1),
((SELECT id FROM sys_menu WHERE route_path = '/dashboard/system/oauth'), '删除客户端', 'F', 'oauth:client:delete', 3, 0, 1),
((SELECT id FROM sys_menu WHERE route_path = '/dashboard/system/oauth'), '重置密钥', 'F', 'oauth:client:resetSecret', 4, 0, 1);

-- 确保超级管理员拥有 OAuth 客户端管理相关权限
INSERT OR IGNORE INTO sys_role_menu (role_id, menu_id)
SELECT 1, id FROM sys_menu WHERE NOT EXISTS (
	SELECT 1 FROM sys_role_menu WHERE role_id = 1 AND menu_id = sys_menu.id
);

-- ====================================
-- OAuth 权限组管理
-- ====================================

-- 权限组表
CREATE TABLE IF NOT EXISTS sys_oauth_permission_group (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  group_key TEXT NOT NULL UNIQUE,       -- 权限组标识：user_read, r2_full
  group_name TEXT NOT NULL,             -- 权限组名称
  description TEXT,                     -- 描述
  permissions TEXT NOT NULL,            -- 权限列表 JSON
  sort_order INTEGER DEFAULT 0,         -- 排序
  status INTEGER DEFAULT 1,             -- 状态：0=禁用 1=正常
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 为客户端表添加权限组字段（如果不存在）
-- 客户端可以绑定多个权限组，权限 = 所有绑定权限组的权限并集（无自定义权限）
-- SQLite 不支持直接 ALTER TABLE ADD COLUMN IF NOT EXISTS，需要使用更复杂的方法
-- 这里我们假设字段不存在，如果已存在会报错但不影响其他功能
ALTER TABLE sys_oauth_client ADD COLUMN permission_group_ids TEXT DEFAULT '[]';

-- 初始化权限组数据
INSERT OR IGNORE INTO sys_oauth_permission_group (group_key, group_name, description, permissions, sort_order) VALUES
('user_read', '用户只读', '只读访问用户信息', '["system:user:read"]', 1),
('user_full', '用户管理', '完整的用户管理权限', '["system:user:read","system:user:create","system:user:update","system:user:delete"]', 2),
('role_read', '角色只读', '只读访问角色信息', '["system:role:read"]', 3),
('role_full', '角色管理', '完整的角色管理权限', '["system:role:read","system:role:create","system:role:update","system:role:delete","system:role:configPermissions","system:role:assignMenus"]', 4),
('r2_read', 'R2只读', '只读访问R2文件', '["r2:file:view","r2:folder:view"]', 5),
('r2_full', 'R2管理', '完整的R2管理权限', '["r2:file:view","r2:file:manage","r2:file:delete","r2:folder:view","r2:folder:create","r2:folder:delete"]', 6),
('kv_full', 'KV管理', '完整的KV存储权限', '["kv:key:list","kv:key:get","kv:key:set","kv:key:delete"]', 7),
('admin_all', '全部权限', '所有系统权限', '["*:*:*"]', 100);

-- OAuth 权限组管理菜单
INSERT OR IGNORE INTO sys_menu (parent_id, menu_name, menu_type, route_path, component_path, icon, sort_order, permission, menu_visible, menu_status) VALUES
((SELECT id FROM sys_menu WHERE menu_name = '系统管理' AND menu_type = 'M' AND parent_id = 0), '权限组', 'C', '/dashboard/system/oauth-groups', 'system/oauth/OAuthPermissionGroupManage', 'team', 8, 'oauth:group:read', 1, 1);

-- 权限组管理按钮权限
INSERT OR IGNORE INTO sys_menu (parent_id, menu_name, menu_type, permission, sort_order, menu_visible, menu_status) VALUES
((SELECT id FROM sys_menu WHERE route_path = '/dashboard/system/oauth-groups'), '新增权限组', 'F', 'oauth:group:create', 1, 0, 1),
((SELECT id FROM sys_menu WHERE route_path = '/dashboard/system/oauth-groups'), '编辑权限组', 'F', 'oauth:group:update', 2, 0, 1),
((SELECT id FROM sys_menu WHERE route_path = '/dashboard/system/oauth-groups'), '删除权限组', 'F', 'oauth:group:delete', 3, 0, 1);
