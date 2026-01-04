import { useEffect, useState, Suspense, lazy } from "react";
import { useAuth } from "./contexts/AuthContext";
import { useTagsView } from "./contexts/TagsViewContext";
import { onRouteChange, navigate } from "./utils/router";
import { getMenus, MenuItem } from "./utils/auth";
import { matchRoute, isSystemRoute } from "./utils/routeMatcher";
import { TagsViewProvider } from "./contexts/TagsViewContext";
import AdminLayout from "./layouts/AdminLayout";

const Login = lazy(() => import("./pages/Login"));
const Forbidden = lazy(() => import("./pages/Forbidden"));
const NotFound = lazy(() => import("./pages/NotFound"));

/**
 * 获取页面标题（从菜单数据中获取）
 */
function getPageTitle(path: string): string {
	const menus = getMenus();

	function search(items: MenuItem[]): string | null {
		for (const item of items) {
			if (item.route_path === path && item.menu_type === "C") {
				return item.menu_name;
			}
			if (item.children && item.children.length > 0) {
				const found = search(item.children);
				if (found) return found;
			}
		}
		return null;
	}

	return search(menus) || "系统页面";
}

/**
 * 动态页面加载器
 */
function DynamicPage({ path }: { path: string }) {
	// 去除查询参数
	const cleanPath = path.split('?')[0];

	const [component, setComponent] = useState<React.ComponentType | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<"not-found" | "forbidden" | null>(null);

	useEffect(() => {
		async function loadPage() {
			setLoading(true);
			setError(null);

			try {
				const routeMatch = await matchRoute(cleanPath);

				if (!routeMatch.menuInfo) {
					setError("not-found");
					setLoading(false);
					return;
				}

				if (!routeMatch.hasPermission) {
					setError("forbidden");
					setLoading(false);
					return;
				}

				if (routeMatch.component) {
					setComponent(() => routeMatch.component);
				} else {
					setError("not-found");
				}
			} catch (e) {
				console.error("加载页面失败:", e);
				setError("not-found");
			} finally {
				setLoading(false);
			}
		}

		loadPage();
	}, [cleanPath]);

	if (loading) {
		return (
			<div style={{
				display: "flex",
				justifyContent: "center",
				alignItems: "center",
				height: "100vh",
				fontSize: "16px",
				color: "#666",
			}}>
				加载中...
			</div>
		);
	}

	if (error === "forbidden") {
		return <Forbidden />;
	}

	if (error === "not-found") {
		return <NotFound />;
	}

	if (component) {
		const Component = component;
		return <Component />;
	}

	return <NotFound />;
}

/**
 * 获取页面内容
 */
function getPageContent(path: string) {
	// 登录页特殊处理
	if (path === "/login") {
		return <Login />;
	}

	// 根路径：通过 DynamicPage 加载
	if (path === "/") {
		return <DynamicPage path={path} />;
	}

	// 其他路径动态加载
	return <DynamicPage path={path} />;
}

/**
 * 主应用内容
 */
function AppContent() {
	const { isAuthenticated, isLoading } = useAuth();
	const { addTab, setActiveTab } = useTagsView();
	const [path, setPath] = useState(window.location.pathname);

	// 监听路由变化
	useEffect(() => {
		const unsubscribe = onRouteChange((newPath) => {
			setPath(newPath);
			window.scrollTo(0, 0);

			// 添加标签页
			if (newPath.startsWith("/system") && newPath !== "/login") {
				// 如果访问 /system，重定向到 /system/home
				if (newPath === "/system") {
					navigate("/system/home", true);
					return;
				}

				const title = getPageTitle(newPath);
				addTab({
					key: newPath,
					title,
					closable: newPath !== "/system/home",
				});
				setActiveTab(newPath);
			}
		});

		// 监听浏览器后退/前进
		const handlePopState = () => {
			const newPath = window.location.pathname;
			setPath(newPath);

			if (newPath.startsWith("/system")) {
				setActiveTab(newPath);
			}
		};

		window.addEventListener("popstate", handlePopState);

		// 初始化：添加当前路由的标签
		if (path.startsWith("/system") && path !== "/login") {
			// 如果当前是 /system，重定向到 /system/home
			if (path === "/system") {
				navigate("/system/home", true);
				return;
			}

			const title = getPageTitle(path);
			addTab({
				key: path,
				title,
				closable: path !== "/system/home",
			});
		}

		return () => {
			unsubscribe();
			window.removeEventListener("popstate", handlePopState);
		};
	}, []);

	// 拦截链接点击
	useEffect(() => {
		const handleClick = (e: MouseEvent) => {
			const target = (e.target as HTMLElement).closest("a");
			if (target && target.getAttribute("href")?.startsWith("/")) {
				e.preventDefault();
				const href = target.getAttribute("href")!;
				navigate(href);
			}
		};

		document.addEventListener("click", handleClick);
		return () => {
			document.removeEventListener("click", handleClick);
		};
	}, []);

	// 系统路由（/login、/）直接渲染，不需要认证检查
	if (isSystemRoute(path)) {
		const content = getPageContent(path);
		return <Suspense fallback={<div style={{ padding: "20px" }}>加载中...</div>}>{content}</Suspense>;
	}

	// 检查后台路由认证
	if (path.startsWith("/system") && path !== "/login" && !isLoading && !isAuthenticated) {
		const redirect = encodeURIComponent(path);
		navigate(`/login?redirect=${redirect}`, true);
		// 返回 loading 状态，等待路由更新
		return <div style={{ padding: "20px" }}>跳转中...</div>;
	}

	// 获取页面内容
	const content = getPageContent(path);

	// 后台路由包裹 AdminLayout
	if (path.startsWith("/system") && path !== "/login") {
		return (
			<Suspense fallback={<div style={{ padding: "20px" }}>加载中...</div>}>
				<AdminLayout>{content}</AdminLayout>
			</Suspense>
		);
	}

	return <Suspense fallback={<div style={{ padding: "20px" }}>加载中...</div>}>{content}</Suspense>;
}

/**
 * 应用根组件
 */
function App() {
	return (
		<TagsViewProvider>
			<AppContent />
		</TagsViewProvider>
	);
}

export default App;
