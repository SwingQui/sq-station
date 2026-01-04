/**
 * 图标映射表
 * 将数据库 icon 字段映射到 react-icons 组件
 */

import { IconType } from "react-icons";
import {
	FaUser,
	FaUsers,
	FaCog,
	FaList,
	FaListAlt,
	FaHome,
	FaDatabase,
	FaKey,
	FaSearch,
	FaEdit,
	FaTrash,
	FaPlus,
	FaSync,
	FaSave,
	FaTimes,
	FaCheck,
	FaFolder,
	FaFile,
	FaBars,
	FaWrench,
	FaChartLine,
	FaCode,
	FaLock,
	FaUnlock,
	FaBell,
	FaEnvelope,
	FaPhone,
	FaCalendar,
	FaClock,
	FaMapMarker,
	FaLink,
	FaDownload,
	FaUpload,
	FaShare,
	FaPrint,
	FaEye,
	FaEyeSlash,
	FaFilter,
	FaSort,
	FaArrowLeft,
	FaArrowRight,
	FaArrowUp,
	FaArrowDown,
	FaInfoCircle,
	FaExclamationCircle,
	FaCheckCircle,
	FaTimesCircle,
} from "react-icons/fa";

// 图标组件映射
export const iconsMap: Record<string, IconType> = {
	// 系统管理
	FaCog,

	// 用户管理
	FaUser,
	FaUsers,

	// 角色管理
	FaKey,

	// 菜单管理
	FaList,

	// 通用
	FaHome,
	FaChartLine,
	FaListAlt,
	FaEdit,
	FaTrash,
	FaPlus,
	FaSearch,
	FaSync,
	FaSave,
	FaTimes,
	FaCheck,

	// 文件
	FaFile,
	FaFolder,

	// 数据
	FaDatabase,
	FaCode,

	// 其他
	FaBars,
	FaWrench,

	// 新增常用图标
	FaLock,
	FaUnlock,
	FaBell,
	FaEnvelope,
	FaPhone,
	FaCalendar,
	FaClock,
	FaMapMarker,
	FaLink,
	FaDownload,
	FaUpload,
	FaShare,
	FaPrint,
	FaEye,
	FaEyeSlash,
	FaFilter,
	FaSort,
	FaArrowLeft,
	FaArrowRight,
	FaArrowUp,
	FaArrowDown,
	FaInfoCircle,
	FaExclamationCircle,
	FaCheckCircle,
	FaTimesCircle,
};

// 别名映射（保持向后兼容）
export const aliasMap: Record<string, string> = {
	// 系统管理别名
	"system": "FaCog",
	"setting": "FaCog",
	"settings": "FaCog",
	"config": "FaCog",
	"cog": "FaCog",

	// 用户管理别名
	"user": "FaUser",
	"users": "FaUsers",
	"admin": "FaUser",
	"profile": "FaUser",
	"person": "FaUser",
	"User": "FaUser",

	// 角色管理别名
	"role": "FaUsers",
	"roles": "FaUsers",
	"Role": "FaUsers",
	"permission": "FaKey",
	"key": "FaKey",

	// 菜单管理别名
	"menu": "FaList",
	"menus": "FaList",
	"Menu": "FaList",
	"tree": "FaList",
	"list": "FaList",

	// 通用别名
	"home": "FaHome",
	"Home": "FaHome",
	"dashboard": "FaChartLine",
	"content": "FaListAlt",
	"edit": "FaEdit",
	"delete": "FaTrash",
	"add": "FaPlus",
	"create": "FaPlus",
	"refresh": "FaSync",
	"save": "FaSave",
	"cancel": "FaTimes",
	"confirm": "FaCheck",
	"close": "FaTimes",

	// 文件别名
	"file": "FaFile",
	"files": "FaFile",
	"Page1": "FaFile",
	"Page2": "FaFile",
	"folder": "FaFolder",

	// 数据别名
	"database": "FaDatabase",
	"Database": "FaDatabase",
	"kv": "FaDatabase",
	"sql": "FaDatabase",
	"Code": "FaCode",
	"code": "FaCode",

	// 其他别名
	"bars": "FaBars",
	"tool": "FaWrench",
	"tools": "FaWrench",
	"Setting": "FaCog",
};

// 获取图标组件
export function getIcon(name: string | null): IconType | null {
	if (!name) return null;
	const iconName = aliasMap[name] || name;
	return iconsMap[iconName] || null;
}

// 图标列表（用于选择器）
export const iconOptions = [
	{ name: "FaCog", label: "齿轮 (设置)" },
	{ name: "FaUser", label: "用户" },
	{ name: "FaUsers", label: "用户组" },
	{ name: "FaKey", label: "密钥 (权限)" },
	{ name: "FaList", label: "列表 (菜单)" },
	{ name: "FaHome", label: "首页" },
	{ name: "FaChartLine", label: "折线图 (仪表盘)" },
	{ name: "FaListAlt", label: "内容列表" },
	{ name: "FaEdit", label: "编辑" },
	{ name: "FaTrash", label: "删除" },
	{ name: "FaPlus", label: "添加" },
	{ name: "FaSearch", label: "搜索" },
	{ name: "FaSync", label: "刷新" },
	{ name: "FaSave", label: "保存" },
	{ name: "FaTimes", label: "关闭/取消" },
	{ name: "FaCheck", label: "确认" },
	{ name: "FaFile", label: "文件" },
	{ name: "FaFolder", label: "文件夹" },
	{ name: "FaDatabase", label: "数据库" },
	{ name: "FaCode", label: "代码" },
	{ name: "FaBars", label: "菜单栏" },
	{ name: "FaWrench", label: "工具" },
	{ name: "FaLock", label: "锁定" },
	{ name: "FaUnlock", label: "解锁" },
	{ name: "FaBell", label: "通知/铃铛" },
	{ name: "FaEnvelope", label: "邮件" },
	{ name: "FaPhone", label: "电话" },
	{ name: "FaCalendar", label: "日历" },
	{ name: "FaClock", label: "时钟" },
	{ name: "FaMapMarker", label: "地图标记" },
	{ name: "FaLink", label: "链接" },
	{ name: "FaDownload", label: "下载" },
	{ name: "FaUpload", label: "上传" },
	{ name: "FaShare", label: "分享" },
	{ name: "FaPrint", label: "打印" },
	{ name: "FaEye", label: "显示" },
	{ name: "FaEyeSlash", label: "隐藏" },
	{ name: "FaFilter", label: "筛选" },
	{ name: "FaSort", label: "排序" },
	{ name: "FaArrowLeft", label: "左箭头" },
	{ name: "FaArrowRight", label: "右箭头" },
	{ name: "FaArrowUp", label: "上箭头" },
	{ name: "FaArrowDown", label: "下箭头" },
	{ name: "FaInfoCircle", label: "信息" },
	{ name: "FaExclamationCircle", label: "警告" },
	{ name: "FaCheckCircle", label: "成功" },
	{ name: "FaTimesCircle", label: "错误" },
];
