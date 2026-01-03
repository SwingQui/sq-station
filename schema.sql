-- ====================================
-- 若依风格权限系统数据库表结构
-- ====================================

-- 删除旧表（重新创建时使用）
DROP TABLE IF EXISTS sys_role_menu;
DROP TABLE IF EXISTS sys_user_role;
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
  is_cache INTEGER DEFAULT 0,  -- 是否缓存 0缓存 1不缓存
  menu_visible INTEGER DEFAULT 1,  -- 显示状态 1显示 0隐藏
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

-- ====================================
-- 初始化数据
-- ====================================

-- 初始化管理员账号
-- 密码已使用 PBKDF2-SHA256 加密（username 作为 salt）
-- admin 密码: admin13672210421
-- user 密码: user123
INSERT OR IGNORE INTO sys_user (id, username, password, nickname, status) VALUES
(1, 'admin', 'admin$9e97f7ff5e604b010c3ab72e59c239044e12e227016291f55f2cebb022943a10', '管理员', 1),
(2, 'user', 'user$a52197d73c0a6a5bec9a30fb0342759f1920ac154b0244376fa874f639338bec', '普通用户', 1);

-- 初始化角色
INSERT OR IGNORE INTO sys_role (id, role_name, role_key, sort_order, status) VALUES
(1, '超级管理员', 'admin', 1, 1),
(2, '普通用户', 'user', 2, 1);

-- ====================================
-- 初始化菜单 (参考若依设计)
-- ====================================

-- 系统首页（Dashboard）- 第一位
INSERT INTO sys_menu (parent_id, menu_name, menu_type, route_path, component_path, icon, sort_order, permission, menu_visible, menu_status) VALUES
(0, '系统首页', 'C', '/system', 'system/Menu', 'home', 1, 'system:dashboard', 1, 1);

-- 内容管理目录（第二位）
INSERT INTO sys_menu (parent_id, menu_name, menu_type, route_path, icon, sort_order, menu_visible, menu_status) VALUES
(0, '内容管理', 'M', NULL, 'content', 2, 1, 1);

-- 内容管理子菜单（前台页面）
INSERT INTO sys_menu (parent_id, menu_name, menu_type, route_path, component_path, icon, sort_order, permission, menu_visible, menu_status) VALUES
((SELECT id FROM sys_menu WHERE menu_name = '内容管理' AND menu_type = 'M'), '首页', 'C', '/', 'Home', 'home', 1, 'home:view', 1, 1);

-- 系统管理目录（第三位）
INSERT INTO sys_menu (parent_id, menu_name, menu_type, route_path, icon, sort_order, menu_visible, menu_status) VALUES
(0, '系统管理', 'M', NULL, 'setting', 3, 1, 1);

-- 系统管理子菜单
-- 获取系统管理目录的ID用于子菜单的 parent_id
INSERT INTO sys_menu (parent_id, menu_name, menu_type, route_path, component_path, icon, sort_order, permission, menu_visible, menu_status) VALUES
((SELECT id FROM sys_menu WHERE menu_name = '系统管理' AND menu_type = 'M'), '用户管理', 'C', '/system/user', 'system/UserManage', 'user', 1, 'system:user:list', 1, 1),
((SELECT id FROM sys_menu WHERE menu_name = '系统管理' AND menu_type = 'M'), '角色管理', 'C', '/system/role', 'system/RoleManage', 'role', 2, 'system:role:list', 1, 1),
((SELECT id FROM sys_menu WHERE menu_name = '系统管理' AND menu_type = 'M'), '菜单管理', 'C', '/system/menu', 'system/MenuManage', 'menu', 3, 'system:menu:list', 1, 1),
((SELECT id FROM sys_menu WHERE menu_name = '系统管理' AND menu_type = 'M'), 'KV管理', 'C', '/system/testKV', 'system/TestKV', 'database', 4, 'system:kv:view', 1, 1),
((SELECT id FROM sys_menu WHERE menu_name = '系统管理' AND menu_type = 'M'), '表查询', 'C', '/system/sqlSearch', 'system/SQLSearch', 'database', 5, 'system:sqlSearch', 1, 1);

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
(2, (SELECT id FROM sys_menu WHERE route_path = '/system'));                    -- 系统首页

-- ====================================
-- 按钮级权限
-- ====================================
-- 用户管理按钮权限
INSERT OR IGNORE INTO sys_menu (parent_id, menu_name, menu_type, permission, sort_order, menu_visible, menu_status) VALUES
((SELECT id FROM sys_menu WHERE route_path = '/system/user'), '新增用户', 'F', 'system:user:add', 1, 0, 1),
((SELECT id FROM sys_menu WHERE route_path = '/system/user'), '编辑用户', 'F', 'system:user:edit', 2, 0, 1),
((SELECT id FROM sys_menu WHERE route_path = '/system/user'), '删除用户', 'F', 'system:user:delete', 3, 0, 1),
((SELECT id FROM sys_menu WHERE route_path = '/system/user'), '分配角色', 'F', 'system:user:assignRoles', 4, 0, 1);

-- 角色管理按钮权限
INSERT OR IGNORE INTO sys_menu (parent_id, menu_name, menu_type, permission, sort_order, menu_visible, menu_status) VALUES
((SELECT id FROM sys_menu WHERE route_path = '/system/role'), '新增角色', 'F', 'system:role:add', 1, 0, 1),
((SELECT id FROM sys_menu WHERE route_path = '/system/role'), '编辑角色', 'F', 'system:role:edit', 2, 0, 1),
((SELECT id FROM sys_menu WHERE route_path = '/system/role'), '删除角色', 'F', 'system:role:delete', 3, 0, 1),
((SELECT id FROM sys_menu WHERE route_path = '/system/role'), '分配菜单', 'F', 'system:role:assignMenus', 4, 0, 1);

-- 菜单管理按钮权限
INSERT OR IGNORE INTO sys_menu (parent_id, menu_name, menu_type, permission, sort_order, menu_visible, menu_status) VALUES
((SELECT id FROM sys_menu WHERE route_path = '/system/menu'), '新增菜单', 'F', 'system:menu:add', 1, 0, 1),
((SELECT id FROM sys_menu WHERE route_path = '/system/menu'), '编辑菜单', 'F', 'system:menu:edit', 2, 0, 1),
((SELECT id FROM sys_menu WHERE route_path = '/system/menu'), '删除菜单', 'F', 'system:menu:delete', 3, 0, 1);

-- 确保超级管理员拥有所有权限（包括新添加的按钮权限）
INSERT OR IGNORE INTO sys_role_menu (role_id, menu_id)
SELECT 1, id FROM sys_menu WHERE NOT EXISTS (
	SELECT 1 FROM sys_role_menu WHERE role_id = 1 AND menu_id = sys_menu.id
);
