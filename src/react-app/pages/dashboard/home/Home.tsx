export default function DashboardHome() {
	return (
		<div style={{ padding: "20px", maxWidth: "1200px", margin: "0 auto" }}>
			<div style={{ marginBottom: "24px" }}>
				<h1 style={{ margin: 0, fontSize: "24px", fontWeight: "bold" }}>仪表盘首页</h1>
				<p style={{ margin: "8px 0 0 0", color: "#666" }}>欢迎使用 SQ Station 系统管理平台</p>
			</div>

			{/* 项目介绍 */}
			<div style={{
				background: "white",
				borderRadius: "8px",
				padding: "24px",
				boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
				marginBottom: "20px",
			}}>
				<h2 style={{ margin: "0 0 16px 0", fontSize: "18px", borderBottom: "1px solid #e8e8e8", paddingBottom: "12px" }}>
					关于项目
				</h2>
				<div style={{ lineHeight: "1.8", color: "#333" }}>
					<p style={{ marginBottom: "12px" }}>
						<strong>SQ Station</strong> 是一个基于 Cloudflare Workers 和 D1 数据库构建的现代化系统管理平台。
					</p>
					<p style={{ marginBottom: "12px" }}>
						本系统采用前后端分离架构，使用 React + TypeScript 作为前端框架，Hono 作为后端框架，
						完全部署在 Cloudflare 的边缘计算网络上，提供快速、可靠的全球访问体验。
					</p>
				</div>
			</div>

			{/* 技术栈 */}
			<div style={{
				background: "white",
				borderRadius: "8px",
				padding: "24px",
				boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
				marginBottom: "20px",
			}}>
				<h2 style={{ margin: "0 0 16px 0", fontSize: "18px", borderBottom: "1px solid #e8e8e8", paddingBottom: "12px" }}>
					技术栈
				</h2>
				<div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "16px" }}>
					<div style={{ padding: "12px", background: "#f5f5f5", borderRadius: "4px" }}>
						<div style={{ fontWeight: "bold", marginBottom: "8px", color: "#1890ff" }}>前端</div>
						<div style={{ fontSize: "14px", color: "#666" }}>
							React 18 + TypeScript<br />
							Vite + Ant Design<br />
							React Router
						</div>
					</div>
					<div style={{ padding: "12px", background: "#f5f5f5", borderRadius: "4px" }}>
						<div style={{ fontWeight: "bold", marginBottom: "8px", color: "#52c41a" }}>后端</div>
						<div style={{ fontSize: "14px", color: "#666" }}>
							Hono 框架<br />
							Cloudflare Workers<br />
							D1 数据库 (SQLite)
						</div>
					</div>
					<div style={{ padding: "12px", background: "#f5f5f5", borderRadius: "4px" }}>
						<div style={{ fontWeight: "bold", marginBottom: "8px", color: "#faad14" }}>认证</div>
						<div style={{ fontSize: "14px", color: "#666" }}>
							JWT Token 认证<br />
							基于 RBAC 权限模型<br />
							支持组织架构管理
						</div>
					</div>
					<div style={{ padding: "12px", background: "#f5f5f5", borderRadius: "4px" }}>
						<div style={{ fontWeight: "bold", marginBottom: "8px", color: "#722ed1" }}>特性</div>
						<div style={{ fontSize: "14px", color: "#666" }}>
							动态菜单配置<br />
							按钮级权限控制<br />
							KV 存储支持
						</div>
					</div>
				</div>
			</div>

			{/* 系统功能 */}
			<div style={{
				background: "white",
				borderRadius: "8px",
				padding: "24px",
				boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
				marginBottom: "20px",
			}}>
				<h2 style={{ margin: "0 0 16px 0", fontSize: "18px", borderBottom: "1px solid #e8e8e8", paddingBottom: "12px" }}>
					系统功能
				</h2>
				<div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "16px" }}>
					<div style={{ padding: "16px", border: "1px solid #e8e8e8", borderRadius: "6px", textAlign: "center" }}>
						<div style={{ fontSize: "32px", marginBottom: "8px" }}>👥</div>
						<div style={{ fontWeight: "bold", marginBottom: "4px" }}>用户管理</div>
						<div style={{ fontSize: "13px", color: "#999" }}>管理系统用户</div>
					</div>
					<div style={{ padding: "16px", border: "1px solid #e8e8e8", borderRadius: "6px", textAlign: "center" }}>
						<div style={{ fontSize: "32px", marginBottom: "8px" }}>🔑</div>
						<div style={{ fontWeight: "bold", marginBottom: "4px" }}>角色管理</div>
						<div style={{ fontSize: "13px", color: "#999" }}>配置角色权限</div>
					</div>
					<div style={{ padding: "16px", border: "1px solid #e8e8e8", borderRadius: "6px", textAlign: "center" }}>
						<div style={{ fontSize: "32px", marginBottom: "8px" }}>📋</div>
						<div style={{ fontWeight: "bold", marginBottom: "4px" }}>菜单管理</div>
						<div style={{ fontSize: "13px", color: "#999" }}>动态菜单配置</div>
					</div>
					<div style={{ padding: "16px", border: "1px solid #e8e8e8", borderRadius: "6px", textAlign: "center" }}>
						<div style={{ fontSize: "32px", marginBottom: "8px" }}>🏢</div>
						<div style={{ fontWeight: "bold", marginBottom: "4px" }}>组织管理</div>
						<div style={{ fontSize: "13px", color: "#999" }}>组织架构管理</div>
					</div>
					<div style={{ padding: "16px", border: "1px solid #e8e8e8", borderRadius: "6px", textAlign: "center" }}>
						<div style={{ fontSize: "32px", marginBottom: "8px" }}>🗄️</div>
						<div style={{ fontWeight: "bold", marginBottom: "4px" }}>KV 管理</div>
						<div style={{ fontSize: "13px", color: "#999" }}>键值存储管理</div>
					</div>
					<div style={{ padding: "16px", border: "1px solid #e8e8e8", borderRadius: "6px", textAlign: "center" }}>
						<div style={{ fontSize: "32px", marginBottom: "8px" }}>🔍</div>
						<div style={{ fontWeight: "bold", marginBottom: "4px" }}>表查询</div>
						<div style={{ fontSize: "13px", color: "#999" }}>SQL 查询工具</div>
					</div>
				</div>
			</div>

			{/* 快速开始 */}
			<div style={{
				background: "white",
				borderRadius: "8px",
				padding: "24px",
				boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
			}}>
				<h2 style={{ margin: "0 0 16px 0", fontSize: "18px", borderBottom: "1px solid #e8e8e8", paddingBottom: "12px" }}>
					快速开始
				</h2>
				<div style={{ lineHeight: "1.8", color: "#333" }}>
					<p style={{ marginBottom: "12px" }}>
						<strong>1. 用户与角色管理：</strong> 通过左侧菜单进入"用户管理"和"角色管理"页面，
						创建用户并分配角色。系统内置了超级管理员 (admin) 和普通用户 (user) 两个角色。
					</p>
					<p style={{ marginBottom: "12px" }}>
						<strong>2. 权限配置：</strong> 在角色管理中点击"配置权限"按钮，可以为角色分配详细的权限。
						系统支持到按钮级别的权限控制，父级目录可以级联勾选子权限。
					</p>
					<p style={{ marginBottom: "12px" }}>
						<strong>3. 菜单管理：</strong> 在"菜单管理"页面可以动态配置系统菜单结构，
						支持多级目录、菜单和按钮，每个菜单项可以配置对应的权限标识。
					</p>
					<p style={{ marginBottom: "0" }}>
						<strong>4. 组织管理：</strong> 支持按组织架构管理用户，用户可以属于多个组织，
						组织可以拥有独立的权限配置，组织成员会自动继承组织权限。
					</p>
				</div>
			</div>
		</div>
	);
}
