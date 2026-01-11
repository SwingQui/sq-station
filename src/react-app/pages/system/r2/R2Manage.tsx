import { useState, useMemo } from "react";
import {
	Card,
	Button,
	Modal,
	Upload,
	Breadcrumb,
	Empty,
	Image,
	message,
	Tree,
	Space,
	Tooltip,
	Tag,
	Typography,
	Spin,
	Input,
	Layout,
	Row,
	Col,
	Dropdown,
} from "antd";
import {
	FolderOutlined,
	FileOutlined,
	FileImageOutlined,
	FileTextOutlined,
	VideoCameraOutlined,
	AudioOutlined,
	ReloadOutlined,
	UploadOutlined,
	DownloadOutlined,
	DeleteOutlined,
	EyeOutlined,
	HomeOutlined,
	PlusOutlined,
	InboxOutlined,
	SearchOutlined,
	MoreOutlined,
	EditOutlined,
	FileAddOutlined,
} from "@ant-design/icons";
import type { DataNode } from "antd/es/tree";
import {
	getR2List,
	uploadR2File,
	deleteR2Object,
	downloadR2Object,
	getR2Folders,
	createR2Folder,
	deleteR2Folder,
	type R2Object,
} from "@api/r2";
import { handleError } from "@utils/error-handler";

const { Text } = Typography;
const { Dragger } = Upload;
const { Sider, Content } = Layout;

// ==================== 类型定义 ====================

interface FolderTreeNode extends DataNode {
	key: string;
	title: string;
	path: string;
	isLeaf?: boolean;
	isFile?: boolean;
	fileType?: string;  // 文件的 MIME 类型
	children?: FolderTreeNode[];
}

interface R2Cache {
	objects: Map<string, R2Object[]>;
	folders: Map<string, string[]>;
	tree: Map<string, FolderTreeNode[]>;
	lastRefresh: number;
}

// ==================== 主组件 ====================

