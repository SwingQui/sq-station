#!/usr/bin/env node

const { spawn } = require("child_process");
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

console.log("🚀 启动本地开发环境\n");

// 1. 先同步远程 KV 到本地
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log("1️⃣ 同步远程 KV 数据到本地缓存");
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

try {
	execSync("node scripts/sync-kv.cjs auto", { stdio: "inherit" });
} catch (e) {
	console.log("⚠️ 同步失败，但继续启动...\n");
}

// 2. 启动 Wrangler (使用本地 KV)
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log("2️⃣ 启动 Wrangler 开发服务器 (端口 8787)");
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log("   本地 KV: .wrangler/state/v3/kv/");
console.log("   远程 KV: 已同步到本地\n");

const wrangler = spawn("npx", ["wrangler", "dev"], {
	cwd: process.cwd(),
	stdio: "inherit",
	shell: true
});

// 处理退出
process.on("SIGINT", () => {
	console.log("\n\n🛑 正在关闭开发服务器...");
	wrangler.kill();
	process.exit(0);
});

wrangler.on("close", (code) => {
	console.log(`\n开发服务器退出，代码: ${code}`);
	process.exit(code || 0);
});
