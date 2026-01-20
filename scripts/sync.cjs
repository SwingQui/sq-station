#!/usr/bin/env node

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

console.log("🔄 同步远程数据到本地（完整重置）\n");

// ==================== 工具函数 ====================

function exec(cmd, silent = false) {
	try {
		return execSync(cmd, { encoding: "utf-8", stdio: silent ? "pipe" : "inherit" });
	} catch (e) {
		return null;
	}
}

function removeDir(dir) {
	if (fs.existsSync(dir)) {
		fs.rmSync(dir, { recursive: true, force: true });
		console.log(`   ✓ 已删除: ${dir}`);
	}
}

function removeFile(file) {
	if (fs.existsSync(file)) {
		fs.unlinkSync(file);
		console.log(`   ✓ 已删除: ${file}`);
	}
}

function timestamp() {
	const now = new Date();
	const year = now.getFullYear();
	const month = String(now.getMonth() + 1).padStart(2, "0");
	const day = String(now.getDate()).padStart(2, "0");
	const hours = String(now.getHours()).padStart(2, "0");
	const minutes = String(now.getMinutes()).padStart(2, "0");
	const seconds = String(now.getSeconds()).padStart(2, "0");
	return `${year}-${month}-${day}-${hours}-${minutes}-${seconds}`;
}

// ==================== 1. 备份本地数据 ====================

console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log("1️⃣ 备份本地数据");
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

// 备份 D1
console.log("📦 备份本地 D1 数据...");
try {
	execSync("node scripts/sync-d1.cjs backup:local", { stdio: "inherit" });
} catch (e) {
	console.log("⚠️  D1 备份失败（可能本地数据库为空）\n");
}

// 备份 KV（通过 wrangler 备份）
console.log("\n📦 备份本地 KV 数据...");
const kvBackupDir = path.join(process.cwd(), "sql", ".backup", "kv");
if (!fs.existsSync(kvBackupDir)) {
	fs.mkdirSync(kvBackupDir, { recursive: true });
}

const kvBackupFile = path.join(kvBackupDir, `local-${timestamp()}.json`);
try {
	const kvResult = exec("npx wrangler kv key list --namespace-id=0db26ad794b242aea90aa08281a7dfa2", true);
	if (kvResult) {
		const keys = JSON.parse(kvResult);
		const backupData = {};
		for (const key of keys) {
			try {
				const value = exec(`npx wrangler kv key get "${key.name}" --namespace-id=0db26ad794b242aea90aa08281a7dfa2 --text`, true);
				if (value !== null) {
					backupData[key.name] = value.trim();
				}
			} catch (e) {}
		}
		if (Object.keys(backupData).length > 0) {
			fs.writeFileSync(kvBackupFile, JSON.stringify(backupData, null, 2));
			console.log(`   ✓ 备份完成: ${kvBackupFile}`);
		} else {
			console.log("   ℹ 本地 KV 为空");
		}
	}
} catch (e) {
	console.log("   ℹ 本地 KV 备份失败（可能不存在）");
}

console.log("\n✅ 备份完成\n");

// ==================== 2. 删除本地数据 ====================

console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log("2️⃣ 删除本地数据");
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

console.log("🗑️  删除本地 D1 数据库...");
// 删除 D1 本地数据库文件
const d1Paths = [
	path.join(process.cwd(), ".wrangler", "state", "v3", "d1", "miniflare-D1DatabaseObject"),
	path.join(process.cwd(), ".wrangler", "state", "v3", "d1"),
];
for (const p of d1Paths) {
	removeDir(p);
}

console.log("\n🗑️  删除本地 KV 存储...");
// 删除 KV 本地存储和缓存
const kvPaths = [
	path.join(process.cwd(), ".wrangler", "state", "v3", "kv"),
	path.join(process.cwd(), ".wrangler", "kv-cache.json"),
];
for (const p of kvPaths) {
	if (fs.existsSync(p) && fs.statSync(p).isDirectory()) {
		removeDir(p);
	} else {
		removeFile(p);
	}
}

console.log("\n✅ 本地数据已清空\n");

// ==================== 3. 导入远程数据 ====================

console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log("3️⃣ 导入远程数据");
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

// 导入 D1
console.log("\n📥 导入远程 D1 数据...");
try {
	execSync("node scripts/sync-d1.cjs import", { stdio: "inherit" });
} catch (e) {
	console.log("❌ D1 导入失败");
	process.exit(1);
}

// 导入 KV
console.log("\n📥 导入远程 KV 数据...");
try {
	execSync("node scripts/sync-kv.cjs import", { stdio: "inherit" });
} catch (e) {
	console.log("❌ KV 导入失败");
	process.exit(1);
}

console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log("✨ 数据同步完成");
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log("\n📁 备份位置:");
console.log(`   D1: ${path.join(process.cwd(), "sql", ".backup", "d1")}`);
console.log(`   KV: ${kvBackupFile}`);
console.log();
