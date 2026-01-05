/**
 * Vite 插件：处理 console.log 的 -d 标记
 * - 生产环境：移除没有 -d 标记的 console.log，保留有 -d 标记的（移除 -d 参数）
 * - 开发环境：保留所有 console.log
 */

import { Plugin, ResolvedConfig } from 'vite';

export function consoleStrip(): Plugin {
	let config: ResolvedConfig;

	return {
		name: 'vite-plugin-console-strip',
		configResolved(resolvedConfig) {
			config = resolvedConfig;
		},
		transform(code, id) {
			// 只处理 .ts, .tsx, .js, .jsx 文件
			if (!/\.(ts|tsx|js|jsx)$/.test(id)) {
				return null;
			}

			// 跳过 node_modules
			if (id.includes('node_modules')) {
				return null;
			}

			// 开发环境不处理（保留所有 console.log）
			if (config.command === 'serve') {
				return null;
			}

			// 生产环境处理
			// 匹配 console.log 的各种形式
			// 1. console.log("-d", ...) -> 保留，移除 "-d"
			// 2. console.log(...) -> 移除（如果不以 "-d" 开头）

			let result = code;

			// 处理带 -d 标记的 console.log
			// console.log("-d", ...) -> console.log(...)
			result = result.replace(
				/console\.log\(\s*["']-d["']\s*,\s*/g,
				'console.log('
			);

			// 处理不带 -d 标记的 console.log（移除整行）
			// 跳过已经处理过的（即原来带 -d 的）
			const lines = result.split('\n');
			const filteredLines = lines.filter(line => {
				// 跳过注释
				const trimmed = line.trim();
				if (trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')) {
					return true;
				}

				// 检查是否有 console.log 但不是以 -d 开头
				// 使用正则检查
				const consoleLogMatch = line.match(/console\.log\(/);
				if (!consoleLogMatch || consoleLogMatch.index === undefined) {
					return true; // 没有 console.log，保留
				}

				// 有 console.log，检查是否紧跟 "-d"
				const afterConsoleLog = line.substring(consoleLogMatch.index + 11); // 11 = "console.log(".length
				const trimmedAfter = afterConsoleLog.trim();

				// 如果紧跟 "-d"，说明是保留的，返回 true
				if (trimmedAfter.startsWith('"-d"') || trimmedAfter.startsWith("'-d'")) {
					return true;
				}

				// 否则移除这行
				return false;
			});

			result = filteredLines.join('\n');

			return {
				code: result,
				map: null, // 不生成 source map（简化处理）
			};
		},
	};
}
