import type { KVKey } from "../../../../api/kv";

// KV 项目扩展接口
export interface KVItem extends KVKey {
	value: string;
	parsedValue?: unknown;
	valueType: "json" | "url" | "xml" | "yaml" | "text";
	namespace: string;
	key: string;
}

// 命名空间分组
export interface NamespaceGroup {
	namespace: string;
	count: number;
	items: KVItem[];
}

/**
 * 解析 Key 格式: "namespace:key"
 * 支持多级冒号，如 "bookmarks:config:settings"
 */
export function parseKVKey(key: string): { namespace: string; key: string } {
	const parts = key.split(":");
	if (parts.length >= 2) {
		return {
			namespace: parts.slice(0, -1).join(":"),
			key: parts[parts.length - 1],
		};
	}
	return { namespace: "default", key };
}

/**
 * 检测值类型
 */
export function detectValueType(value: string): KVItem["valueType"] {
	const trimmed = value.trim();

	// 空值
	if (!trimmed) {
		return "text";
	}

	// JSON 检测
	if ((trimmed.startsWith("{") && trimmed.endsWith("}")) ||
		(trimmed.startsWith("[") && trimmed.endsWith("]"))) {
		try {
			JSON.parse(trimmed);
			return "json";
		} catch {
			// 不是有效的 JSON
		}
	}

	// URL 检测
	if (/^https?:\/\//i.test(trimmed)) {
		return "url";
	}

	// XML 检测
	if (trimmed.startsWith("<?xml") || trimmed.startsWith("<")) {
		return "xml";
	}

	// YAML 检测(简单检测)
	if (/^\s*[\w-]+:\s*.+$/m.test(trimmed)) {
		return "yaml";
	}

	return "text";
}

/**
 * 获取值类型的颜色标签
 */
export function getValueTypeColor(valueType: KVItem["valueType"]): string {
	switch (valueType) {
		case "json":
			return "blue";
		case "url":
			return "green";
		case "xml":
			return "orange";
		case "yaml":
			return "purple";
		default:
			return "default";
	}
}

/**
 * 分组和排序 KV
 */
export function groupAndSortKVs(keys: KVKey[], valuesMap: Map<string, string>): NamespaceGroup[] {
	const grouped = new Map<string, KVItem[]>();

	// 解析并分组
	keys.forEach((kv) => {
		const { namespace, key } = parseKVKey(kv.name);
		const value = valuesMap.get(kv.name) || "";
		const valueType = detectValueType(value);

		let parsedValue: unknown;
		try {
			parsedValue = valueType === "json" ? JSON.parse(value) : value;
		} catch {
			parsedValue = value;
		}

		const item: KVItem = {
			...kv,
			value,
			parsedValue,
			valueType,
			namespace,
			key,
		};

		if (!grouped.has(namespace)) {
			grouped.set(namespace, []);
		}
		grouped.get(namespace)!.push(item);
	});

	// 转换为数组并排序
	return Array.from(grouped.entries())
		.map(([namespace, items]) => ({
			namespace,
			count: items.length,
			items: items.sort((a, b) => a.key.localeCompare(b.key, "zh-CN")),
		}))
		.sort((a, b) => a.namespace.localeCompare(b.namespace, "zh-CN"));
}

/**
 * 尝试格式化 JSON 值
 */
export function formatJSON(value: string): string {
	try {
		const parsed = JSON.parse(value);
		return JSON.stringify(parsed, null, 2);
	} catch {
		return value;
	}
}
