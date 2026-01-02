/**
 * 路由注册表
 * 将组件路径映射到实际组件
 */

// 组件映射表
const componentRegistry: Record<string, () => Promise<{ default: React.ComponentType }>> = {
	// 前台页面
	"Home": () => import("../pages/Home"),
	"Page1": () => import("../pages/Page1"),
	"Page2": () => import("../pages/Page2"),

	// 系统管理页面
	"system/Menu": () => import("../pages/system/Menu"),
	"system/MenuPage1": () => import("../pages/system/MenuPage1"),
	"system/MenuPage2": () => import("../pages/system/MenuPage2"),
	"system/TestKV": () => import("../pages/system/TestKV"),
	"system/TestSQL": () => import("../pages/system/TestSQL"),
	"system/UserManage": () => import("../pages/system/UserManage"),
	"system/RoleManage": () => import("../pages/system/RoleManage"),
	"system/MenuManage": () => import("../pages/system/MenuManage"),
};

// 组件缓存
const componentCache: Record<string, React.ComponentType> = {};

/**
 * 根据组件路径动态加载组件
 */
export async function loadComponent(componentPath: string): Promise<React.ComponentType | null> {
	// 如果已缓存，直接返回
	if (componentCache[componentPath]) {
		return componentCache[componentPath];
	}

	// 查找加载器
	const loader = componentRegistry[componentPath];
	if (!loader) {
		console.warn(`Component not found: ${componentPath}`);
		return null;
	}

	try {
		const module = await loader();
		const component = module.default;
		// 缓存组件
		componentCache[componentPath] = component;
		return component;
	} catch (error) {
		console.error(`Failed to load component: ${componentPath}`, error);
		return null;
	}
}

/**
 * 注册新组件
 */
export function registerComponent(path: string, loader: () => Promise<{ default: React.ComponentType }>) {
	componentRegistry[path] = loader;
}
