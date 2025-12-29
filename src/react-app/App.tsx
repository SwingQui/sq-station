import Home from "./pages/Home";
import Page1 from "./pages/Page1";
import Page2 from "./pages/Page2";
import Menu from "./pages/menu/Menu";
import MenuPage1 from "./pages/menu/MenuPage1";
import MenuPage2 from "./pages/menu/MenuPage2";
import TestKV from "./pages/menu/TestKV";

function getPage() {
	const path = window.location.pathname;

	// 后台路由
	if (path.startsWith("/menu")) {
		if (path === "/menu" || path === "/menu/") return <Menu />;
		if (path === "/menu/page1") return <MenuPage1 />;
		if (path === "/menu/page2") return <MenuPage2 />;
		if (path === "/menu/testKV") return <TestKV />;
		return <Menu />;
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
