export default function MenuPage1() {
	return (
		<div style={{ padding: "20px", textAlign: "center" }}>
			<h1>后台页面 1</h1>
			<nav>
				<a href="/menu">返回后台首页</a> | <a href="/menu/page2">后台页面 2</a> |{" "}
				<a href="/menu/testKV">KV 管理</a>
			</nav>
		</div>
	);
}
