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
} from "react-icons/fa";

export const iconsMap: Record<string, IconType> = {
	// 系统管理
	"system": FaCog,
	"setting": FaCog,
	"settings": FaCog,
	"config": FaCog,
	"cog": FaCog,

	// 用户管理
	"user": FaUser,
	"users": FaUsers,
	"admin": FaUser,
	"profile": FaUser,
	"person": FaUser,
	"User": FaUser,

	// 角色管理
	"role": FaUsers,
	"roles": FaUsers,
	"Role": FaUsers,
	"permission": FaKey,
	"key": FaKey,

	// 菜单管理
	"menu": FaList,
	"menus": FaList,
	"Menu": FaList,
	"tree": FaList,
	"list": FaList,

	// 通用
	"home": FaHome,
	"Home": FaHome,
	"dashboard": FaChartLine,
	"content": FaListAlt,
	"edit": FaEdit,
	"delete": FaTrash,
	"add": FaPlus,
	"create": FaPlus,
	"search": FaSearch,
	"refresh": FaSync,
	"save": FaSave,
	"cancel": FaTimes,
	"confirm": FaCheck,
	"close": FaTimes,

	// 文件
	"file": FaFile,
	"files": FaFile,
	"Page1": FaFile,
	"Page2": FaFile,
	"folder": FaFolder,

	// 数据
	"database": FaDatabase,
	"Database": FaDatabase,
	"kv": FaDatabase,
	"sql": FaDatabase,
	"Code": FaCode,
	"code": FaCode,

	// 其他
	"bars": FaBars,
	"tool": FaWrench,
	"tools": FaWrench,
	"Setting": FaCog,
};
