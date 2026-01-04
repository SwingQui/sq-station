import { useState, useEffect } from "react";
import { post } from "../../utils/request";

interface TableData {
	columns: string[];
	rows: unknown[][];
}

export default function SQLSearch() {
	const [tables, setTables] = useState<string[]>([]);
	const [selectedTable, setSelectedTable] = useState<string | null>(null);
	const [tableData, setTableData] = useState<TableData | null>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// 加载所有表名
	const loadTables = async () => {
		setLoading(true);
		setError(null);
		try {
			const result = await post<{ columns: string[]; rows: unknown[][] }>("/api/sql/query", {
				sql: "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name",
			});
			// 提取表名（result.rows 是二维数组，每个元素是一行数据）
			const tableNames = result.rows.map((row) => row[0] as string);
			setTables(tableNames);
		} catch (e: unknown) {
			setError(e instanceof Error ? e.message : "加载表列表失败");
		}
		setLoading(false);
	};

	// 加载表数据
	const loadTableData = async (tableName: string) => {
		setLoading(true);
		setError(null);
		try {
			const result = await post<{ columns: string[]; rows: unknown[][] }>("/api/sql/query", {
				sql: `SELECT * FROM ${tableName} LIMIT 100`,
			});
			setTableData(result);
			setSelectedTable(tableName);
		} catch (e: unknown) {
			setError(e instanceof Error ? e.message : "加载表数据失败");
		}
		setLoading(false);
	};

	// 组件挂载时加载表列表
	useEffect(() => {
		loadTables();
	}, []);

	return (
		<div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
			<h2 style={{ marginBottom: "20px", padding: "0 20px" }}>表查询</h2>

			{error && (
				<div style={{
					padding: "10px",
					marginBottom: "15px",
					background: "#fee",
					border: "1px solid #fcc",
					borderRadius: "4px",
					color: "#c33",
				}}>
					{error}
				</div>
			)}

			<div style={{ display: "flex", gap: "20px", flex: 1, minHeight: 0 }}>
				{/* 左侧：表列表 */}
				<div style={{
					width: "250px",
					border: "1px solid #ddd",
					borderRadius: "6px",
					overflow: "hidden",
					display: "flex",
					flexDirection: "column",
				}}>
					<div style={{
						padding: "10px 15px",
						background: "#f5f5f5",
						borderBottom: "1px solid #ddd",
						fontWeight: "bold",
						display: "flex",
						justifyContent: "space-between",
						alignItems: "center",
					}}>
						<span>表列表 ({tables.length})</span>
						<button
							onClick={loadTables}
							style={{
								padding: "4px 10px",
								fontSize: "12px",
								cursor: "pointer",
								background: "#fff",
								border: "1px solid #ccc",
								borderRadius: "3px",
							}}
							disabled={loading}
						>
							刷新
						</button>
					</div>
					<div style={{
						flex: 1,
						overflowY: "auto",
						padding: "5px",
					}}>
						{tables.length === 0 ? (
							<p style={{ padding: "15px", color: "#999", textAlign: "center" }}>
								{loading ? "加载中..." : "暂无表"}
							</p>
						) : (
							<ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
								{tables.map((table) => (
									<li
										key={table}
										onClick={() => loadTableData(table)}
										style={{
											padding: "8px 12px",
											cursor: "pointer",
											borderRadius: "4px",
											background: selectedTable === table ? "#1890ff" : "transparent",
											color: selectedTable === table ? "#fff" : "#333",
											transition: "background 0.2s",
										}}
										onMouseEnter={(e) => {
											if (selectedTable !== table) {
												e.currentTarget.style.background = "#f0f0f0";
											}
										}}
										onMouseLeave={(e) => {
											if (selectedTable !== table) {
												e.currentTarget.style.background = "transparent";
											}
										}}
									>
										{table}
									</li>
								))}
							</ul>
						)}
					</div>
				</div>

				{/* 右侧：表数据 */}
				<div style={{
					flex: 1,
					border: "1px solid #ddd",
					borderRadius: "6px",
					overflow: "hidden",
					display: "flex",
					flexDirection: "column",
				}}>
					<div style={{
						padding: "10px 15px",
						background: "#f5f5f5",
						borderBottom: "1px solid #ddd",
						fontWeight: "bold",
					}}>
						{selectedTable ? `数据: ${selectedTable}` : "请选择一个表"}
					</div>
					<div style={{
						flex: 1,
						overflow: "auto",
						padding: "15px",
					}}>
						{loading ? (
							<p style={{ textAlign: "center", color: "#999" }}>加载中...</p>
						) : !tableData ? (
							<p style={{ textAlign: "center", color: "#999", marginTop: "50px" }}>
								点击左侧表名查看数据
							</p>
						) : tableData.rows.length === 0 ? (
							<p style={{ textAlign: "center", color: "#999" }}>该表暂无数据</p>
						) : (
							<table style={{
								width: "100%",
								borderCollapse: "collapse",
								fontSize: "13px",
							}}>
								<thead>
									<tr style={{
										background: "#fafafa",
										position: "sticky",
										top: 0,
									}}>
										{tableData.columns.map((col, idx) => (
											<th
												key={idx}
												style={{
													border: "1px solid #e8e8e8",
													padding: "8px 12px",
													textAlign: "left",
													fontWeight: "600",
													background: "#fafafa",
												}}
											>
												{col}
											</th>
										))}
									</tr>
								</thead>
								<tbody>
									{tableData.rows.map((row, rowIdx) => (
										<tr key={rowIdx}>
											{row.map((cell, cellIdx) => (
												<td
													key={cellIdx}
													style={{
														border: "1px solid #e8e8e8",
														padding: "6px 12px",
														maxWidth: "300px",
														overflow: "hidden",
														textOverflow: "ellipsis",
														whiteSpace: "nowrap",
													}}
													title={String(cell ?? "")}
												>
													{cell === null ? (
														<span style={{ color: "#ccc" }}>NULL</span>
													) : cell === "" ? (
														<span style={{ color: "#ccc" }}>(空)</span>
													) : (
														String(cell)
													)}
												</td>
											))}
										</tr>
									))}
								</tbody>
							</table>
						)}
					</div>
					{tableData && tableData.rows.length > 0 && (
						<div style={{
							padding: "8px 15px",
							background: "#f9f9f9",
							borderTop: "1px solid #ddd",
							fontSize: "12px",
							color: "#666",
						}}>
							共 {tableData.rows.length} 条记录（最多显示 100 条）
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
