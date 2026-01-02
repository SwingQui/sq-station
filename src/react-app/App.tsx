import { useEffect, useState } from "react";
import { useAuth } from "./contexts/AuthContext";
import Login from "./pages/Login";
import Home from "./pages/Home";
import Page1 from "./pages/Page1";
import Page2 from "./pages/Page2";
import SystemHome from "./pages/system/Menu";
import SystemPage1 from "./pages/system/MenuPage1";
import SystemPage2 from "./pages/system/MenuPage2";
import TestKV from "./pages/system/TestKV";
import TestSQL from "./pages/system/TestSQL";
import UserManage from "./pages/system/UserManage";
import RoleManage from "./pages/system/RoleManage";
import MenuManage from "./pages/system/MenuManage";
import AdminLayout from "./layouts/AdminLayout";

// 页面标题映射
const pageTitles: Record<string, string> = {
	"/system": "系统首页",
	"/system/page1": "页面一",
	"/system/page2": "页面二",
	"/system/testKV": "KV管理",
	"/system/testSQL": "SQL查询",
	"/system/user": "用户管理",
	"/system/role": "角色管理",
	"/system/menu": "菜单管理",
};

function getPage() {
	const path = window.location.pathname;

	// 登录页面
	if (path === "/login") return <Login />;

	// 后台路由 /system/* - 需要认证
	if (path.startsWith("/system")) {
		let content: React.ReactNode;
		if (path === "/system" || path === "/system/") content = <SystemHome />;
		else if (path === "/system/page1") content = <SystemPage1 />;
		else if (path === "/system/page2") content = <SystemPage2 />;
		else if (path === "/system/testKV") content = <TestKV />;
		else if (path === "/system/testSQL") content = <TestSQL />;
		else if (path === "/system/user") content = <UserManage />;
		else if (path === "/system/role") content = <RoleManage />;
		else if (path === "/system/menu") content = <MenuManage />;
		else content = <SystemHome />;

		// 包裹在 AdminLayout 中
		return <AdminLayout title={pageTitles[path]}>{content}</AdminLayout>;
	}

	// 前台路由
	if (path === "/page1") return <Page1 />;
	if (path === "/page2") return <Page2 />;
	return <Home />;
}

function App() {
	const { isAuthenticated, isLoading } = useAuth();
	const [path, setPath] = useState(window.location.pathname);

	// 监听路由变化
	useEffect(() => {
		const handlePopState = () => setPath(window.location.pathname);

		// 拦截链接点击
		const handleClick = (e: MouseEvent) => {
			const target = (e.target as HTMLElement).closest("a");
			if (target && target.getAttribute("href")?.startsWith("/")) {
				e.preventDefault();
				const href = target.getAttribute("href")!;
				window.history.pushState({}, "", href);
				setPath(href);
			}
		};

		window.addEventListener("popstate", handlePopState);
		document.addEventListener("click", handleClick);

		return () => {
			window.removeEventListener("popstate", handlePopState);
			document.removeEventListener("click", handleClick);
		};
	}, []);

	// 检查后台路由认证
	if (path.startsWith("/system") && !isLoading && !isAuthenticated) {
		// 保存原路径并跳转到登录
		const redirect = encodeURIComponent(path);
		window.location.href = `/login?redirect=${redirect}`;
		return null;
	}

	return getPage();
}

export default App;
