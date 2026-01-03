/**
 * 系统首页（后台首页）
 */

export default function SystemHome() {
	return (
		<div style={{
			padding: "24px",
		}}>
			<h1 style={{ fontSize: "24px", fontWeight: "bold", marginBottom: "16px" }}>
				欢迎使用系统
			</h1>
			<div style={{
				background: "#fff",
				padding: "24px",
				borderRadius: "8px",
				boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
			}}>
				<p style={{ fontSize: "16px", color: "#666" }}>
					系统首页内容
				</p>
			</div>
		</div>
	);
}
