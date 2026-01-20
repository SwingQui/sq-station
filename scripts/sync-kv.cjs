// KV 同步脚本
// import: 从远程导入到本地缓存
// export: 从本地导出到远程，导出前先备份
// apply: 从 kv-schema.json 应用到本地/远程 KV
// validate: 验证 kv-schema.json 文件格式
// to-schema: 从远程/本地 KV 同步到 kv-schema.json

const fs = require("fs");
const path = require("path");

// 引入共享模块
const { ensureDir, timestamp } = require("./shared/utils.cjs");
const { KVHelper } = require("./shared/wrangler.cjs");

const NAMESPACE_ID = "0db26ad794b242aea90aa08281a7dfa2";
const BACKUP_DIR = path.join(process.cwd(), "sql", ".backup", "kv");
const CACHE_FILE = path.join(process.cwd(), ".wrangler", "kv-cache.json");
const SCHEMA_FILE = path.join(process.cwd(), "sql", "kv-schema.json");

// 创建 KV helper 实例
const kvHelper = new KVHelper(NAMESPACE_ID);

// 从本地 KV 读取所有数据（wrangler dev 的实际存储）
function readLocalKV() {
	console.log("   从本地 KV 读取数据...");
	const keys = kvHelper.listKeys(false);
	console.log(`   找到 ${keys.length} 个 keys`);

	const data = {};
	for (const key of keys) {
		const value = kvHelper.get(key.name, false);
		if (value !== null) {
			data[key.name] = value.trim();
		}
	}
	return data;
}

// 写入本地 KV
function writeLocalKV(data) {
	for (const [key, value] of Object.entries(data)) {
		const success = kvHelper.set(key, value, false);
		if (!success) {
			console.log(`   ✗ ${key} (写入失败)`);
		}
	}
}

