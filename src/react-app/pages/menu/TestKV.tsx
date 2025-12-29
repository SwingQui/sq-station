import { useState, useEffect } from "react";

interface KVKey {
	name: string;
	metadata?: Record<string, unknown>;
}

export default function TestKV() {
	const [keys, setKeys] = useState<KVKey[]>([]);
	const [loading, setLoading] = useState(false);
	const [keyInput, setKeyInput] = useState("");
	const [valueInput, setValueInput] = useState("");
	const [selectedKey, setSelectedKey] = useState<string | null>(null);
	const [selectedValue, setSelectedValue] = useState("");

	// 加载所有 keys
	const loadKeys = async () => {
		setLoading(true);
		try {
			const res = await fetch("/api/kv");
			const data = await res.json();
			setKeys(data.keys || []);
		} catch (e) {
			console.error("加载失败", e);
		}
		setLoading(false);
	};

	// 获取单个值
	const loadValue = async (key: string) => {
		try {
			const res = await fetch(`/api/kv/${encodeURIComponent(key)}`);
			const data = await res.json();
			setSelectedKey(key);
			setSelectedValue(data.value || "");
		} catch (e) {
			console.error("加载值失败", e);
		}
	};

	// 创建/更新
	const saveValue = async () => {
		if (!keyInput.trim()) return;
		try {
			await fetch(`/api/kv/${encodeURIComponent(keyInput)}`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ value: valueInput }),
			});
			setKeyInput("");
			setValueInput("");
			loadKeys();
		} catch (e) {
			console.error("保存失败", e);
		}
	};

	// 删除
	const deleteKey = async (key: string) => {
		try {
			await fetch(`/api/kv/${encodeURIComponent(key)}`, { method: "DELETE" });
			if (selectedKey === key) {
				setSelectedKey(null);
				setSelectedValue("");
			}
			loadKeys();
		} catch (e) {
			console.error("删除失败", e);
		}
	};

	// 更新当前选中的值
	const updateCurrentValue = async () => {
		if (!selectedKey) return;
		try {
			await fetch(`/api/kv/${encodeURIComponent(selectedKey)}`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ value: selectedValue }),
			});
			loadKeys();
		} catch (e) {
			console.error("更新失败", e);
		}
	};

	useEffect(() => {
		loadKeys();
	}, []);

	return (
		<div style={{ padding: "20px", maxWidth: "800px", margin: "0 auto" }}>
			<h1>KV 管理</h1>
			<nav style={{ marginBottom: "20px" }}>
				<a href="/menu">返回后台</a>
			</nav>

			{/* 新增 */}
			<div style={{ marginBottom: "30px", padding: "15px", background: "#f5f5f5", borderRadius: "8px" }}>
				<h3>新增/修改 KV</h3>
				<div style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
					<input
						type="text"
						placeholder="Key"
						value={keyInput}
						onChange={(e) => setKeyInput(e.target.value)}
						style={{ flex: 1, padding: "8px" }}
					/>
					<button onClick={saveValue} style={{ padding: "8px 16px" }}>
						保存
					</button>
				</div>
				<textarea
					placeholder="Value"
					value={valueInput}
					onChange={(e) => setValueInput(e.target.value)}
					rows={3}
					style={{ width: "100%", padding: "8px" }}
				/>
			</div>

			{/* 列表 */}
			<div style={{ marginBottom: "30px" }}>
				<h3>
					KV 列表 ({keys.length}){" "}
					<button onClick={loadKeys} style={{ marginLeft: "10px", fontSize: "12px" }}>
						刷新
					</button>
				</h3>
				{loading ? (
					<p>加载中...</p>
				) : keys.length === 0 ? (
					<p>暂无数据</p>
				) : (
					<ul style={{ listStyle: "none", padding: 0 }}>
						{keys.map((k) => (
							<li
								key={k.name}
								style={{
									padding: "10px",
									borderBottom: "1px solid #eee",
									display: "flex",
									justifyContent: "space-between",
									alignItems: "center",
								}}
							>
								<span style={{ cursor: "pointer" }} onClick={() => loadValue(k.name)}>
									{k.name}
								</span>
								<button
									onClick={() => deleteKey(k.name)}
									style={{ padding: "4px 8px", background: "#ff4444", color: "white", border: "none", borderRadius: "4px" }}
								>
									删除
								</button>
							</li>
						))}
					</ul>
				)}
			</div>

			{/* 编辑选中项 */}
			{selectedKey && (
				<div style={{ padding: "15px", background: "#e8f4f8", borderRadius: "8px" }}>
					<h3>编辑: {selectedKey}</h3>
					<textarea
						value={selectedValue}
						onChange={(e) => setSelectedValue(e.target.value)}
						rows={5}
						style={{ width: "100%", padding: "8px", marginBottom: "10px" }}
					/>
					<div>
						<button onClick={updateCurrentValue} style={{ padding: "8px 16px" }}>
							更新
						</button>
						<button
							onClick={() => {
								setSelectedKey(null);
								setSelectedValue("");
							}}
							style={{ padding: "8px 16px", marginLeft: "10px" }}
						>
							关闭
						</button>
					</div>
				</div>
			)}
		</div>
	);
}
