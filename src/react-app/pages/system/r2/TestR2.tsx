import { useState, useEffect, useRef } from "react";
import { Modal } from "antd";
import {
	getR2List,
	getR2Metadata,
	uploadR2Value,
	uploadR2File,
	deleteR2Object,
	batchDeleteR2Objects,
	downloadR2Object,
	type R2Object,
} from "../../../api/r2";
import { handleError, handleSuccess } from "../../../utils/error-handler";

export default function TestR2() {
	const [objects, setObjects] = useState<R2Object[]>([]);
	const [loading, setLoading] = useState(false);
	const [keyInput, setKeyInput] = useState("");
	const [valueInput, setValueInput] = useState("");
	const [selectedKey, setSelectedKey] = useState<string | null>(null);
	const [selectedMetadata, setSelectedMetadata] = useState<R2Object | null>(null);
	const [uploadProgress, setUploadProgress] = useState(0);
	const [contentType, setContentType] = useState("text/plain");
	const fileInputRef = useRef<HTMLInputElement>(null);

	// 加载所有对象
	const loadObjects = async () => {
		setLoading(true);
		try {
			const data = await getR2List(100);
			setObjects(data.objects || []);
		} catch (e) {
			console.error("加载失败", e);
		}
		setLoading(false);
	};

	// 获取对象元数据
	const loadMetadata = async (key: string) => {
		try {
			const data = await getR2Metadata(key);
			setSelectedKey(key);
			setSelectedMetadata(data);
		} catch (e) {
			console.error("加载元数据失败", e);
		}
	};

	// 上传文本值
	const saveValue = async () => {
		if (!keyInput.trim()) return;
		try {
			await uploadR2Value(keyInput, valueInput, {
				httpMetadata: { contentType },
			});
			setKeyInput("");
			setValueInput("");
			loadObjects();
		} catch (e) {
			console.error("保存失败", e);
		}
	};

	// 上传文件
	const uploadFile = async (file: File) => {
		// 文件大小限制：200MB
		const maxSize = 200 * 1024 * 1024; // 200MB in bytes
		if (file.size > maxSize) {
			handleError(new Error(`文件大小超过限制！最大允许 200MB，当前文件大小：${formatSize(file.size)}`), "文件过大");
			return;
		}

		// 生成固定格式的文件名：sq-原文件名-日期
		const originalName = file.name.replace(/\.[^/.]+$/, ""); // 去掉扩展名
		const extension = file.name.substring(file.name.lastIndexOf(".")); // 获取扩展名
		const date = new Date().toISOString().split("T")[0].replace(/-/g, ""); // YYYYMMDD
		const fixedKeyName = `sq-${originalName}-${date}${extension}`;

		try {
			setUploadProgress(0);
			await uploadR2File(fixedKeyName, file);
			setUploadProgress(100);
			setKeyInput("");
			loadObjects();
			handleSuccess(`文件 "${fixedKeyName}" 上传成功`);
			setTimeout(() => setUploadProgress(0), 1000);
		} catch (e) {
			setUploadProgress(0);
			handleError(e, "上传失败");
		}
	};

	// 删除对象
	const deleteObject = async (key: string) => {
		Modal.confirm({
			title: "确认删除",
			content: `确定要删除对象 "${key}" 吗？`,
			okText: "确定",
			cancelText: "取消",
			okButtonProps: { danger: true },
			onOk: async () => {
				try {
					await deleteR2Object(key);
					if (selectedKey === key) {
						setSelectedKey(null);
						setSelectedMetadata(null);
					}
					loadObjects();
					handleSuccess(`对象 "${key}" 删除成功`);
				} catch (e) {
					handleError(e, "删除失败");
				}
			},
		});
	};

	// 批量删除
	const batchDelete = async () => {
		const keysToDelete = objects.map((o) => o.key);
		Modal.confirm({
			title: "确认批量删除",
			content: `确定要删除全部 ${keysToDelete.length} 个对象吗？此操作不可恢复！`,
			okText: "确定",
			cancelText: "取消",
			okButtonProps: { danger: true },
			onOk: async () => {
				try {
					await batchDeleteR2Objects(keysToDelete);
					setSelectedKey(null);
					setSelectedMetadata(null);
					loadObjects();
					handleSuccess(`成功删除 ${keysToDelete.length} 个对象`);
				} catch (e) {
					handleError(e, "批量删除失败");
				}
			},
		});
	};

	// 下载对象
	const downloadObject = async (key: string) => {
		try {
			const blob = await downloadR2Object(key);
			const url = URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.href = url;
			a.download = key.split("/").pop() || key;
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			URL.revokeObjectURL(url);
			handleSuccess(`对象 "${key}" 下载成功`);
		} catch (e) {
			handleError(e, "下载失败");
		}
	};

	// 组件挂载时加载数据
	useEffect(() => {
		loadObjects();
	}, []);

	return (
		<div style={{ padding: "20px", maxWidth: "1000px", margin: "0 auto" }}>
			<h2>R2 对象存储管理</h2>

			{/* 上传区域 */}
			<div style={{ marginBottom: "30px", padding: "15px", background: "#f5f5f5", borderRadius: "8px" }}>
				<h3>上传对象</h3>
				<div style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
					<input
						type="text"
						placeholder="对象键名 (如: path/to/file.txt)"
						value={keyInput}
						onChange={(e) => setKeyInput(e.target.value)}
						style={{ flex: 1, padding: "8px" }}
					/>
					<select
						value={contentType}
						onChange={(e) => setContentType(e.target.value)}
						style={{ padding: "8px" }}
					>
						<option value="text/plain">text/plain</option>
						<option value="application/json">application/json</option>
						<option value="text/html">text/html</option>
						<option value="text/css">text/css</option>
						<option value="application/javascript">application/javascript</option>
						<option value="image/jpeg">image/jpeg</option>
						<option value="image/png">image/png</option>
					</select>
				</div>

				{/* 文本内容 */}
				<div style={{ marginBottom: "10px" }}>
					<label style={{ display: "block", marginBottom: "5px" }}>文本内容:</label>
					<textarea
						placeholder="输入文本内容"
						value={valueInput}
						onChange={(e) => setValueInput(e.target.value)}
						rows={4}
						style={{ width: "100%", padding: "8px" }}
					/>
				</div>

				<div style={{ display: "flex", gap: "10px" }}>
					<button onClick={saveValue} style={{ padding: "8px 16px" }}>
						保存文本
					</button>
					<button
						onClick={() => fileInputRef.current?.click()}
						style={{ padding: "8px 16px" }}
					>
						上传文件
					</button>
					<input
						ref={fileInputRef}
						type="file"
						style={{ display: "none" }}
						onChange={(e) => {
							const file = e.target.files?.[0];
							if (file) uploadFile(file);
						}}
					/>
					{uploadProgress > 0 && (
						<span style={{ padding: "8px", color: "#666" }}>
							上传中... {uploadProgress}%
						</span>
					)}
				</div>
			</div>

			{/* 对象列表 */}
			<div style={{ marginBottom: "30px" }}>
				<div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
					<h3>对象列表 ({objects.length})</h3>
					<div style={{ display: "flex", gap: "10px" }}>
						<button onClick={loadObjects} style={{ padding: "6px 12px", fontSize: "12px" }}>
							刷新
						</button>
						{objects.length > 0 && (
							<button
								onClick={batchDelete}
								style={{ padding: "6px 12px", fontSize: "12px", background: "#ff4444", color: "white", border: "none", borderRadius: "4px" }}
							>
								全部删除
							</button>
						)}
					</div>
				</div>
				{loading ? (
					<p>加载中...</p>
				) : objects.length === 0 ? (
					<p style={{ color: "#999", padding: "20px", textAlign: "center", background: "#f9f9f9", borderRadius: "8px" }}>
						暂无对象，请上传文件或文本
					</p>
				) : (
					<div style={{ border: "1px solid #ddd", borderRadius: "8px", overflow: "hidden" }}>
						<table style={{ width: "100%", borderCollapse: "collapse" }}>
							<thead>
								<tr style={{ background: "#f5f5f5" }}>
									<th style={{ padding: "10px", textAlign: "left", borderBottom: "1px solid #ddd" }}>键名</th>
									<th style={{ padding: "10px", textAlign: "left", borderBottom: "1px solid #ddd" }}>大小</th>
									<th style={{ padding: "10px", textAlign: "left", borderBottom: "1px solid #ddd" }}>类型</th>
									<th style={{ padding: "10px", textAlign: "left", borderBottom: "1px solid #ddd" }}>操作</th>
								</tr>
							</thead>
							<tbody>
								{objects.map((obj) => (
									<tr key={obj.key} style={{ borderBottom: "1px solid #eee" }}>
										<td style={{ padding: "10px" }}>
											<span
												style={{ cursor: "pointer", color: "#0066cc" }}
												onClick={() => loadMetadata(obj.key)}
											>
												{obj.key}
											</span>
										</td>
										<td style={{ padding: "10px" }}>{formatSize(obj.size)}</td>
										<td style={{ padding: "10px" }}>{obj.httpMetadata?.contentType || "-"}</td>
										<td style={{ padding: "10px" }}>
											<button
												onClick={() => downloadObject(obj.key)}
												style={{ padding: "4px 8px", marginRight: "5px" }}
											>
												下载
											</button>
											<button
												onClick={() => deleteObject(obj.key)}
												style={{ padding: "4px 8px", background: "#ff4444", color: "white", border: "none", borderRadius: "4px" }}
											>
												删除
											</button>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}
			</div>

			{/* 对象详情 */}
			{selectedMetadata && (
				<div style={{ padding: "15px", background: "#e8f4f8", borderRadius: "8px" }}>
					<h3>对象详情: {selectedKey}</h3>
					<div style={{ marginBottom: "10px", fontSize: "14px" }}>
						<p><strong>大小:</strong> {formatSize(selectedMetadata.size)}</p>
						<p><strong>类型:</strong> {selectedMetadata.httpMetadata?.contentType || "未知"}</p>
						{selectedMetadata.customMetadata?.filename && (
							<p><strong>文件名:</strong> {selectedMetadata.customMetadata.filename}</p>
						)}
						{selectedMetadata.customMetadata?.uploadedAt && (
							<p><strong>上传时间:</strong> {selectedMetadata.customMetadata.uploadedAt}</p>
						)}
					</div>
					<button
						onClick={() => {
							setSelectedKey(null);
							setSelectedMetadata(null);
						}}
						style={{ padding: "8px 16px" }}
					>
						关闭
					</button>
				</div>
			)}
		</div>
	);
}

// 格式化文件大小
function formatSize(bytes: number): string {
	if (bytes === 0) return "0 B";
	const k = 1024;
	const sizes = ["B", "KB", "MB", "GB"];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}
