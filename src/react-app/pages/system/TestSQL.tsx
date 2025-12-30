import { useState } from "react";

interface QueryResult {
	columns?: string[];
	rows?: any[][];
	error?: string;
	success?: boolean;
	message?: string;
	changes?: number;
	last_row_id?: number;
}

export default function TestSQL() {
	const [sqlInput, setSqlInput] = useState("SELECT * FROM sys_user LIMIT 10");
	const [result, setResult] = useState<QueryResult | null>(null);
	const [loading, setLoading] = useState(false);

	const executeQuery = async () => {
		if (!sqlInput.trim()) return;
		setLoading(true);
		setResult(null);
		try {
			const res = await fetch("/api/sql/query", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ sql: sqlInput }),
			});
			const data = await res.json();
			setResult(data);
		} catch (e) {
			setResult({ error: "执行失败: " + (e as Error).message });
		}
		setLoading(false);
	};

	const commonQueries = [
		{ label: "查看所有用户", sql: "SELECT * FROM sys_user" },
		{ label: "查看所有角色", sql: "SELECT * FROM sys_role" },
		{ label: "查看所有菜单", sql: "SELECT * FROM sys_menu ORDER BY sort_order" },
		{ label: "查看用户角色关联", sql: "SELECT * FROM sys_user_role" },
		{ label: "查看角色菜单关联", sql: "SELECT * FROM sys_role_menu" },
		{ label: "新增用户", sql: "INSERT INTO sys_user (username, password, nickname) VALUES ('test', '123456', '测试用户')" },
		{ label: "更新用户", sql: "UPDATE sys_user SET nickname = '新昵称' WHERE username = 'test'" },
		{ label: "删除用户", sql: "DELETE FROM sys_user WHERE username = 'test'" },
		{ label: "创建表", sql: "CREATE TABLE IF NOT EXISTS test_table (id INTEGER PRIMARY KEY, name TEXT)" },
		{ label: "删除表", sql: "DROP TABLE IF EXISTS test_table" },
	];

	return (
		<div style={{ padding: "20px", maxWidth: "1200px", margin: "0 auto" }}>
			<h1>SQL 执行工具</h1>
			<nav style={{ marginBottom: "20px" }}>
				<a href="/system">返回后台</a>
			</nav>

			{/* 常用操作 */}
			<div style={{ marginBottom: "20px" }}>
				<h3>常用操作</h3>
				<div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
					{commonQueries.map((q, i) => (
						<button
							key={i}
							onClick={() => setSqlInput(q.sql)}
							style={{
								padding: "6px 12px",
								fontSize: "13px",
								background: q.label.includes("删除") || q.label.includes("DROP") ? "#fff1f0" : "#f0f0f0",
								border: "1px solid #ddd",
								borderRadius: "4px",
								cursor: "pointer",
							}}
						>
							{q.label}
						</button>
					))}
				</div>
			</div>

			{/* SQL 输入 */}
			<div style={{ marginBottom: "20px" }}>
				<h3>SQL 语句 (支持 SELECT / INSERT / UPDATE / DELETE / CREATE / DROP 等)</h3>
				<textarea
					value={sqlInput}
					onChange={(e) => setSqlInput(e.target.value)}
					rows={5}
					style={{
						width: "100%",
						padding: "12px",
						fontFamily: "monospace",
						fontSize: "14px",
						border: "1px solid #ddd",
						borderRadius: "4px",
						resize: "vertical",
					}}
					placeholder="输入 SQL 语句..."
				/>
				<div style={{ marginTop: "10px" }}>
					<button
						onClick={executeQuery}
						disabled={loading}
						style={{
							padding: "10px 24px",
							fontSize: "14px",
							background: loading ? "#ccc" : "#1890ff",
							color: "white",
							border: "none",
							borderRadius: "4px",
							cursor: loading ? "not-allowed" : "pointer",
						}}
					>
						{loading ? "执行中..." : "执行 SQL"}
					</button>
				</div>
			</div>

			{/* 结果展示 */}
			{result && (
				<div>
					<h3>执行结果</h3>
					{result.error ? (
						<div style={{ padding: "12px", background: "#fff2f0", border: "1px solid #ffccc7", borderRadius: "4px", color: "#cf1322" }}>
							{result.error}
						</div>
					) : result.success ? (
						<div style={{ padding: "12px", background: "#f6ffed", border: "1px solid #b7eb8f", borderRadius: "4px", color: "#389e0d" }}>
							{result.message || "执行成功"}
							{result.changes !== undefined && <span> (影响 {result.changes} 行)</span>}
							{result.last_row_id !== undefined && <span> | ID: {result.last_row_id}</span>}
						</div>
					) : result.columns && result.rows ? (
						<div style={{ overflowX: "auto", border: "1px solid #ddd", borderRadius: "4px" }}>
							<table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
								<thead>
									<tr style={{ background: "#f5f5f5" }}>
										{result.columns.map((col, i) => (
											<th
												key={i}
												style={{
													padding: "10px",
													textAlign: "left",
													borderBottom: "2px solid #ddd",
													fontWeight: "600",
												}}
											>
												{col}
											</th>
										))}
									</tr>
								</thead>
								<tbody>
									{result.rows.length === 0 ? (
										<tr>
											<td colSpan={result.columns.length} style={{ padding: "20px", textAlign: "center", color: "#888" }}>
												无结果
											</td>
										</tr>
									) : (
										result.rows.map((row, i) => (
											<tr key={i} style={{ borderBottom: "1px solid #eee" }}>
												{result.columns!.map((_, j) => (
													<td
														key={j}
														style={{
															padding: "8px 10px",
															fontFamily: row[j] && typeof row[j] === "object" ? "monospace" : "inherit",
															fontSize: row[j] && typeof row[j] === "object" ? "11px" : "13px",
															maxWidth: "300px",
															overflow: "hidden",
															textOverflow: "ellipsis",
															whiteSpace: "nowrap",
														}}
														title={row[j] !== null ? String(row[j]) : "NULL"}
													>
														{row[j] !== null ? String(row[j]) : <span style={{ color: "#999" }}>NULL</span>}
													</td>
												))}
											</tr>
										))
									)}
								</tbody>
							</table>
							<div style={{ padding: "10px", background: "#f9f9f9", borderTop: "1px solid #ddd", fontSize: "12px", color: "#666" }}>
								共 {result.rows.length} 行
							</div>
						</div>
					) : null}
				</div>
			)}
		</div>
	);
}
