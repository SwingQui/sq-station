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
  UNIQUE(user_id, role_id)
);

-- 角色菜单关联表 (逻辑外键，无物理约束)
CREATE TABLE IF NOT EXISTS sys_role_menu (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  role_id INTEGER NOT NULL,
  menu_id INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(role_id, menu_id)
);

-- ====================================
-- 初始化数据
-- ====================================

-- 初始化管理员账号 (密码: admin123，实际应使用 bcrypt)
INSERT OR IGNORE INTO sys_user (id, username, password, nickname, status) VALUES
(1, 'admin', 'admin123', '管理员', 1),
(2, 'user', 'user123', '普通用户', 1);

-- 初始化角色
INSERT OR IGNORE INTO sys_role (id, role_name, role_key, sort_order, status) VALUES
(1, '超级管理员', 'admin', 1, 1),
(2, '普通用户', 'user', 2, 1);

-- 初始化菜单 (基于现有页面结构)
INSERT INTO sys_menu (parent_id, menu_name, menu_type, route_path, component_path, icon, sort_order, permission, menu_visible, menu_status) VALUES
-- 根目录
(0, '首页', 'C', '/', 'Home', 'Home', 1, 'home:view', 1, 1),
(0, '页面一', 'C', '/page1', 'Page1', 'Page1', 2, 'page1:view', 1, 1),
(0, '页面二', 'C', '/page2', 'Page2', 'Page2', 3, 'page2:view', 1, 1),

-- 系统管理目录
(0, '系统管理', 'M', '/system', NULL, 'Setting', 100, NULL, 1, 1),
-- 系统管理子菜单
((SELECT id FROM sys_menu WHERE route_path = '/system'), '页面一', 'C', '/system/page1', 'system/MenuPage1', 'Page1', 1, 'system:page1:view', 1, 1),
((SELECT id FROM sys_menu WHERE route_path = '/system'), '页面二', 'C', '/system/page2', 'system/MenuPage2', 'Page2', 2, 'system:page2:view', 1, 1),
((SELECT id FROM sys_menu WHERE route_path = '/system'), '用户管理', 'C', '/system/user', 'system/UserManage', 'User', 3, 'system:user:list', 1, 1),
((SELECT id FROM sys_menu WHERE route_path = '/system'), '角色管理', 'C', '/system/role', 'system/RoleManage', 'Role', 4, 'system:role:list', 1, 1),
((SELECT id FROM sys_menu WHERE route_path = '/system'), '菜单管理', 'C', '/system/menu', 'system/MenuManage', 'Menu', 5, 'system:menu:list', 1, 1),
((SELECT id FROM sys_menu WHERE route_path = '/system'), 'KV管理', 'C', '/system/testKV', 'system/TestKV', 'Database', 6, 'system:kv:view', 1, 1);

-- 用户角色关联
INSERT OR IGNORE INTO sys_user_role (id, user_id, role_id) VALUES
(1, 1, 1),  -- admin -> 超级管理员
(2, 2, 2);  -- user -> 普通用户

-- 角色菜单关联 (超级管理员拥有所有权限)
INSERT OR IGNORE INTO sys_role_menu (role_id, menu_id)
SELECT 1, id FROM sys_menu;

-- 角色菜单关联 (普通用户只能访问首页和页面一)
INSERT OR IGNORE INTO sys_role_menu (role_id, menu_id) VALUES
(2, (SELECT id FROM sys_menu WHERE route_path = '/')),
(2, (SELECT id FROM sys_menu WHERE route_path = '/page1'));
