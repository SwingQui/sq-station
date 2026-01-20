# SQ Station

> 基于 Cloudflare Workers 的全栈应用开发平台

一个功能完整的全栈应用模板，集成了用户管理、权限控制、对象存储等功能，部署在 Cloudflare Workers 边缘计算平台。

![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-Workers-F38020?logo=cloudflare)
![React](https://img.shields.io/badge/React-19.2.1-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8.3-3178C6?logo=typescript)
![Vite](https://img.shields.io/badge/Vite-6.0.0-646CFF?logo=vite)

## 特性

### 核心功能

- **🔐 完善的权限系统** - 基于 RBAC 的权限控制，支持 7 大模块、59 种权限
- **👥 用户/角色/菜单管理** - 完整的系统管理功能
- **🏢 组织架构管理** - 支持多级组织结构和数据权限
- **🌐 OAuth 2.0 集成** - 支持 Client Credentials 授权流程，权限组动态管理
- **📦 R2 对象存储** - 文件上传下载、文件夹管理
- **🗄️ KV 存储** - 键值对管理，Schema 版本控制
- **🔍 SQL 执行工具** - 在线 SQL 查询和管理
- **🎨 前台配置** - 书签导航管理等前台功能

### 技术亮点

- ⚡ **边缘计算** - 部署在 Cloudflare 全球网络
- 🔥 **热模块替换** - 前端开发支持 HMR
- 📦 **TypeScript** - 全栈类型安全
- 🎯 **接口缓存** - 内置 GET 请求缓存机制
- 🔄 **双向同步** - 完善的数据同步工具（KV/D1/Schema）
- 📊 **Excel 导入导出** - 内置数据处理功能

## 技术栈

| 类型 | 技术 |
|------|------|
| **后端框架** | Hono 4.11.1 |
| **运行平台** | Cloudflare Workers |
| **前端框架** | React 19.2.1 |
| **开发语言** | TypeScript 5.8.3 |
| **构建工具** | Vite 6.0.0 |
| **UI 组件** | Ant Design 6.1.3 |
| **数据库** | D1 (SQLite) |
| **KV 存储** | Cloudflare Workers KV |
| **对象存储** | Cloudflare R2 |
| **工具库** | ExcelJS, Zod, Crypto-JS |

## 快速开始

### 安装依赖

```bash
npm install
```

### 环境配置

1. 配置 Cloudflare API Token：

```bash
cp .dev.vars.example .dev.vars
# 编辑 .dev.vars 文件，填入你的 API Token
```

2. 获取 API Token：访问 https://dash.cloudflare.com/profile/api-tokens

### 初始化开发环境

```bash
npm run init
```

### 启动开发服务

```bash
# 终端 1：启动前端（支持热更新）
npm run dev

# 终端 2：启动后端
npm run wrangler
```

访问 http://localhost:5173 查看应用

## 项目结构

```
sq-station/
├── src/
│   ├── worker/              # 后端代码
│   │   ├── controllers/     # 控制器（处理 HTTP 请求）
│   │   ├── services/        # 服务层（业务逻辑）
│   │   ├── repositories/    # 数据访问层
│   │   ├── middleware/      # 中间件（认证、权限、缓存）
│   │   ├── constants/       # 权限常量定义
│   │   └── index.ts         # 应用入口
│   │
│   └── react-app/           # 前端代码
│       ├── pages/           # 页面组件
│       ├── hooks/           # React Hooks
│       ├── services/        # API 服务
│       └── utils/           # 工具函数
│
├── scripts/                # 同步脚本
│   ├── sync-kv.cjs        # KV 数据同步
│   ├── sync-d1.cjs        # D1 数据同步
│   └── sync-schema-data.cjs  # Schema 数据同步
│
├── sql/                   # 数据库相关
│   ├── schema.sql         # 数据库结构
│   ├── schema-data.json   # 初始数据
│   └── kv-schema.json     # KV 数据定义
│
└── doc/                   # 项目文档
```

## 功能模块

### 系统管理

- **用户管理** - 用户 CRUD、角色分配、密码管理
- **角色管理** - 角色 CRUD、菜单权限分配
- **菜单管理** - 菜单树管理、路由配置
- **组织管理** - 组织架构管理、数据权限

### OAuth 2.0

- **客户端管理** - OAuth 客户端 CRUD、密钥管理
- **权限组管理** - 预定义权限模板、动态权限更新
- **Token 颁发** - Client Credentials 授权流程

### 存储管理

- **KV 存储** - 键值对管理、Schema 版本控制
- **R2 存储** - 文件上传下载、文件夹管理、元数据管理

### 开发工具

- **SQL 执行器** - 在线 SQL 查询和管理
- **数据同步** - KV/D1/Schema 双向同步工具

## 常用命令

### 开发

```bash
npm run dev              # 启动前端开发服务器（Vite）
npm run wrangler         # 启动后端开发服务器
npm run dev:auto         # 自动同步数据 + 启动后端
npm run dev:remote       # 直连远程数据开发
```

### 数据同步

```bash
# KV 同步
npm run kv:import        # 远程 → 本地
npm run kv:export        # 本地 → 远程（自动备份）
npm run kv:migrate       # 应用 schema 到远程 KV

# D1 同步
npm run d1:migrate       # 初始化远程表结构
npm run d1:import        # 远程 → 本地
npm run d1:export        # 本地 → 远程（自动备份）

# Schema 数据同步
npm run schema:remote-to-schema  # 远程 → schema-data.json
npm run schema:schema-to-remote  # schema-data.json → 远程
```

### 构建 & 部署

```bash
npm run build            # TypeScript 编译 + Vite 打包
npm run deploy           # 部署到 Cloudflare Workers
npm run check            # 完整检查（TS + 打包 + 部署预演）
npm run preview          # 构建并预览
```

## 部署

项目支持两种部署方式：

### 方式一：GitHub Actions（推荐）

**特点**：只有打标签时才触发部署

```bash
# 打标签并推送（自动触发部署）
git tag v0.1.2
git push origin v0.1.2
```

详细配置：[部署指南](./doc/deploy-guide.md)

### 方式二：Cloudflare Git Integration

**特点**：配置简单，每次推送主分支自动部署

详细配置：[简化部署指南](./doc/deploy-guide-simple.md)

### 部署方式对比

| 方式 | Tag 触发 | 配置难度 | 适用场景 |
|------|---------|---------|---------|
| GitHub Actions | ✅ | ⭐⭐⭐ | 需要严格控制部署时机 |
| Git Integration | ❌ | ⭐ | 每次推送自动部署 |

详细对比：[部署方式对比](./doc/deploy-comparison.md)

## 文档

- [开发指导](./doc/开发指导.md) - 完整的开发文档
- [部署指南](./doc/deploy-guide.md) - GitHub Actions 部署配置
- [简化部署指南](./doc/deploy-guide-simple.md) - Git Integration 部署方式
- [部署方式对比](./doc/deploy-comparison.md) - 部署方案选择指南

## API 接口

### 认证授权

```
POST /api/auth/login          # 用户登录
POST /api/auth/logout         # 用户登出
GET  /api/auth/me             # 获取当前用户
GET  /api/user/:id/menus      # 获取用户菜单
GET  /api/user/:id/permissions # 获取用户权限
```

### 系统管理

```
GET/POST/PUT/DELETE /api/users          # 用户管理
GET/POST/PUT/DELETE /api/roles          # 角色管理
GET/POST/PUT/DELETE /api/menus          # 菜单管理
GET/POST/PUT/DELETE /api/organizations  # 组织管理
POST /api/sql/query                     # SQL 执行
```

### OAuth 2.0

```
POST /oauth/token                       # 获取 Access Token
GET/POST/PUT/DELETE /api/oauth/clients  # 客户端管理
GET/POST/PUT/DELETE /api/oauth/permission-groups  # 权限组管理
```

### 存储管理

```
# KV 存储
GET    /api/kv           # 列出所有 key
GET    /api/kv/:key      # 获取值
PUT    /api/kv/:key      # 设置值
DELETE /api/kv/:key      # 删除值

# R2 存储
GET    /api/r2           # 列出所有对象
GET    /api/r2/:key      # 获取对象
PUT    /api/r2/:key      # 上传对象
DELETE /api/r2/:key      # 删除对象
```

完整 API 文档请参考 [开发指导](./doc/开发指导.md)

## 贡献

欢迎提交 Issue 和 Pull Request！

## 许可证

MIT

---

**当前版本**：v0.1.1

**最后更新**：2026-01-20
