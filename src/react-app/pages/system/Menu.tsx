export default function Menu() {
	return (
		<div style={{ padding: "20px", textAlign: "center" }}>
			<h1>后台管理 - 系统首页</h1>
			<nav>
				<a href="/">返回前台</a> | <a href="/system/page1">后台页面 1</a> |{" "}
				<a href="/system/page2">后台页面 2</a> | <a href="/system/user">用户管理</a> |{" "}
				<a href="/system/role">角色管理</a> | <a href="/system/menu">菜单管理</a> | <a href="/system/testKV">KV 管理</a> | <a href="/system/testSQL">SQL 查询</a>
			</nav>
		</div>
	);
}
