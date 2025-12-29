// KV 同步脚本
// import: 从远程导入到本地缓存
// export: 从本地导出到远程，导出前先备份

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const NAMESPACE_ID = "0db26ad794b242aea90aa08281a7dfa2";
const BACKUP_DIR = path.join(process.cwd(), ".wrangler", "kv-backup");
const CACHE_FILE = path.join(process.cwd(), ".wrangler", "kv-cache.json");

function exec(cmd, silent = false) {
	try {
		return execSync(cmd, { encoding: "utf-8", stdio: silent ? "pipe" : "inherit" });
	} catch (e) {
		return null;
	}
}

function ensureDir(dir) {
	if (!fs.existsSync(dir)) {
		fs.mkdirSync(dir, { recursive: true });
	}
}

// 获取时间戳
function timestamp() {
	return new Date().toISOString().replace(/[:.]/g, "-").slice(0, -5);
}

// 从远程导出到本地缓存
async function importToLocal() {
	console.log("\n📥 从远程 KV 导入数据到本地缓存...\n");

	// 获取远程所有 keys
	console.log("1️⃣ 获取远程 keys 列表...");
	const keysOutput = exec(`npx wrangler kv key list --namespace-id=${NAMESPACE_ID} --remote`, true);
	if (!keysOutput) {
		console.log("❌ 远程 KV 为空或获取失败");
		return;
	}

	let keys = [];
	try {
		keys = JSON.parse(keysOutput);
	} catch (e) {
		console.log("❌ 解析 keys 失败:", keysOutput?.slice(0, 200));
		return;
	}

	console.log(`   找到 ${keys.length} 个 keys\n`);

	const data = {};
	for (const key of keys) {
		try {
			const value = exec(`npx wrangler kv key get "${key.name}" --namespace-id=${NAMESPACE_ID} --remote --text`, true);
			if (value) {
				data[key.name] = value.trim();
				console.log(`   ✓ ${key.name}`);
			}
		} catch (e) {
			console.log(`   ✗ ${key.name} (跳过)`);
		}
	}

	// 保存到本地缓存文件
	ensureDir(path.dirname(CACHE_FILE));
	fs.writeFileSync(CACHE_FILE, JSON.stringify(data, null, 2));
	console.log(`\n✅ 已缓存 ${Object.keys(data).length} 条数据到 ${CACHE_FILE}`);

	// 写入本地 KV (wrangler dev 会读取这些数据)
	console.log("\n2️⃣ 写入本地 KV...");
	for (const [key, value] of Object.entries(data)) {
		try {
			exec(`npx wrangler kv key put "${key}" "${value}" --namespace-id=${NAMESPACE_ID}`, true);
			console.log(`   ✓ ${key}`);
		} catch (e) {
			console.log(`   ✗ ${key} (失败)`);
		}
	}
	console.log("\n✅ 本地 KV 同步完成\n");
}

// 从本地导出到远程，导出前备份
async function exportToRemote() {
	console.log("\n📤 从本地导出到远程 KV...\n");

	// 1. 先备份远程数据
	console.log("1️⃣ 备份远程数据...");
	ensureDir(BACKUP_DIR);
	const backupFile = path.join(BACKUP_DIR, `backup-${timestamp()}.json`);

	const keysOutput = exec(`npx wrangler kv key list --namespace-id=${NAMESPACE_ID} --remote`, true);
	if (keysOutput) {
		try {
			const keys = JSON.parse(keysOutput);
			const backupData = {};
			for (const key of keys) {
				try {
					const value = exec(`npx wrangler kv key get "${key.name}" --namespace-id=${NAMESPACE_ID} --remote --text`, true);
					if (value) {
						backupData[key.name] = value.trim();
					}
				} catch (e) {}
			}
			fs.writeFileSync(backupFile, JSON.stringify(backupData, null, 2));
			console.log(`   ✓ 备份已保存: ${backupFile}`);
			console.log(`   ✓ 备份了 ${Object.keys(backupData).length} 条数据\n`);
		} catch (e) {
			console.log("   ⚠ 备份失败，继续导出...\n");
		}
	}

	// 2. 读取本地数据
	console.log("2️⃣ 读取本地数据...");
	let data = {};
	if (fs.existsSync(CACHE_FILE)) {
		data = JSON.parse(fs.readFileSync(CACHE_FILE, "utf-8"));
		console.log(`   从缓存读取 ${Object.keys(data).length} 条数据\n`);
	} else {
		// 从本地 KV 读取
		const localKeysOutput = exec(`npx wrangler kv key list --namespace-id=${NAMESPACE_ID}`, true);
		if (localKeysOutput) {
			try {
				const keys = JSON.parse(localKeysOutput);
				for (const key of keys) {
					try {
						const value = exec(`npx wrangler kv key get "${key.name}" --namespace-id=${NAMESPACE_ID} --text`, true);
						if (value) {
							data[key.name] = value.trim();
						}
					} catch (e) {}
				}
				console.log(`   从本地 KV 读取 ${Object.keys(data).length} 条数据\n`);
			} catch (e) {}
		}
	}

	if (Object.keys(data).length === 0) {
		console.log("❌ 本地没有数据可导出\n");
		return;
	}

	// 3. 写入远程
	console.log("3️⃣ 写入远程 KV...");
	for (const [key, value] of Object.entries(data)) {
		try {
			exec(`npx wrangler kv key put "${key}" --path=${CACHE_FILE} --namespace-id=${NAMESPACE_ID} --remote`, true);
			console.log(`   ✓ ${key}`);
		} catch (e) {
			// 尝试直接写入
			try {
				const safeValue = value.replace(/"/g, '\\"').replace(/\n/g, '\\n');
				exec(`npx wrangler kv key put "${key}" "${safeValue}" --namespace-id=${NAMESPACE_ID} --remote`, true);
				console.log(`   ✓ ${key}`);
			} catch (e2) {
				console.log(`   ✗ ${key} (失败)`);
			}
		}
	}
	console.log("\n✅ 导出完成\n");
}

// 启动前自动同步
async function autoSync() {
	console.log("🔄 自动同步远程 KV 到本地...");
	await importToLocal();
}

const command = process.argv[2];

if (command === "import") {
	importToLocal();
} else if (command === "export") {
	exportToRemote();
} else if (command === "auto") {
	autoSync();
} else {
	console.log("用法:");
	console.log("  node scripts/sync-kv.cjs import   # 从远程导入到本地");
	console.log("  node scripts/sync-kv.cjs export   # 从本地导出到远程（会先备份）");
	console.log("  node scripts/sync-kv.cjs auto     # 自动同步（供启动脚本调用）");
}