export default function R2Manage() {
	// ==================== 状态管理 ====================
	const [objects, setObjects] = useState<R2Object[]>([]);
	const [folders, setFolders] = useState<string[]>([]);
	const [loading, setLoading] = useState(false);
	const [currentPath, setCurrentPath] = useState("");
	const [hasRefreshed, setHasRefreshed] = useState(false);

	// 缓存状态
	const [cache, setCache] = useState<R2Cache>({
		objects: new Map(),
		folders: new Map(),
		tree: new Map(),
		lastRefresh: 0,
	});

	// 树状态
	const [treeData, setTreeData] = useState<FolderTreeNode[]>([]);
	const [expandedKeys, setExpandedKeys] = useState<string[]>([]);
	const [selectedKey, setSelectedKey] = useState<string>("");

	// Modal 状态
	const [previewFile, setPreviewFile] = useState<R2Object | null>(null);
	const [previewContent, setPreviewContent] = useState<string | null>(null);
	const [previewLoading, setPreviewLoading] = useState(false);
	const [uploadModalVisible, setUploadModalVisible] = useState(false);
	const [createFolderModalVisible, setCreateFolderModalVisible] = useState(false);
	const [newFolderName, setNewFolderName] = useState("");
	const [renameModalVisible, setRenameModalVisible] = useState(false);
	const [renameItem, setRenameItem] = useState<{ key: string; name: string; type: "folder" | "file" } | null>(null);
	const [newName, setNewName] = useState("");

	// 搜索状态
	const [searchKeyword, setSearchKeyword] = useState("");

	// 过滤后的文件和文件夹
	const filteredFolders = useMemo(() => {
		if (!searchKeyword) return folders;
		return folders.filter(f => f.toLowerCase().includes(searchKeyword.toLowerCase()));
	}, [folders, searchKeyword]);

	const filteredObjects = useMemo(() => {
		if (!searchKeyword) return objects;
		const keyword = searchKeyword.toLowerCase();
		return objects.filter(obj => {
			const fileName = obj.key.split("/").pop() || obj.key;
			return fileName.toLowerCase().includes(keyword);
		});
	}, [objects, searchKeyword]);

	// ==================== 缓存相关函数 ====================

	const loadFromCache = (path: string) => {
		return {
			objects: cache.objects.get(path) || [],
			folders: cache.folders.get(path) || [],
		};
	};

	const updateCache = (path: string, objects?: R2Object[], folders?: string[]) => {
		setCache(prev => {
			const newObjects = new Map(prev.objects);
			const newFolders = new Map(prev.folders);
			if (objects !== undefined) newObjects.set(path, objects);
			if (folders !== undefined) newFolders.set(path, folders);
			return {
				...prev,
				objects: newObjects,
				folders: newFolders,
				lastRefresh: Date.now(),
			};
		});
	};

	// ==================== 数据加载 ====================

	const loadContent = async (path: string, forceRefresh = false) => {
		// 优先使用缓存
		if (!forceRefresh && hasRefreshed) {
			const cached = loadFromCache(path);
			if (cached.objects.length > 0 || cached.folders.length > 0 || path === "") {
				setObjects(cached.objects);
				setFolders(cached.folders);
				return;
			}
		}

		// 加载数据
		setLoading(true);
		try {
			const prefix = path ? `${path}/` : undefined;
			const [objectsData, foldersData] = await Promise.all([
				getR2List(100, undefined, prefix),
				getR2Folders(prefix),
			]);

			const filteredObjects = (objectsData.objects || []).filter(
				obj => !obj.customMetadata?.isFolder && !obj.key.endsWith("/")
			);

			setObjects(filteredObjects);
			setFolders(foldersData.folders || []);

			// 更新缓存
			updateCache(path, filteredObjects, foldersData.folders || []);
			setHasRefreshed(true);
		} catch (e) {
			handleError(e, "加载失败");
		}
		setLoading(false);
	};

	// 刷新所有数据
	const handleRefresh = async () => {
		setLoading(true);
		try {
			// 重新加载当前路径
			await loadContent(currentPath, true);

			// 清空树缓存，重新加载根节点
			setCache(prev => ({
				...prev,
				tree: new Map(),
				lastRefresh: Date.now(),
			}));

			// 重新加载树
			await loadRootTree();

			message.success("数据已刷新");
		} catch (e) {
			handleError(e, "刷新失败");
		}
		setLoading(false);
	};

	// ==================== 树相关函数 ====================

	// 加载根节点树数据
	const loadRootTree = async () => {
		try {
			const [foldersData, objectsData] = await Promise.all([
				getR2Folders(undefined),
				getR2List(1000, undefined, undefined),
			]);

			const filteredObjects = (objectsData.objects || []).filter(
				obj => !obj.customMetadata?.isFolder && !obj.key.endsWith("/")
			);

			// 构建子节点：文件夹 + 文件
			const children: FolderTreeNode[] = [
				// 文件夹节点
				...foldersData.folders.map(folderName => {
					const node: FolderTreeNode = {
						key: folderName,
						title: folderName,
						path: folderName,
						isLeaf: false,
						isFile: false,
					};
					return node;
				}),
				// 文件节点
				...filteredObjects.map(obj => {
					const fileName = obj.key.split("/").pop() || obj.key;
					const node: FolderTreeNode = {
						key: obj.key,
						title: fileName,
						path: obj.key,
						isLeaf: true,
						isFile: true,
						fileType: obj.httpMetadata?.contentType,
					};
					return node;
				}),
			];

			const rootNode: FolderTreeNode = {
				key: "",
				title: "根目录",
				path: "",
				children,
			};

			setTreeData([rootNode]);

			// 缓存根节点
			setCache(prev => ({
				...prev,
				tree: new Map(prev.tree).set("", children),
			}));
		} catch (e) {
			handleError(e, "加载文件树失败");
		}
	};

	// 树节点懒加载
	const onLoadData = async ({ key }: any) => {
		// 文件节点不需要加载子节点
		const node = findTreeNode(treeData, key);
		if (node?.isFile) {
			return;
		}

		// 先检查缓存
		const cached = cache.tree.get(key);
		if (cached) {
			updateTreeNode(key, cached);
			return;
		}

		// 加载子文件夹和文件
		try {
			const prefix = key ? `${key}/` : undefined;
			const [foldersData, objectsData] = await Promise.all([
				getR2Folders(prefix),
				getR2List(1000, undefined, prefix),
			]);

			const filteredObjects = (objectsData.objects || []).filter(
				obj => !obj.customMetadata?.isFolder && !obj.key.endsWith("/")
			);

			// 构建子节点：文件夹 + 文件
			const childNodes: FolderTreeNode[] = [
				// 文件夹节点
				...foldersData.folders.map(folderName => {
					const fullPath = key ? `${key}/${folderName}` : folderName;
					return {
						key: fullPath,
						title: folderName,
						path: fullPath,
						isLeaf: false,
						isFile: false,
					};
				}),
				// 文件节点
				...filteredObjects.map(obj => {
					const fileName = obj.key.split("/").pop() || obj.key;
					return {
						key: obj.key,
						title: fileName,
						path: obj.key,
						isLeaf: true,
						isFile: true,
						fileType: obj.httpMetadata?.contentType,
					};
				}),
			];

			// 更新树数据
			updateTreeNode(key, childNodes);

			// 缓存
			setCache(prev => ({
				...prev,
				tree: new Map(prev.tree).set(key, childNodes),
			}));
		} catch (e) {
			handleError(e, "加载子节点失败");
		}
	};

	// 更新树节点
	const updateTreeNode = (key: string, children: FolderTreeNode[]) => {
		const updateNode = (nodes: FolderTreeNode[]): FolderTreeNode[] => {
			return nodes.map(node => {
				if (node.key === key) {
					return { ...node, children };
				}
				if (node.children) {
					return { ...node, children: updateNode(node.children) };
				}
				return node;
			});
		};

		setTreeData(prev => updateNode(prev));
	};

	// 查找树节点
	const findTreeNode = (nodes: FolderTreeNode[], key: string): FolderTreeNode | null => {
		for (const node of nodes) {
			if (node.key === key) {
				return node;
			}
			if (node.children) {
				const found = findTreeNode(node.children, key);
				if (found) return found;
			}
		}
		return null;
	};

	// 树节点选择
	const handleTreeSelect = (selectedKeys: React.Key[]) => {
		const newKey = (selectedKeys[0] as string) || "";

		// 查找选中的节点
		const node = findTreeNode(treeData, newKey);

		if (node?.isFile) {
			// 文件节点：预览文件
			const obj = objects.find(o => o.key === newKey);
			if (obj) {
				handlePreview(obj);
			}
		} else {
			// 文件夹节点：导航到文件夹
			setSelectedKey(newKey);
			setCurrentPath(newKey);
			loadContent(newKey, false);
		}
	};

	// 树节点展开
	const handleTreeExpand = (expandedKeys: React.Key[]) => {
		setExpandedKeys(expandedKeys as string[]);
	};

	// ==================== 文件夹操作 ====================

	const enterFolder = (folderRelativeOrPath: string) => {
		// 后端返回的是相对路径（子文件夹名），需要拼接成完整路径
		const fullPath = currentPath ? `${currentPath}/${folderRelativeOrPath}` : folderRelativeOrPath;

		setSelectedKey(fullPath);
		setCurrentPath(fullPath);

		// 确保父节点展开
		const parentPaths = getAllParentPaths(fullPath);
		setExpandedKeys(prev => [...new Set([...prev, ...parentPaths, fullPath])]);

		// 加载内容
		loadContent(fullPath, false);
	};

	const navigateToPath = (path: string) => {
		setSelectedKey(path);
		setCurrentPath(path);
		setExpandedKeys(prev => [...new Set([...prev, ...getAllParentPaths(path)])]);
		loadContent(path, false);
	};

	const getAllParentPaths = (path: string): string[] => {
		if (!path) return [];
		const parts = path.split("/").filter(p => p);
		const paths: string[] = [];
		let current = "";
		for (const part of parts) {
			current = current ? `${current}/${part}` : part;
			paths.push(current);
		}
		return paths;
	};

	// ==================== CRUD 操作 ====================

	const handleCreateFolder = async () => {
		if (!newFolderName.trim()) {
			message.warning("请输入文件夹名称");
			return;
		}

		if (/[<>:"|?*\\/]/.test(newFolderName)) {
			message.error("文件夹名称不能包含以下字符: < > : \" | ? * / \\");
			return;
		}

		// 检查同名文件夹
		if (folders.includes(newFolderName)) {
			message.error(`文件夹 "${newFolderName}" 已存在`);
			return;
		}

		try {
			const fullPath = currentPath ? `${currentPath}/${newFolderName}` : newFolderName;
			await createR2Folder(fullPath);
			setNewFolderName("");
			setCreateFolderModalVisible(false);
			message.success(`文件夹 "${newFolderName}" 创建成功`);

			// 更新缓存（不重新加载）- 缓存中存储相对路径（文件夹名）
			const currentFolders = cache.folders.get(currentPath) || [];
			updateCache(currentPath, undefined, [...currentFolders, newFolderName]);
			setFolders([...folders, newFolderName]);

			// 更新树
			const newTreeNode: FolderTreeNode = {
				key: fullPath,
				title: newFolderName,
				path: fullPath,
				isLeaf: false,
			};
			setCache(prev => ({
				...prev,
				tree: new Map(prev.tree).set(currentPath, [
					...(prev.tree.get(currentPath) || []),
					newTreeNode,
				]),
			}));
			const updatedTree = [...(cache.tree.get(currentPath) || []), newTreeNode];
			updateTreeNode(currentPath, updatedTree);
		} catch (e) {
			handleError(e, "创建文件夹失败");
		}
	};

	const handleDeleteObject = (obj: R2Object) => {
		Modal.confirm({
			title: "确认删除",
			content: `确定要删除对象 "${getDisplayName(obj.key)}" 吗？`,
			okText: "确定",
			cancelText: "取消",
			okButtonProps: { danger: true },
			onOk: async () => {
				try {
					await deleteR2Object(obj.key);
					message.success(`对象 "${getDisplayName(obj.key)}" 删除成功`);

					// 更新缓存（不重新加载）
					const currentObjects = cache.objects.get(currentPath) || [];
					const newObjects = currentObjects.filter(o => o.key !== obj.key);
					updateCache(currentPath, newObjects, undefined);
					setObjects(newObjects);
				} catch (e) {
					handleError(e, "删除失败");
				}
			},
		});
	};

	const handleDeleteFolder = (folder: string) => {
		const fullPath = currentPath ? `${currentPath}/${folder}` : folder;
		Modal.confirm({
			title: "确认删除文件夹",
			content: `确定要删除文件夹 "${folder}" 吗？此操作将递归删除文件夹内的所有内容，不可恢复！`,
			okText: "确定删除",
			cancelText: "取消",
			okButtonProps: { danger: true },
			onOk: async () => {
				try {
					await deleteR2Folder(fullPath);
					message.success(`文件夹 "${folder}" 删除成功`);

					// 更新缓存（不重新加载）
					const currentFolders = cache.folders.get(currentPath) || [];
					const newFolders = currentFolders.filter(f => f !== folder);
					updateCache(currentPath, undefined, newFolders);
					setFolders(newFolders);
				} catch (e) {
					handleError(e, "删除文件夹失败");
				}
			},
		});
	};

	// 重命名文件夹/文件
	const handleRename = (key: string, name: string, type: "folder" | "file") => {
		setRenameItem({ key, name, type });
		setNewName(name);
		setRenameModalVisible(true);
	};

	const handleRenameConfirm = async () => {
		if (!renameItem || !newName.trim()) {
			message.warning("请输入新名称");
			return;
		}

		if (/[<>:"|?*\\/]/.test(newName)) {
			message.error("名称不能包含以下字符: < > : \" | ? * / \\");
			return;
		}

		try {
			const oldKey = renameItem.key;

			// 计算新路径
			const parts = oldKey.split("/");
			parts[parts.length - 1] = newName.trim();
			const newKey = parts.join("/");

			// 获取对象（用于文件重命名）
			const obj = objects.find(o => o.key === oldKey);

			if (renameItem.type === "folder") {
				// 重命名文件夹：创建新文件夹，删除旧文件夹
				await createR2Folder(newKey);
				await deleteR2Folder(oldKey);
				message.success(`文件夹重命名成功`);
			} else {
				// 重命名文件：需要重新上传
				if (obj) {
					const blob = await downloadR2Object(oldKey);
					const file = new File([blob], newName.trim(), { type: obj.httpMetadata?.contentType || "application/octet-stream" });
					await uploadR2File(newKey, file);
					await deleteR2Object(oldKey);
					message.success(`文件重命名成功`);
				}
			}

			setRenameModalVisible(false);
			setRenameItem(null);

			// 刷新当前目录
			await loadContent(currentPath, true);
		} catch (e) {
			handleError(e, "重命名失败");
		}
	};

	// 在文件夹下新增子文件夹
	const handleAddSubFolder = (parentPath: string) => {
		setNewFolderName("");
		// 设置当前路径为父文件夹路径，这样创建文件夹时会创建在正确的位置
		setCurrentPath(parentPath);
		setCreateFolderModalVisible(true);
	};

	const handleDownload = async (key: string) => {
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
			message.success(`对象 "${getDisplayName(key)}" 下载成功`);
		} catch (e) {
			handleError(e, "下载失败");
		}
	};

	const handlePreview = async (obj: R2Object) => {
		setPreviewLoading(true);
		setPreviewFile(obj);

		try {
			const contentType = obj.httpMetadata?.contentType || "";

			if (contentType.startsWith("image/")) {
				const blob = await downloadR2Object(obj.key);
				const url = URL.createObjectURL(blob);
				setPreviewContent(url);
			} else if (
				contentType.startsWith("text/") ||
				contentType === "application/json" ||
				contentType.includes("javascript") ||
				contentType.includes("xml")
			) {
				const blob = await downloadR2Object(obj.key);
				const text = await blob.text();
				setPreviewContent(text);
			} else {
				setPreviewContent(null);
			}
		} catch (e) {
			handleError(e, "加载预览失败");
			setPreviewFile(null);
		}

		setPreviewLoading(false);
	};

	const handleUpload = async (options: any) => {
		const { file, onSuccess, onError } = options;

		try {
			const maxSize = 200 * 1024 * 1024;
			if (file.size > maxSize) {
				throw new Error(`文件大小超过限制！最大允许 200MB`);
			}

			const fullKey = currentPath ? `${currentPath}/${file.name}` : file.name;
			await uploadR2File(fullKey, file);
			message.success(`文件 "${file.name}" 上传成功`);
			onSuccess?.();

			// 创建新的 R2Object
			const newObject: R2Object = {
				key: fullKey,
				size: file.size,
				uploaded: new Date().toISOString(),
				httpMetadata: {
					contentType: file.type,
				},
			};

			// 更新缓存（不重新加载）
			const currentObjects = cache.objects.get(currentPath) || [];
			updateCache(currentPath, [...currentObjects, newObject], undefined);
			setObjects([...objects, newObject]);
		} catch (e: any) {
			handleError(e, "上传失败");
			onError?.(e);
		}
	};

	// ==================== 辅助函数 ====================

	const getDisplayName = (key: string): string => {
		if (!currentPath) return key;
		const prefix = currentPath + "/";
		if (key.startsWith(prefix)) {
			return key.substring(prefix.length);
		}
		return key;
	};

	const getFileIcon = (obj: R2Object) => {
		const contentType = obj.httpMetadata?.contentType || "";

		if (contentType.startsWith("image/")) {
			return <FileImageOutlined style={{ fontSize: "24px", color: "#1890ff" }} />;
		}
		if (contentType.startsWith("video/")) {
			return <VideoCameraOutlined style={{ fontSize: "24px", color: "#52c41a" }} />;
		}
		if (contentType.startsWith("audio/")) {
			return <AudioOutlined style={{ fontSize: "24px", color: "#fa8c16" }} />;
		}
		if (
			contentType.startsWith("text/") ||
			contentType === "application/json" ||
			contentType.includes("javascript") ||
			contentType.includes("xml")
		) {
			return <FileTextOutlined style={{ fontSize: "24px", color: "#13c2c2" }} />;
		}
		return <FileOutlined style={{ fontSize: "24px", color: "#8c8c8c" }} />;
	};

	// 渲染树节点的 title（包含下拉菜单）
	const renderTreeNodeTitle = (node: FolderTreeNode) => {
		const isFile = node.isFile;
		const name = node.title as string;

		// 获取节点图标
		const getIcon = () => {
			if (isFile) {
				const contentType = node.fileType || "";
				if (contentType.startsWith("image/")) {
					return <FileImageOutlined style={{ fontSize: 14, color: "#1890ff", marginRight: 8 }} />;
				}
				if (contentType.startsWith("video/")) {
					return <VideoCameraOutlined style={{ fontSize: 14, color: "#52c41a", marginRight: 8 }} />;
				}
				if (contentType.startsWith("audio/")) {
					return <AudioOutlined style={{ fontSize: 14, color: "#fa8c16", marginRight: 8 }} />;
				}
				if (
					contentType.startsWith("text/") ||
					contentType === "application/json" ||
					contentType.includes("javascript") ||
					contentType.includes("xml")
				) {
					return <FileTextOutlined style={{ fontSize: 14, color: "#13c2c2", marginRight: 8 }} />;
				}
				return <FileOutlined style={{ fontSize: 14, color: "#8c8c8c", marginRight: 8 }} />;
			}
			// 文件夹图标
			return <FolderOutlined style={{ color: "#faad14", fontSize: 14, marginRight: 8 }} />;
		};

		// 文件夹操作菜单
		const folderMenuItems = [
			{
				key: "add-folder",
				label: "新增文件夹",
				icon: <FileAddOutlined />,
				onClick: (e: any) => {
					e.domStop();
					handleAddSubFolder(node.path);
				},
			},
			{
				key: "rename",
				label: "重命名",
				icon: <EditOutlined />,
				onClick: (e: any) => {
					e.domStop();
					handleRename(node.path, name, "folder");
				},
			},
			{
				key: "delete",
				label: "删除",
				icon: <DeleteOutlined />,
				danger: true,
				onClick: (e: any) => {
					e.domStop();
					// 删除文件夹
					const folderName = node.path.split("/").pop() || node.path;
					const parentPath = node.path.substring(0, node.path.lastIndexOf("/"));
					setCurrentPath(parentPath || "");
					handleDeleteFolder(folderName);
				},
			},
		];

		// 文件操作菜单
		const fileMenuItems = [
			{
				key: "preview",
				label: "预览",
				icon: <EyeOutlined />,
				onClick: (e: any) => {
					e.domStop();
					const obj = objects.find(o => o.key === node.path);
					if (obj) handlePreview(obj);
				},
			},
			{
				key: "rename",
				label: "重命名",
				icon: <EditOutlined />,
				onClick: (e: any) => {
					e.domStop();
					handleRename(node.path, name, "file");
				},
			},
			{
				key: "download",
				label: "下载",
				icon: <DownloadOutlined />,
				onClick: (e: any) => {
					e.domStop();
					handleDownload(node.path);
				},
			},
			{
				key: "delete",
				label: "删除",
				icon: <DeleteOutlined />,
				danger: true,
				onClick: (e: any) => {
					e.domStop();
					const obj = objects.find(o => o.key === node.path);
					if (obj) handleDeleteObject(obj);
				},
			},
		];

		return (
			<div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", overflow: "hidden" }}>
				<div style={{ display: "flex", alignItems: "center", flex: 1, minWidth: 0, overflow: "hidden" }}>
					{getIcon()}
					<span
						title={name}
						style={{
							overflow: "hidden",
							textOverflow: "ellipsis",
							whiteSpace: "nowrap",
						}}
					>
						{name}
					</span>
				</div>
				<Dropdown
					menu={{ items: isFile ? fileMenuItems : folderMenuItems }}
					trigger={["click"]}
				>
					<Button
						type="text"
						size="small"
						icon={<MoreOutlined />}
						onClick={(e) => e.stopPropagation()}
						style={{ padding: "0 4px", minWidth: "24px", height: "24px", flexShrink: 0, marginLeft: "4px" }}
					/>
				</Dropdown>
			</div>
		);
	};

	const canPreview = (obj: R2Object): boolean => {
		const contentType = obj.httpMetadata?.contentType || "";
		return (
			contentType.startsWith("image/") ||
			contentType.startsWith("text/") ||
			contentType === "application/json" ||
			contentType.includes("javascript") ||
			contentType.includes("xml")
		);
	};

	const formatSize = (bytes: number): string => {
		if (bytes === 0) return "0 B";
		const k = 1024;
		const sizes = ["B", "KB", "MB", "GB"];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
	};

	// 面包屑
	const breadcrumbItems = useMemo(() => {
		const items: { title: React.ReactNode; path: string }[] = [{ title: <span><HomeOutlined /> 根目录</span>, path: "" }];
		if (currentPath) {
			const parts = currentPath.split("/").filter(p => p);
			let buildPath = "";
			parts.forEach((part, index) => {
				buildPath += (index > 0 ? "/" : "") + part;
				items.push({ title: part, path: buildPath });
			});
		}
		return items;
	}, [currentPath]);

	// 获取树节点图标
	const getTreeNodeIcon = (props: any): React.ReactNode => {
		const treeNode = props.data as FolderTreeNode;

		if (treeNode?.isFile) {
			// 文件节点：根据文件类型显示不同图标
			const contentType = treeNode.fileType || "";

			if (contentType.startsWith("image/")) {
				return <FileImageOutlined style={{ fontSize: 14, color: "#1890ff" }} />;
			}
			if (contentType.startsWith("video/")) {
				return <VideoCameraOutlined style={{ fontSize: 14, color: "#52c41a" }} />;
			}
			if (contentType.startsWith("audio/")) {
				return <AudioOutlined style={{ fontSize: 14, color: "#fa8c16" }} />;
			}
			if (
				contentType.startsWith("text/") ||
				contentType === "application/json" ||
				contentType.includes("javascript") ||
				contentType.includes("xml")
			) {
				return <FileTextOutlined style={{ fontSize: 14, color: "#13c2c2" }} />;
			}
			return <FileOutlined style={{ fontSize: 14, color: "#8c8c8c" }} />;
		}

		// 文件夹节点
		const isExpanded = props.expanded;
		return <FolderOutlined style={{ color: isExpanded ? "#1890ff" : "#faad14", fontSize: 14 }} />;
	};

	// ==================== 渲染 ====================

	return (
		<>
			<style>{`
				.r2-tree-container .ant-tree-node-content-wrapper {
					flex: 1;
					overflow: hidden;
					min-width: 0;
				}
				.r2-tree-container .ant-tree-title {
					flex: 1;
					overflow: hidden;
				}
				.r2-tree-container .ant-tree-treenode {
					width: 100%;
				}
			`}</style>
			<Layout style={{ background: "#fff", border: "1px solid #f0f0f0", borderRadius: "8px", overflow: "hidden" }}>
				{/* 左侧文件夹树 */}
				<Sider
					width={280}
					style={{
						borderRight: "1px solid #f0f0f0",
						background: "#fafafa",
						overflow: "auto",
						overflowX: "hidden",
					}}
				>
					<Card
						title="文件树"
						size="small"
						style={{ height: "100%", borderRadius: 0 }}
						styles={{ body: { padding: "8px" } }}
					>
						<Tree
							className="r2-tree-container"
							showIcon={false}
							blockNode
							treeData={treeData}
							loadData={onLoadData}
							expandedKeys={expandedKeys}
							selectedKeys={[selectedKey]}
							onExpand={handleTreeExpand}
							onSelect={handleTreeSelect}
							titleRender={(node: any) => renderTreeNodeTitle(node)}
						/>
					</Card>
				</Sider>

				{/* 右侧内容区 */}
				<Content style={{ padding: "16px", overflow: "auto" }}>
					{/* 工具栏 */}
					<div style={{ marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16 }}>
						<Breadcrumb
							style={{ flex: 1, minWidth: 0 }}
							items={breadcrumbItems.map((item, index) => ({
								title: (
									<span
										onClick={() => index < breadcrumbItems.length - 1 && navigateToPath(item.path)}
										style={{
											cursor: index < breadcrumbItems.length - 1 ? "pointer" : "default",
										}}
									>
										{item.title}
									</span>
								),
								key: item.path,
							}))}
						/>
						<Space>
							<Input
								placeholder="搜索文件..."
								prefix={<SearchOutlined />}
								allowClear
								style={{ width: 200 }}
								value={searchKeyword}
								onChange={(e) => setSearchKeyword(e.target.value)}
							/>
							{!hasRefreshed && (
								<Text type="secondary">点击"刷新"加载数据</Text>
							)}
							<Button icon={<ReloadOutlined />} onClick={handleRefresh} loading={loading}>
								刷新
							</Button>
							<Button icon={<PlusOutlined />} onClick={() => setCreateFolderModalVisible(true)}>
								新建文件夹
							</Button>
							<Button type="primary" icon={<UploadOutlined />} onClick={() => setUploadModalVisible(true)}>
								上传文件
							</Button>
						</Space>
					</div>

					{/* 未刷新状态 */}
					{!hasRefreshed ? (
						<Empty
							image={Empty.PRESENTED_IMAGE_SIMPLE}
							description={
								<div>
									<p>暂未加载数据</p>
									<p style={{ color: "#999", fontSize: 12 }}>
										点击"刷新"按钮加载（A类操作）
									</p>
								</div>
							}
						>
							<Button type="primary" onClick={handleRefresh}>
								立即刷新
							</Button>
						</Empty>
					) : (
						<>
							{/* 文件夹网格 */}
							{filteredFolders.length > 0 && (
								<div style={{ marginBottom: 16 }}>
									<div style={{ fontSize: 14, fontWeight: 500, marginBottom: 12, color: "#333" }}>
										<FolderOutlined /> 文件夹 ({filteredFolders.length})
									</div>
									<Row gutter={[12, 12]}>
										{filteredFolders.map((folder) => (
											<Col key={folder} xs={12} sm={8} md={6} lg={4} xl={3}>
												<Card
													hoverable
													styles={{ body: { padding: "12px" } }}
													size="small"
												>
													<div
														onClick={() => enterFolder(folder)}
														style={{ textAlign: "center", cursor: "pointer" }}
													>
														<FolderOutlined style={{ fontSize: "32px", color: "#faad14" }} />
														<div style={{ marginTop: 4, fontSize: 12 }}>{folder}</div>
													</div>
												</Card>
											</Col>
										))}
									</Row>
								</div>
							)}

							{/* 文件列表 */}
							<div>
								<div style={{ fontSize: 14, fontWeight: 500, marginBottom: 12, color: "#333" }}>
									<FileOutlined /> 文件列表 ({filteredObjects.length})
								</div>
								{loading ? (
									<div style={{ textAlign: "center", padding: "40px" }}>
										<Spin />
									</div>
								) : filteredObjects.length === 0 ? (
									<Empty description={searchKeyword ? "没有找到匹配的文件" : (folders.length === 0 ? "暂无文件" : "当前目录下暂无文件")} />
								) : (
									<div style={{ background: "#fff", borderRadius: "8px", border: "1px solid #f0f0f0" }}>
										{filteredObjects.map((obj) => (
											<div
												key={obj.key}
												style={{
													borderBottom: "1px solid #f0f0f0",
													padding: "12px 16px",
													display: "flex",
													alignItems: "center",
													gap: 16,
												}}
											>
												{getFileIcon(obj)}
												<div style={{ flex: 1, minWidth: 0 }}>
													<div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
														<Text ellipsis style={{ maxWidth: 300, margin: 0 }}>{getDisplayName(obj.key)}</Text>
													</div>
													<Space size="middle">
														<Tag color="blue">{formatSize(obj.size)}</Tag>
														<Tag color="geekblue">{obj.httpMetadata?.contentType || "未知类型"}</Tag>
													</Space>
												</div>
												<Space size="small">
													{canPreview(obj) && (
														<Tooltip title="预览">
															<Button
																type="text"
																icon={<EyeOutlined />}
																onClick={() => handlePreview(obj)}
															/>
														</Tooltip>
													)}
													<Tooltip title="下载">
														<Button
															type="text"
															icon={<DownloadOutlined />}
															onClick={() => handleDownload(obj.key)}
														/>
													</Tooltip>
													<Tooltip title="删除">
														<Button
															type="text"
															danger
															icon={<DeleteOutlined />}
															onClick={() => handleDeleteObject(obj)}
														/>
													</Tooltip>
												</Space>
											</div>
										))}
									</div>
								)}
							</div>
						</>
					)}
				</Content>
			</Layout>
			{/* 上传 Modal */}
			<Modal title="上传文件" open={uploadModalVisible} onCancel={() => setUploadModalVisible(false)} footer={null}>
				<Dragger customRequest={handleUpload} multiple showUploadList>
					<p className="ant-upload-drag-icon">
						<InboxOutlined />
					</p>
					<p style={{ fontSize: 16, marginTop: 16 }}>点击或拖拽文件到此区域上传</p>
					<p style={{ color: "#999", marginTop: 8 }}>支持多文件上传，单个文件最大 200MB</p>
					<p style={{ color: "#999" }}>当前路径: {currentPath || "根目录"}</p>
				</Dragger>
			</Modal>

			{/* 新建文件夹 Modal */}
			<Modal
				title="新建文件夹"
				open={createFolderModalVisible}
				onOk={handleCreateFolder}
				onCancel={() => {
					setCreateFolderModalVisible(false);
					setNewFolderName("");
				}}
			>
				<Input
					placeholder="请输入文件夹名称"
					value={newFolderName}
					onChange={(e) => setNewFolderName(e.target.value)}
					onPressEnter={handleCreateFolder}
					maxLength={50}
				/>
				<p style={{ color: "#999", marginTop: 8, fontSize: 12 }}>
					文件夹将创建于: {currentPath || "根目录"}
				</p>
			</Modal>

			{/* 重命名 Modal */}
			<Modal
				title={`重命名${renameItem?.type === "folder" ? "文件夹" : "文件"}`}
				open={renameModalVisible}
				onOk={handleRenameConfirm}
				onCancel={() => {
					setRenameModalVisible(false);
					setRenameItem(null);
					setNewName("");
				}}
			>
				<Input
					placeholder="请输入新名称"
					value={newName}
					onChange={(e) => setNewName(e.target.value)}
					onPressEnter={handleRenameConfirm}
					maxLength={50}
				/>
				<p style={{ color: "#999", marginTop: 8, fontSize: 12 }}>
					重命名: {renameItem?.name}
				</p>
			</Modal>

			{/* 预览 Modal */}
			<Modal
				title={previewFile ? getDisplayName(previewFile.key) : ""}
				open={!!previewFile}
				onCancel={() => {
					setPreviewFile(null);
					setPreviewContent(null);
				}}
				footer={[
					<Button key="close" onClick={() => { setPreviewFile(null); setPreviewContent(null); }}>
						关闭
					</Button>,
					<Button
						key="download"
						type="primary"
						icon={<DownloadOutlined />}
						onClick={() => previewFile && handleDownload(previewFile.key)}
					>
						下载
					</Button>,
				]}
				width="80%"
				style={{ top: 20 }}
			>
				{previewLoading ? (
					<div style={{ textAlign: "center", padding: "40px" }}>
						<Spin size="large" />
					</div>
				) : previewFile?.httpMetadata?.contentType?.startsWith("image/") ? (
					<div style={{ textAlign: "center" }}>
						<Image src={previewContent || undefined} alt={previewFile?.key} style={{ maxWidth: "100%", maxHeight: "70vh" }} />
					</div>
				) : (
					<pre
						style={{
															padding: "16px",
															background: "#f5f5f5",
															borderRadius: "4px",
															overflow: "auto",
															maxHeight: "70vh",
															fontSize: "12px",
															lineHeight: "1.5",
														}}
					>
						{previewContent}
					</pre>
				)}
			</Modal>
		</>
	);
}
