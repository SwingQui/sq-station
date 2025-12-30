#!/usr/bin/env node

const { execSync } = require("child_process");

console.log("🔄 同步远程数据到本地\n");

// 1. 同步 KV
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log("1️⃣ 同步远程 KV 数据");
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

try {
	execSync("node scripts/sync-kv.cjs import", { stdio: "inherit" });
	console.log("✅ KV 同步完成\n");
} catch (e) {
	console.log("⚠️ KV 同步失败\n");
}

// 2. 同步 D1
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log("2️⃣ 同步远程 D1 数据");
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

try {
	execSync("node scripts/sync-d1.cjs import", { stdio: "inherit" });
	console.log("✅ D1 同步完成\n");
} catch (e) {
	console.log("⚠️ D1 同步失败\n");
}

console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log("✨ 数据同步完成");
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
