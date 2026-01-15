// KV 同步脚本
// import: 从远程导入到本地缓存
// export: 从本地导出到远程，导出前先备份
// apply: 从 kv-schema.json 应用到本地/远程 KV
// validate: 验证 kv-schema.json 文件格式

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const NAMESPACE_ID = "0db26ad794b242aea90aa08281a7dfa2";
const BACKUP_DIR = path.join(process.cwd(), ".wrangler", "kv-backup");
const CACHE_FILE = path.join(process.cwd(), ".wrangler", "kv-cache.json");
const SCHEMA_FILE = path.join(process.cwd(), "kv-schema.json");

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

// 从本地 KV 读取所有数据（wrangler dev 的实际存储）
function readLocalKV() {
	console.log("   从本地 KV 读取数据...");
	const data = {};
	try {
		const keysOutput = exec(`npx wrangler kv key list --namespace-id=${NAMESPACE_ID}`, true);
		if (keysOutput) {
			const keys = JSON.parse(keysOutput);
			console.log(`   找到 ${keys.length} 个 keys`);
			for (const key of keys) {
				try {
					const value = exec(`npx wrangler kv key get "${key.name}" --namespace-id=${NAMESPACE_ID} --text`, true);
					if (value !== null) {
						data[key.name] = value.trim();
					}
				} catch (e) {
					console.log(`   ✗ ${key.name} (读取失败)`);
				}
			}
		}
	} catch (e) {
		console.log("   ⚠ 本地 KV 读取失败");
	}
	return data;
}

