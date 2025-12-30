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

function getPage() {
	const path = window.location.pathname;

	// 后台路由 /system/*
	if (path.startsWith("/system")) {
		if (path === "/system" || path === "/system/") return <SystemHome />; // 系统首页
		if (path === "/system/page1") return <SystemPage1 />;
		if (path === "/system/page2") return <SystemPage2 />;
		if (path === "/system/testKV") return <TestKV />;
		if (path === "/system/testSQL") return <TestSQL />;
		if (path === "/system/user") return <UserManage />;
		if (path === "/system/role") return <RoleManage />;
		if (path === "/system/menu") return <MenuManage />;
		return <SystemHome />;
	}

	// 前台路由
	if (path === "/page1") return <Page1 />;
	if (path === "/page2") return <Page2 />;
	return <Home />;
}

function App() {
	return getPage();
}

export default App;
