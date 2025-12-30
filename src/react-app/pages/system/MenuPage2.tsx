export default function MenuPage2() {
	return (
		<div style={{ padding: "20px", textAlign: "center" }}>
			<h1>后台页面 2</h1>
			<nav>
				<a href="/menu">返回后台首页</a> | <a href="/menu/page1">后台页面 1</a> |{" "}
				<a href="/menu/testKV">KV 管理</a>
			</nav>
		</div>
	);
}