// 写入本地 KV
function writeLocalKV(data) {
	for (const [key, value] of Object.entries(data)) {
		try {
			// 使用临时文件处理特殊字符
			const tmpFile = path.join(process.cwd(), ".wrangler", "kv-temp.txt");
			fs.writeFileSync(tmpFile, String(value));
			exec(`npx wrangler kv key put "${key}" --path="${tmpFile}" --namespace-id=${NAMESPACE_ID}`, true);
			fs.unlinkSync(tmpFile);
		} catch (e) {
			// 回退到直接写入
			try {
				const safeValue = String(value).replace(/"/g, '\\"').replace(/\n/g, '\\n');
				exec(`npx wrangler kv key put "${key}" "${safeValue}" --namespace-id=${NAMESPACE_ID}`, true);
			} catch (e2) {
				console.log(`   ✗ ${key} (写入失败)`);
			}
		}
	}
}

// 从远程导出到本地缓存
async function importToLocal() {
	console.log("\n📥 从远程 KV 导入数据到本地...\n");

	// 0️⃣ 先清理本地旧数据
	console.log("0️⃣ 清理本地 KV 旧数据...");
	try {
		// 获取本地所有 keys
		const localKeysOutput = exec(`npx wrangler kv key list --namespace-id=${NAMESPACE_ID}`, true);
		if (localKeysOutput) {
			const localKeys = JSON.parse(localKeysOutput);
			if (localKeys.length > 0) {
				// 删除本地所有 keys
				for (const key of localKeys) {
					try {
						exec(`npx wrangler kv key delete "${key.name}" --namespace-id=${NAMESPACE_ID}`, true);
					} catch (e) {}
				}
				console.log(`   ✓ 清理了 ${localKeys.length} 个旧 keys\n`);
			} else {
				console.log("   ✓ 本地无旧数据\n");
			}
		}
	} catch (e) {
		console.log("   ⚠ 清理失败，继续导入...\n");
	}

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
			if (value !== null) {
				data[key.name] = value.trim();
				console.log(`   ✓ ${key.name}`);
			}
		} catch (e) {
			console.log(`   ✗ ${key.name} (跳过)`);
		}
	}

	if (Object.keys(data).length === 0) {
		console.log("❌ 远程没有数据\n");
		return;
	}

	// 保存到本地缓存文件
	ensureDir(path.dirname(CACHE_FILE));
	fs.writeFileSync(CACHE_FILE, JSON.stringify(data, null, 2));
	console.log(`\n2️⃣ 已缓存 ${Object.keys(data).length} 条数据到 ${CACHE_FILE}`);

	// 写入本地 KV (wrangler dev 会读取这些数据)
	console.log("\n3️⃣ 写入本地 KV...");
	writeLocalKV(data);
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
					if (value !== null) {
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
	} else {
		console.log("   ℹ 远程为空，无需备份\n");
	}

	// 2. 读取本地数据（优先从本地 KV，这是 wrangler dev 的真实数据）
	console.log("2️⃣ 读取本地 KV 数据...");
	let data = readLocalKV();

	// 如果本地 KV 为空，尝试从缓存文件读取
	if (Object.keys(data).length === 0 && fs.existsSync(CACHE_FILE)) {
		console.log("   本地 KV 为空，从缓存文件读取...");
		data = JSON.parse(fs.readFileSync(CACHE_FILE, "utf-8"));
	}

	if (Object.keys(data).length === 0) {
		console.log("❌ 本地没有数据可导出\n");
		return;
	}
	console.log(`   共 ${Object.keys(data).length} 条数据\n`);

	// 3. 写入远程（使用临时文件确保正确转义）
	console.log("3️⃣ 写入远程 KV...");
	const tmpDir = path.join(process.cwd(), ".wrangler", "kv-tmp");
	ensureDir(tmpDir);

	let successCount = 0;
	for (const [key, value] of Object.entries(data)) {
		try {
			// 使用临时文件写入值（避免命令行转义问题）
			const tmpFile = path.join(tmpDir, key.replace(/[^a-zA-Z0-9_-]/g, "_"));
			fs.writeFileSync(tmpFile, String(value));

			// 使用 --path 参数读取文件内容
			exec(`npx wrangler kv key put "${key}" --path="${tmpFile}" --namespace-id=${NAMESPACE_ID} --remote`, true);
			fs.unlinkSync(tmpFile);
			console.log(`   ✓ ${key}`);
			successCount++;
		} catch (e) {
			// 如果临时文件方式失败，尝试直接写入
			try {
				const safeValue = String(value).replace(/"/g, '\\"').replace(/\n/g, '\\n');
				exec(`npx wrangler kv key put "${key}" "${safeValue}" --namespace-id=${NAMESPACE_ID} --remote`, true);
				console.log(`   ✓ ${key} (直接写入)`);
				successCount++;
			} catch (e2) {
				console.log(`   ✗ ${key} (失败: ${e.message})`);
			}
		}
	}
	console.log(`\n✅ 导出完成，成功 ${successCount}/${Object.keys(data).length} 条\n`);

	// 4. 同步更新缓存文件
	ensureDir(path.dirname(CACHE_FILE));
	fs.writeFileSync(CACHE_FILE, JSON.stringify(data, null, 2));
	console.log(`📁 已更新缓存文件: ${CACHE_FILE}\n`);
}

// ==================== KV Schema 应用功能 ====================

// 读取 schema 文件
function readSchema() {
	if (!fs.existsSync(SCHEMA_FILE)) {
		console.error(`❌ Schema 文件不存在: ${SCHEMA_FILE}`);
		process.exit(1);
	}

	try {
		const schema = JSON.parse(fs.readFileSync(SCHEMA_FILE, "utf-8"));
		console.log(`✓ 已读取 schema 文件: ${SCHEMA_FILE}`);
		return schema;
	} catch (e) {
		console.error(`❌ Schema 文件解析失败: ${e.message}`);
		process.exit(1);
	}
}

