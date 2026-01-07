#!/usr/bin/env node

/**
 * 加载 .dev.vars 环境变量并执行命令
 */

import { readFileSync } from 'fs';
import { spawn } from 'child_process';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = resolve(__dirname, '..');

// 读取 .dev.vars 文件
function loadEnvVars() {
	const devVarsPath = resolve(rootDir, '.dev.vars');
	try {
		const content = readFileSync(devVarsPath, 'utf-8');
		const envVars = {};

		for (const line of content.split('\n')) {
			const trimmed = line.trim();
			// 跳过注释和空行
			if (!trimmed || trimmed.startsWith('#')) continue;

			// 解析 KEY=VALUE 格式
			const [key, ...valueParts] = trimmed.split('=');
			if (key && valueParts.length > 0) {
				envVars[key.trim()] = valueParts.join('=').trim();
			}
		}

		return envVars;
	} catch (error) {
		if (error.code === 'ENOENT') {
			console.warn('警告: .dev.vars 文件不存在');
		} else {
			console.error('读取 .dev.vars 失败:', error.message);
		}
		return {};
	}
}

// 主函数
function main() {
	const envVars = loadEnvVars();

	if (!envVars.CLOUDFLARE_API_TOKEN) {
		console.warn('警告: .dev.vars 中未找到 CLOUDFLARE_API_TOKEN');
		console.warn('将尝试使用已登录的用户凭证...');
	}

	// 获取命令行参数（跳过 node 和脚本路径）
	const args = process.argv.slice(2);

	if (args.length === 0) {
		console.error('用法: node scripts/load-env.mjs <命令> [参数...]');
		console.error('示例: node scripts/load-env.mjs npm run deploy');
		process.exit(1);
	}

	// 合并环境变量
	const env = { ...process.env, ...envVars };

	// 执行命令
	const proc = spawn(args[0], args.slice(1), {
		env,
		stdio: 'inherit',
		shell: true,
		cwd: rootDir
	});

	proc.on('exit', (code) => {
		process.exit(code ?? 0);
	});

	proc.on('error', (error) => {
		console.error('执行命令失败:', error);
		process.exit(1);
	});
}

main();
