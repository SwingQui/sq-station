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
	getR2Folders,
	createR2Folder,
	deleteR2Folder,
	type R2Object,
} from "../../../api/r2";
import { handleError, handleSuccess } from "../../../utils/error-handler";

export default function TestR2() {
	const [objects, setObjects] = useState<R2Object[]>([]);
	const [folders, setFolders] = useState<string[]>([]);
	const [loading, setLoading] = useState(false);
	const [keyInput, setKeyInput] = useState("");
	const [valueInput, setValueInput] = useState("");
	const [selectedKey, setSelectedKey] = useState<string | null>(null);
	const [selectedMetadata, setSelectedMetadata] = useState<R2Object | null>(null);
	const [uploadProgress, setUploadProgress] = useState(0);
	const [contentType, setContentType] = useState("text/plain");
	const [currentPath, setCurrentPath] = useState("");
	const [newFolderName, setNewFolderName] = useState("");
	const fileInputRef = useRef<HTMLInputElement>(null);

	// 加载对象和文件夹列表
	const loadData = async () => {
		setLoading(true);
		try {
			// 计算前缀
			const prefix = currentPath ? `${currentPath}/` : undefined;

			// 加载对象列表
			const objectsData = await getR2List(100, undefined, prefix);

			// 过滤掉文件夹标记文件
			const filteredObjects = (objectsData.objects || []).filter(
				obj => obj.customMetadata?.isFolder !== "true"
			);

			setObjects(filteredObjects);

			// 加载文件夹列表
			const foldersData = await getR2Folders(prefix);
			setFolders(foldersData.folders || []);
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

	// 进入文件夹
	const enterFolder = (folderName: string) => {
		const newPath = currentPath ? `${currentPath}/${folderName}` : folderName;
		setCurrentPath(newPath);
	};

	// 面包屑导航
	const navigateToPath = (index: number) => {
		const pathParts = currentPath.split("/").filter(p => p);
		const newPath = pathParts.slice(0, index + 1).join("/");
		setCurrentPath(newPath);
	};

	// 获取面包屑数组
	const getBreadcrumbs = () => {
		if (!currentPath) return [{ name: "根目录", path: "" }];
		const parts = currentPath.split("/").filter(p => p);
		return parts.map((part, index) => ({
			name: part,
			path: parts.slice(0, index + 1).join("/"),
		}));
	};

	// 创建文件夹
	const createFolder = async () => {
		if (!newFolderName.trim()) {
			handleError(new Error("请输入文件夹名称"), "创建失败");
			return;
		}

		// 验证文件夹名称（不允许包含特殊字符）
		if (/[<>:"|?*\\/]/.test(newFolderName)) {
			handleError(new Error("文件夹名称不能包含以下字符: < > : \" | ? * / \\"), "创建失败");
			return;
		}

		try {
			// 构建完整路径
			const fullPath = currentPath ? `${currentPath}/${newFolderName}` : newFolderName;
			await createR2Folder(fullPath);
			setNewFolderName("");
			loadData();
			handleSuccess(`文件夹 "${newFolderName}" 创建成功`);
		} catch (e) {
			handleError(e, "创建文件夹失败");
		}
	};

	// 删除文件夹
	const deleteFolder = async (folderName: string) => {
		const fullPath = currentPath ? `${currentPath}/${folderName}` : folderName;

		Modal.confirm({
			title: "确认删除文件夹",
			content: `确定要删除文件夹 "${folderName}" 及其所有内容吗？此操作不可恢复！`,
			okText: "确定",
			cancelText: "取消",
			okButtonProps: { danger: true },
			onOk: async () => {
				try {
					const result = await deleteR2Folder(fullPath);
					loadData();
					handleSuccess(`文件夹 "${folderName}" 及其 ${result.deletedCount} 个文件删除成功`);
				} catch (e) {
					handleError(e, "删除文件夹失败");
				}
			},
		});
	};

	// 上传文本值
	const saveValue = async () => {
		if (!keyInput.trim()) return;

		// 构建完整路径
		const fullKey = currentPath ? `${currentPath}/${keyInput}` : keyInput;

		try {
			await uploadR2Value(fullKey, valueInput, {
				httpMetadata: { contentType },
			});
			setKeyInput("");
			setValueInput("");
			loadData();
			handleSuccess(`文本 "${fullKey}" 保存成功`);
		} catch (e) {
			handleError(e, "保存失败");
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

		// 构建完整路径
		const fullKey = currentPath ? `${currentPath}/${file.name}` : file.name;

		try {
			setUploadProgress(0);
			await uploadR2File(fullKey, file);
			setUploadProgress(100);
			setKeyInput("");
			loadData();
			handleSuccess(`文件 "${fullKey}" 上传成功`);
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
					loadData();
					handleSuccess(`对象 "${key}" 删除成功`);
				} catch (e) {
					handleError(e, "删除失败");
				}
			},
		});
	};

	// 批量删除当前目录下的所有对象
	const batchDelete = async () => {
		const keysToDelete = objects.map((o) => o.key);
		Modal.confirm({
			title: "确认批量删除",
			content: `确定要删除当前目录下的全部 ${keysToDelete.length} 个对象吗？此操作不可恢复！`,
			okText: "确定",
			cancelText: "取消",
			okButtonProps: { danger: true },
			onOk: async () => {
				try {
					await batchDeleteR2Objects(keysToDelete);
					setSelectedKey(null);
					setSelectedMetadata(null);
					loadData();
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

	// 组件挂载或路径变化时加载数据
	useEffect(() => {
		loadData();
	}, [currentPath]);

	// 获取显示用的文件名（去掉路径前缀）
	const getDisplayName = (key: string): string => {
		if (!currentPath) return key;
		const prefix = currentPath + "/";
		if (key.startsWith(prefix)) {
			return key.substring(prefix.length);
		}
		return key;
	};

	return (
		<div style={{ padding: "20px", maxWidth: "1000px", margin: "0 auto" }}>
			<h2>R2 对象存储管理</h2>

			{/* 面包屑导航 */}
			<div style={{ marginBottom: "20px", padding: "10px", background: "#f5f5f5", borderRadius: "8px" }}>
				<div style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "14px" }}>
					<span style={{ color: "#666" }}>当前位置:</span>
					{getBreadcrumbs().map((crumb, index, arr) => (
						<span key={crumb.path} style={{ display: "flex", alignItems: "center" }}>
							{index > 0 && <span style={{ margin: "0 5px", color: "#999" }}>/</span>}
							<span
								style={{
									cursor: index === arr.length - 1 ? "default" : "pointer",
									color: index === arr.length - 1 ? "#333" : "#0066cc",
									fontWeight: index === arr.length - 1 ? "bold" : "normal",
								}}
								onClick={() => index < arr.length - 1 && navigateToPath(index)}
							>
								{crumb.name}
							</span>
						</span>
					))}
					{currentPath && (
						<button
							onClick={() => setCurrentPath("")}
							style={{ marginLeft: "10px", padding: "2px 8px", fontSize: "12px" }}
						>
							返回根目录
						</button>
					)}
				</div>
			</div>

			{/* 上传区域 */}
			<div style={{ marginBottom: "30px", padding: "15px", background: "#f5f5f5", borderRadius: "8px" }}>
				<h3>上传对象</h3>
				<div style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
					<input
						type="text"
						placeholder={`对象键名 (当前路径: ${currentPath || "根目录"})`}
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

				<div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
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

			{/* 创建文件夹 */}
			<div style={{ marginBottom: "20px", padding: "15px", background: "#f0f7ff", borderRadius: "8px" }}>
				<h3>创建文件夹</h3>
				<div style={{ display: "flex", gap: "10px" }}>
					<input
						type="text"
						placeholder="文件夹名称"
						value={newFolderName}
						onChange={(e) => setNewFolderName(e.target.value)}
						onKeyDown={(e) => e.key === "Enter" && createFolder()}
						style={{ flex: 1, padding: "8px" }}
					/>
					<button onClick={createFolder} style={{ padding: "8px 16px" }}>
						创建文件夹
					</button>
				</div>
			</div>

			{/* 文件夹列表 */}
			{folders.length > 0 && (
				<div style={{ marginBottom: "20px" }}>
					<h3>文件夹 ({folders.length})</h3>
					<div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
						{folders.map((folder) => {
							const folderName = folder.split("/").pop() || folder;
							return (
								<div
									key={folder}
									style={{
										padding: "10px 15px",
										background: "#fff3cd",
										border: "1px solid #ffc107",
										borderRadius: "8px",
										display: "flex",
										alignItems: "center",
										gap: "10px",
										cursor: "pointer",
									}}
									onClick={() => enterFolder(folderName)}
								>
									<span style={{ fontSize: "18px" }}>📁</span>
									<span>{folderName}</span>
									<button
										onClick={(e) => {
											e.stopPropagation();
											deleteFolder(folderName);
										}}
										style={{
											padding: "2px 8px",
											background: "#ff4444",
											color: "white",
											border: "none",
											borderRadius: "4px",
											fontSize: "12px",
										}}
									>
										删除
									</button>
								</div>
							);
						})}
					</div>
				</div>
			)}

			{/* 对象列表 */}
			<div style={{ marginBottom: "30px" }}>
				<div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
					<h3>文件列表 ({objects.length})</h3>
					<div style={{ display: "flex", gap: "10px" }}>
						<button onClick={loadData} style={{ padding: "6px 12px", fontSize: "12px" }}>
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
						{folders.length === 0 ? "暂无对象，请上传文件或文本" : "当前目录下暂无文件"}
					</p>
				) : (
					<div style={{ border: "1px solid #ddd", borderRadius: "8px", overflow: "hidden" }}>
						<table style={{ width: "100%", borderCollapse: "collapse" }}>
							<thead>
								<tr style={{ background: "#f5f5f5" }}>
									<th style={{ padding: "10px", textAlign: "left", borderBottom: "1px solid #ddd" }}>文件名</th>
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
												{getDisplayName(obj.key)}
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
						<p><strong>完整路径:</strong> {selectedKey}</p>
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
