// 本地开发环境初始化脚本
// 用于在 npm install 之后初始化本地开发环境
// 功能：
// 1. 清除本地 KV、D1、R2 缓存
// 2. 初始化本地数据库表
// 3. 同步远程数据到本地

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const WRANGLER_STATE_DIR = path.join(process.cwd(), ".wrangler", "state", "v3");

// 执行命令
function exec(cmd, silent = false) {
	try {
		return execSync(cmd, { encoding: "utf-8", stdio: silent ? "pipe" : "inherit" });
	} catch (e) {
		return null;
	}
}

// 删除文件夹
function deleteFolder(dirPath) {
	const fullPath = path.join(process.cwd(), dirPath);
	if (fs.existsSync(fullPath)) {
		fs.rmSync(fullPath, { recursive: true, force: true });
		return true;
	}
	return false;
}

console.log("\n🚀 初始化本地开发环境...\n");

// 1. 清除本地缓存
console.log("1️⃣ 清除本地缓存...");
const caches = [
	{ path: ".wrangler/state/v3/kv", name: "KV" },
	{ path: ".wrangler/state/v3/d1", name: "D1" },
	{ path: ".wrangler/state/v3/r2", name: "R2" },
];

for (const cache of caches) {
	const deleted = deleteFolder(cache.path);
	if (deleted) {
		console.log(`   ✓ 已清除 ${cache.name} 本地缓存`);
	} else {
		console.log(`   ℹ ${cache.name} 本地缓存不存在，跳过`);
	}
}
console.log();

// 2. 初始化本地数据库表
console.log("2️⃣ 初始化本地数据库表...");
exec("npm run d1:migrate:local");
console.log();

// 3. 同步远程数据到本地
console.log("3️⃣ 同步远程数据到本地...");
exec("npm run sync");
console.log();

console.log("✅ 初始化完成！\n");
