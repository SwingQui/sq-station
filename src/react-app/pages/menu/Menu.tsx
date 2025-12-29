export default function Menu() {
	return (
		<div style={{ padding: "20px", textAlign: "center" }}>
			<h1>后台管理</h1>
			<nav>
				<a href="/">返回前台</a> | <a href="/menu/page1">后台页面 1</a> |{" "}
				<a href="/menu/page2">后台页面 2</a> | <a href="/menu/testKV">KV 管理</a>
			</nav>
		</div>
	);
}