// 扁平化 schema 数据（将嵌套结构转为 key-value 列表）
function flattenSchema(schema) {
	const entries = [];

	if (!schema.namespaces) {
		console.error("❌ Schema 缺少 namespaces 字段");
		return entries;
	}

	for (const [nsName, nsConfig] of Object.entries(schema.namespaces)) {
		if (nsConfig._comment) {
			console.log(`\n📁 命名空间: ${nsName} - ${nsConfig._comment}`);
		}

		if (!nsConfig.data) continue;

		for (const [key, config] of Object.entries(nsConfig.data)) {
			let value = config.value;

			// 根据 type 序列化值
			if (config.type === "json") {
				if (typeof value === "object") {
					value = JSON.stringify(value);
				}
			} else {
				value = String(value);
			}

			entries.push({
				key,
				value,
				description: config.description || "",
				namespace: nsName
			});

			console.log(`  • ${key}: ${config.description || "无描述"}`);
		}
	}

	return entries;
}

// 备份 KV 数据（本地或远程）
function backupKV(remote = false) {
	const target = remote ? "remote" : "local";
	console.log(`\n📦 备份 ${target} KV 数据...`);

	ensureDir(BACKUP_DIR);
	const backupFile = path.join(BACKUP_DIR, `backup-${target}-before-schema-${timestamp()}.json`);

	try {
		const remoteFlag = remote ? "--remote" : "";
		const keysOutput = exec(`npx wrangler kv key list --namespace-id=${NAMESPACE_ID} ${remoteFlag}`, true);

		if (!keysOutput) {
			console.log(`   ℹ ${target} KV 为空，无需备份`);
			return null;
		}

		const keys = JSON.parse(keysOutput);
		const backupData = {};

		for (const key of keys) {
			try {
				const value = exec(`npx wrangler kv key get "${key.name}" --namespace-id=${NAMESPACE_ID} ${remoteFlag} --text`, true);
				if (value !== null) {
					backupData[key.name] = value.trim();
				}
			} catch (e) {
				// 跳过读取失败的 key
			}
		}

		if (Object.keys(backupData).length === 0) {
			console.log(`   ℹ ${target} KV 为空，无需备份`);
			return null;
		}

		fs.writeFileSync(backupFile, JSON.stringify(backupData, null, 2));
		console.log(`   ✓ 备份完成: ${backupFile}`);
		console.log(`   ✓ 备份了 ${Object.keys(backupData).length} 条数据`);

		return backupFile;
	} catch (e) {
		console.log(`   ⚠ 备份失败: ${e.message}`);
		return null;
	}
}

