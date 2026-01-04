import { useEffect, useState } from "react";
import { getUserList } from "../../../api/user";
import { getRoleList } from "../../../api/role";
import { getMenuList } from "../../../api/menu";
import { getOrganizationList } from "../../../api/organization";

export default function DashboardHome() {
	const [stats, setStats] = useState({
		userCount: 0,
		roleCount: 0,
		menuCount: 0,
		orgCount: 0,
	});
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		fetchStats();
	}, []);

	const fetchStats = async () => {
		try {
			// 使用规范的二次封装 API
			const [users, roles, menus, orgs] = await Promise.all([
				getUserList(),
				getRoleList(),
				getMenuList(),
				getOrganizationList(),
			]);

			setStats({
				userCount: users?.length || 0,
				roleCount: roles?.length || 0,
				menuCount: menus?.length || 0,
				orgCount: orgs?.length || 0,
			});
		} catch (e) {
			console.error("Failed to fetch stats:", e);
		} finally {
			setLoading(false);
		}
	};

	const StatCard = ({ title, value, icon, color }: { title: string; value: number; icon: string; color: string }) => (
		<div style={{
			background: "white",
			borderRadius: "8px",
			padding: "24px",
			boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
			flex: 1,
			minWidth: "200px",
		}}>
			<div style={{ display: "flex", alignItems: "center", marginBottom: "16px" }}>
				<div style={{
					fontSize: "32px",
					marginRight: "12px",
				}}>{icon}</div>
				<div style={{ fontSize: "14px", color: "#666" }}>{title}</div>
			</div>
			<div style={{ fontSize: "32px", fontWeight: "bold", color }}>{value}</div>
		</div>
	);

	return (
		<div style={{ padding: "20px", maxWidth: "1200px", margin: "0 auto" }}>
			<div style={{ marginBottom: "24px" }}>
				<h1 style={{ margin: 0, fontSize: "24px", fontWeight: "bold" }}>仪表盘首页</h1>
				<p style={{ margin: "8px 0 0 0", color: "#666" }}>欢迎使用系统管理平台</p>
			</div>

			{loading ? (
				<div style={{ textAlign: "center", padding: "40px", color: "#999" }}>加载中...</div>
			) : (
				<div style={{ display: "flex", gap: "20px", flexWrap: "wrap", marginBottom: "32px" }}>
					<StatCard title="用户总数" value={stats.userCount} icon="👥" color="#1890ff" />
					<StatCard title="角色总数" value={stats.roleCount} icon="🔑" color="#52c41a" />
					<StatCard title="菜单总数" value={stats.menuCount} icon="📋" color="#faad14" />
					<StatCard title="组织总数" value={stats.orgCount} icon="🏢" color="#722ed1" />
				</div>
			)}

			<div style={{
				background: "white",
				borderRadius: "8px",
				padding: "24px",
				boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
			}}>
				<h2 style={{ margin: "0 0 16px 0", fontSize: "18px" }}>快速导航</h2>
				<div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
					<a
						href="/dashboard/system/user"
						style={{
							padding: "8px 16px",
							background: "#1890ff",
							color: "white",
							textDecoration: "none",
							borderRadius: "4px",
							display: "inline-block",
						}}
					>
						用户管理
					</a>
					<a
						href="/dashboard/system/role"
						style={{
							padding: "8px 16px",
							background: "#52c41a",
							color: "white",
							textDecoration: "none",
							borderRadius: "4px",
							display: "inline-block",
						}}
					>
						角色管理
					</a>
					<a
						href="/dashboard/system/menu"
						style={{
							padding: "8px 16px",
							background: "#faad14",
							color: "white",
							textDecoration: "none",
							borderRadius: "4px",
							display: "inline-block",
						}}
					>
						菜单管理
					</a>
					<a
						href="/dashboard/system/organization"
						style={{
							padding: "8px 16px",
							background: "#722ed1",
							color: "white",
							textDecoration: "none",
							borderRadius: "4px",
							display: "inline-block",
						}}
					>
						组织管理
					</a>
				</div>
			</div>
		</div>
	);
}
