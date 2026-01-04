/**
 * 自动路由注册表
 * 使用 Vite 的 import.meta.glob 自动发现组件
 * 无需手动注册，创建组件文件即可自动加载
 */

import type { ComponentType } from "react";

// 自动扫描所有页面组件
const componentModules = import.meta.glob('../../../pages/**/*.tsx');

/**
 * 根据文件路径生成组件路径
 * ../../../pages/Home.tsx -> Home
 * ../../../pages/system/UserManage.tsx -> system/UserManage
 */
function getComponentPath(filePath: string): string {
	const relativePath = filePath.replace('../../../pages/', '').replace('.tsx', '');
	return relativePath;
}

/**
 * 生成自动注册表
 */
function generateRegistry(): Record<string, () => Promise<{ default: ComponentType }>> {
	const registry: Record<string, () => Promise<{ default: ComponentType }>> = {};

	Object.entries(componentModules).forEach(([filePath, loader]) => {
		// 跳过 index 文件和以 _ 开头的文件
		const fileName = filePath.split('/').pop() || '';
		if (fileName.startsWith('_') || fileName === 'index.tsx') {
			return;
		}

		const componentPath = getComponentPath(filePath);
		registry[componentPath] = loader as () => Promise<{ default: ComponentType }>;
	});

	return registry;
}

// 自动生成注册表
const componentRegistry = generateRegistry();

// 组件缓存
const componentCache: Record<string, ComponentType> = {};

/**
 * 加载组件
 */
export async function loadComponent(componentPath: string): Promise<ComponentType | null> {
	// 检查缓存
	if (componentCache[componentPath]) {
		return componentCache[componentPath];
	}

	// 查找加载器
	const loader = componentRegistry[componentPath];
	if (!loader) {
		console.warn(`Component not found: ${componentPath}`);
		console.warn('Available components:', Object.keys(componentRegistry));
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
 * 获取所有已注册的组件路径
 */
export function getAllRegisteredPaths(): string[] {
	return Object.keys(componentRegistry).sort();
}

/**
 * 检查组件是否已注册
 */
export function hasComponent(path: string): boolean {
	return path in componentRegistry;
}

/**
 * 清除组件缓存
 */
export function clearComponentCache(): void {
	for (const key in componentCache) {
		delete componentCache[key];
	}
}

/**
 * 清除指定组件的缓存
 */
export function clearComponentCacheItem(path: string): void {
	delete componentCache[path];
}

/**
 * 开发环境：验证组件映射
 */
if (import.meta.env.DEV) {
	console.log('[RouteRegistry] Auto-registered components:', Object.keys(componentRegistry).length);
	console.log('[RouteRegistry] Available paths:', Object.keys(componentRegistry));
}