// 从远程导出到本地缓存
async function importToLocal() {
	console.log("\n📥 从远程 KV 导入数据到本地...\n");

	// 0️⃣ 先清理本地旧数据
	console.log("0️⃣ 清理本地 KV 旧数据...");
	const localKeys = kvHelper.listKeys(false);
	if (localKeys.length > 0) {
		for (const key of localKeys) {
			kvHelper.delete(key.name, false);
		}
		console.log(`   ✓ 清理了 ${localKeys.length} 个旧 keys\n`);
	} else {
		console.log("   ✓ 本地无旧数据\n");
	}

	// 获取远程所有数据
	console.log("1️⃣ 获取远程 keys 列表...");
	const keys = kvHelper.listKeys(true);
	if (keys.length === 0) {
		console.log("❌ 远程 KV 为空或获取失败");
		return;
	}
	console.log(`   找到 ${keys.length} 个 keys\n`);

	const data = {};
	for (const key of keys) {
		const value = kvHelper.get(key.name, true);
		if (value !== null) {
			data[key.name] = value.trim();
			console.log(`   ✓ ${key.name}`);
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

	// 检查是否跳过备份
	const skipBackup = process.env.SKIP_BACKUP === "1";

	// 1. 先备份远程数据
	if (!skipBackup) {
		console.log("1️⃣ 备份远程数据...");
		ensureDir(BACKUP_DIR);
		const backupFile = path.join(BACKUP_DIR, `backup-${timestamp()}.json`);

		const keys = kvHelper.listKeys(true);
		if (keys.length > 0) {
			const backupData = kvHelper.getAll(true);
			fs.writeFileSync(backupFile, JSON.stringify(backupData, null, 2));
			console.log(`   ✓ 备份已保存: ${backupFile}`);
			console.log(`   ✓ 备份了 ${Object.keys(backupData).length} 条数据\n`);
		} else {
			console.log("   ℹ 远程为空，无需备份\n");
		}
	} else {
		console.log("1️⃣ 跳过备份（SKIP_BACKUP=1）\n");
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

	// 3. 写入远程（使用 kvHelper）
	console.log("3️⃣ 写入远程 KV...");
	let successCount = 0;
	for (const [key, value] of Object.entries(data)) {
		const success = kvHelper.set(key, value, true);
		if (success) {
			console.log(`   ✓ ${key}`);
			successCount++;
		} else {
			console.log(`   ✗ ${key} (失败)`);
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

	const backupData = kvHelper.getAll(remote);

	if (Object.keys(backupData).length === 0) {
		console.log(`   ℹ ${target} KV 为空，无需备份`);
		return null;
	}

	fs.writeFileSync(backupFile, JSON.stringify(backupData, null, 2));
	console.log(`   ✓ 备份完成: ${backupFile}`);
	console.log(`   ✓ 备份了 ${Object.keys(backupData).length} 条数据`);

	return backupFile;
}

// 写入 KV 数据
function applyKVData(entries, remote = false) {
	const target = remote ? "remote" : "local";
	console.log(`\n📝 应用数据到 ${target} KV...`);

	let successCount = 0;
	let failCount = 0;

	for (const entry of entries) {
		const success = kvHelper.set(entry.key, entry.value, remote);
		if (success) {
			console.log(`   ✓ ${entry.key}`);
			successCount++;
		} else {
			console.log(`   ✗ ${entry.key} (失败)`);
			failCount++;
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
	if (process.env.SKIP_BACKUP !== "1") {
		backupKV(false);
	} else {
		console.log("\n3️⃣ 跳过备份（SKIP_BACKUP=1）");
	}

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
	if (process.env.SKIP_BACKUP !== "1") {
		console.log("\n⚠️  即将覆盖远程 KV 数据，自动备份中...");
		backupKV(true);
	} else {
		console.log("\n3️⃣ 跳过备份（SKIP_BACKUP=1）");
	}

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

// ==================== KV 到 Schema 反向同步功能 ====================

// 检测数据类型并转换
function detectTypeAndConvert(valueStr) {
	// 1. 尝试解析为 JSON
	try {
		const parsed = JSON.parse(valueStr);
		if (typeof parsed === "object" && parsed !== null) {
			return { value: parsed, type: "json" };
		}
	} catch (e) {
		// 不是 JSON，继续检查
	}

	// 2. 检测是否包含非 ASCII 字符（可能是二进制/base64）
	if (/[^\x00-\x7F]/.test(valueStr)) {
		return { value: valueStr, type: "base64" };
	}

	// 3. 默认为文本
	return { value: valueStr, type: "text" };
}

// 读取 KV 数据（远程或本地）
function readKVData(remote) {
	console.log(`   从${remote ? "远程" : "本地"} KV 读取数据...`);
	const keys = kvHelper.listKeys(remote);
	console.log(`   找到 ${keys.length} 个 keys`);

	const data = {};
	for (const key of keys) {
		const value = kvHelper.get(key.name, remote);
		if (value !== null) {
			data[key.name] = value.trim();
			console.log(`   ✓ ${key.name}`);
		} else {
			console.log(`   ✗ ${key.name} (读取失败)`);
		}
	}

	return data;
}

// 从 KV 同步到 Schema（远程或本地）
async function toSchema(remote = false) {
	const target = remote ? "远程" : "本地";
	console.log(`\n🔄 从${target} KV 同步到 kv-schema.json...\n`);
	console.log("=".repeat(60));

	// 1. 读取 KV 数据
	console.log(`\n1️⃣ 读取${target} KV 数据...`);
	const kvData = readKVData(remote);

	if (Object.keys(kvData).length === 0) {
		console.log(`\n❌ ${target} KV 没有数据\n`);
		return;
	}

	// 2. 转换为 Schema 格式
	console.log(`\n2️⃣ 转换数据格式...`);
	const schemaData = {
		_comment: "KV 存储数据定义文件 - 类似于 D1 的 schema.sql",
		_version: "1.0.0",
		_updated_at: (() => {
			const now = new Date();
			const year = now.getFullYear();
			const month = String(now.getMonth() + 1).padStart(2, "0");
			const day = String(now.getDate()).padStart(2, "0");
			const hours = String(now.getHours()).padStart(2, "0");
			const minutes = String(now.getMinutes()).padStart(2, "0");
			const seconds = String(now.getSeconds()).padStart(2, "0");
			return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
		})(),
		namespaces: {
			frontend: {
				_comment: "前端页面配置数据",
				data: {}
			}
		}
	};

	let jsonCount = 0;
	let textCount = 0;
	let base64Count = 0;

	for (const [key, valueStr] of Object.entries(kvData)) {
		const { value, type } = detectTypeAndConvert(valueStr);

		schemaData.namespaces.frontend.data[key] = {
			value: value,
			type: type,
			description: `从${target}同步于 ${new Date().toLocaleString("zh-CN")}`
		};

		if (type === "json") jsonCount++;
		else if (type === "base64") base64Count++;
		else textCount++;

		console.log(`   • ${key}: ${type}`);
	}

	console.log(`\n   数据统计: json=${jsonCount}, text=${textCount}, base64=${base64Count}`);

	// 3. 备份现有 schema 文件
	if (process.env.SKIP_BACKUP !== "1") {
		console.log(`\n3️⃣ 备份现有 schema 文件...`);
		if (fs.existsSync(SCHEMA_FILE)) {
			const backupDir = path.join(process.cwd(), "sql", ".backup", "kv-schema");
			ensureDir(backupDir);
			const backupFile = path.join(backupDir, `kv-schema-${timestamp()}.json`);
			fs.copyFileSync(SCHEMA_FILE, backupFile);
			console.log(`   ✓ 已备份到: ${backupFile}`);
		} else {
			console.log("   ℹ schema 文件不存在，跳过备份");
		}
	} else {
		console.log(`\n3️⃣ 跳过备份（SKIP_BACKUP=1）`);
	}

	// 4. 写入新的 schema 文件
	console.log(`\n4️⃣ 更新 kv-schema.json...`);
	fs.writeFileSync(SCHEMA_FILE, JSON.stringify(schemaData, null, 2));
	console.log(`   ✓ 已更新: ${SCHEMA_FILE}`);

	console.log("\n" + "=".repeat(60));
	console.log(`✅ 从${target} KV 同步到 Schema 完成！`);
	console.log(`   同步了 ${Object.keys(kvData).length} 条数据\n`);
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
} else if (command === "to-schema") {
	// to-schema 命令
	if (subCommand === "remote") {
		toSchema(true);
	} else if (subCommand === "local") {
		toSchema(false);
	} else {
		console.log("用法: node scripts/sync-kv.cjs to-schema [remote|local]");
	}
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
		console.log("Schema 反向同步:");
	console.log("  node scripts/sync-kv.cjs to-schema remote   # 从远程 KV 同步到 kv-schema.json");
		console.log("  node scripts/sync-kv.cjs to-schema local    # 从本地 KV 同步到 kv-schema.json");
	console.log("");
		console.log("Schema 验证:");
	console.log("  node scripts/sync-kv.cjs validate      # 验证 schema 文件格式");
}