// 写入 KV 数据
function applyKVData(entries, remote = false) {
	const target = remote ? "remote" : "local";
	console.log(`\n📝 应用数据到 ${target} KV...`);

	const remoteFlag = remote ? "--remote" : "";
	const tmpDir = path.join(process.cwd(), ".wrangler", "kv-tmp");
	ensureDir(tmpDir);

	let successCount = 0;
	let failCount = 0;

	for (const entry of entries) {
		try {
			// 使用临时文件写入值（避免命令行转义问题）
			const safeKey = entry.key.replace(/[^a-zA-Z0-9_-]/g, "_");
			const tmpFile = path.join(tmpDir, `${safeKey}.txt`);
			fs.writeFileSync(tmpFile, entry.value);

			// 使用 --path 参数读取文件内容
			exec(`npx wrangler kv key put "${entry.key}" --path="${tmpFile}" --namespace-id=${NAMESPACE_ID} ${remoteFlag}`, true);
			fs.unlinkSync(tmpFile);

			console.log(`   ✓ ${entry.key}`);
			successCount++;
		} catch (e) {
			// 回退到直接写入
			try {
				const safeValue = entry.value.replace(/"/g, '\\"').replace(/\n/g, '\\n');
				exec(`npx wrangler kv key put "${entry.key}" "${safeValue}" --namespace-id=${NAMESPACE_ID} ${remoteFlag}`, true);
				console.log(`   ✓ ${entry.key} (直接写入)`);
				successCount++;
			} catch (e2) {
				console.log(`   ✗ ${entry.key} (失败)`);
				failCount++;
			}
		}
	}

	console.log(`\n✅ 应用完成: ${successCount} 成功, ${failCount} 失败`);

	return { successCount, failCount };
}

// 从 schema 应用到本地 KV
async function applyToLocal() {
	console.log("\n🚀 应用 KV Schema 到本地...\n");
	console.log("=".repeat(60));

	// 1. 读取 schema
	const schema = readSchema();

	// 2. 扁平化数据
	console.log("\n📋 解析 Schema 数据:");
	const entries = flattenSchema(schema);
	console.log(`\n   共 ${entries.length} 条数据待应用`);

	// 3. 备份现有数据
	backupKV(false);

	// 4. 应用数据
	const result = applyKVData(entries, false);

	// 5. 更新缓存文件
	ensureDir(path.dirname(CACHE_FILE));
	const cacheData = {};
	for (const entry of entries) {
		cacheData[entry.key] = entry.value;
	}
	fs.writeFileSync(CACHE_FILE, JSON.stringify(cacheData, null, 2));
	console.log(`\n📁 已更新缓存文件: ${CACHE_FILE}`);

	console.log("\n" + "=".repeat(60));
	console.log("✅ 本地 KV Schema 应用完成!\n");
}

// 从 schema 应用到远程 KV
async function applyToRemote() {
	console.log("\n🚀 应用 KV Schema 到远程...\n");
	console.log("=".repeat(60));

	// 1. 读取 schema
	const schema = readSchema();

	// 2. 扁平化数据
	console.log("\n📋 解析 Schema 数据:");
	const entries = flattenSchema(schema);
	console.log(`\n   共 ${entries.length} 条数据待应用`);

	// 3. 强制备份远程数据（安全考虑）
	console.log("\n⚠️  即将覆盖远程 KV 数据，自动备份中...");
	backupKV(true);

	// 4. 应用数据
	const result = applyKVData(entries, true);

	console.log("\n" + "=".repeat(60));
	console.log("✅ 远程 KV Schema 应用完成!\n");
}

// 验证 schema 文件
async function validateSchema() {
	console.log("\n🔍 验证 KV Schema 文件...\n");

	const schema = readSchema();
	const entries = flattenSchema(schema);

	console.log(`\n✅ Schema 文件格式正确`);
	console.log(`   版本: ${schema._version || "未指定"}`);
	console.log(`   更新时间: ${schema._updated_at || "未指定"}`);
	console.log(`   数据条目: ${entries.length} 条`);

	// 检查重复 key
	const keys = entries.map(e => e.key);
	const duplicates = keys.filter((k, i) => keys.indexOf(k) !== i);

	if (duplicates.length > 0) {
		console.log(`\n⚠️  发现重复的 key: ${duplicates.join(", ")}`);
	} else {
		console.log(`\n✓ 无重复 key`);
	}

	console.log();
}


const command = process.argv[2];
const subCommand = process.argv[3];

if (command === "import") {
	importToLocal();
} else if (command === "export") {
	exportToRemote();
} else if (command === "migrate") {
	// migrate 命令
	if (subCommand === "local") {
		applyToLocal();
	} else {
		applyToRemote();
	}
} else if (command === "validate") {
	validateSchema();
} else {
	console.log("KV 同步脚本");
	console.log("");
	console.log("数据同步:");
	console.log("  node scripts/sync-kv.cjs import        # 从远程导入到本地");
	console.log("  node scripts/sync-kv.cjs export        # 从本地导出到远程（会先备份）");
	console.log("");
	console.log("Schema 迁移:");
	console.log("  node scripts/sync-kv.cjs migrate        # 应用 schema 到远程 KV（自动备份）");
	console.log("  node scripts/sync-kv.cjs migrate local   # 应用 schema 到本地 KV（自动备份）");
	console.log("");
	console.log("Schema 验证:");
	console.log("  node scripts/sync-kv.cjs validate      # 验证 schema 文件格式");
}
