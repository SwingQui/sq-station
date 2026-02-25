/**
 * D1 数据库同步脚本（统一版）
 *
 * 功能：
 *   - 本地 ↔ 远程 双向同步
 *   - 远程/本地 ↔ Schema 双向同步
 *   - 备份数据库
 *
 * 统一流程：备份 → 重建表（执行 schema.sql）→ 注入数据
 *
 * 使用方式：
 *   node scripts/sync-d1.cjs export              # 本地 → 远程
 *   node scripts/sync-d1.cjs import              # 远程 → 本地
 *   node scripts/sync-d1.cjs remote-to-schema    # 远程 → Schema
 *   node scripts/sync-d1.cjs local-to-schema     # 本地 → Schema
 *   node scripts/sync-d1.cjs schema-to-remote    # Schema → 远程
 *   node scripts/sync-d1.cjs schema-to-local     # Schema → 本地
 *   node scripts/sync-d1.cjs backup:remote       # 备份远程
 *   node scripts/sync-d1.cjs backup:local        # 备份本地
 */

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const { ensureDir, timestamp } = require("./shared/utils.cjs");
const { D1Helper } = require("./shared/wrangler.cjs");

// 配置
const DB_NAME = "sq_station";
const SCHEMA_FILE = path.join(process.cwd(), "sql", "schema.sql");
const SCHEMA_DATA_FILE = path.join(process.cwd(), "sql", "schema-data.json");
const BACKUP_DIR = path.join(process.cwd(), "sql", ".backup", "d1");
const SCHEMA_BACKUP_DIR = path.join(process.cwd(), "sql", ".backup", "schema-data");

// 确保目录存在
ensureDir(BACKUP_DIR);
ensureDir(SCHEMA_BACKUP_DIR);

// D1 Helper 实例
const d1Helper = new D1Helper(DB_NAME);

// 跳过备份标志
const skipBackup = process.env.SKIP_BACKUP === "1";

// ==================== 核心函数 ====================

/**
 * 获取所有表名（动态获取）
 */
function getAllTables(remote = true) {
	return d1Helper.getAllTables(remote);
}

/**
 * 查询表数据
 */
function queryTable(table, remote = true) {
	return d1Helper.query(table, remote);
}

/**
 * 获取表结构
 */
function getTableSchema(table, remote = true) {
	return d1Helper.getTableSchema(table, remote);
}

/**
 * 生成 INSERT 语句
 */
function generateInserts(table, rows, columns) {
	if (!rows || rows.length === 0) return [];

	const columnNames = columns.map(c => c.name);
	const inserts = [];

	for (const row of rows) {
		const values = columnNames.map(name => {
			const val = row[name];
			if (val === null || val === undefined) return "NULL";
			if (typeof val === "string") return `'${val.replace(/'/g, "''")}'`;
			if (typeof val === "number") return val.toString();
			if (typeof val === "boolean") return val ? "1" : "0";
			return "NULL";
		});

		inserts.push(`INSERT OR REPLACE INTO ${table} (${columnNames.join(", ")}) VALUES (${values.join(", ")});`);
	}

	return inserts;
}

/**
 * 备份数据库到文件
 */
function backupDatabase(remote = true) {
	const source = remote ? "remote" : "local";
	console.log(`\n📦 备份 ${source} 数据...`);

	const backupFile = path.join(BACKUP_DIR, `${source}-${timestamp()}.sql`);
	const tables = getAllTables(remote);
	const statements = [`-- Backup from ${source} at ${new Date().toISOString()}`, ""];

	for (const table of tables) {
		console.log(`  导出表: ${table}`);
		try {
			const columns = getTableSchema(table, remote);
			const rows = queryTable(table, remote);

			if (columns.length > 0 && rows.length > 0) {
				const inserts = generateInserts(table, rows, columns);
				statements.push(`-- Table: ${table} (${rows.length} rows)`);
				statements.push(...inserts);
				statements.push("");
			} else if (columns.length > 0) {
				statements.push(`-- Table: ${table} (empty)`);
				statements.push("");
			}
		} catch (e) {
			console.log(`    ⚠️  跳过: ${e.message?.split("\n")[0] || e}`);
		}
	}

	fs.writeFileSync(backupFile, statements.join("\n"));
	console.log(`✅ 备份完成: ${backupFile}`);
	return backupFile;
}

/**
 * 执行 schema.sql（重建表结构）
 */
function rebuildSchema(remote = true) {
	const target = remote ? "远程" : "本地";
	console.log(`\n🔧 重建 ${target} 表结构...`);

	if (!fs.existsSync(SCHEMA_FILE)) {
		throw new Error("schema.sql 文件不存在");
	}

	const remoteFlag = remote ? "--remote" : "--local";

	// 1. 先获取并删除所有现有表
	console.log("  清理现有表...");
	const existingTables = getAllTables(remote);
	if (existingTables.length > 0) {
		console.log(`  发现 ${existingTables.length} 个表，正在删除...`);
		for (const table of existingTables) {
			try {
				d1Helper.execute(`DROP TABLE IF EXISTS ${table}`, remote);
				console.log(`    ✓ 删除表: ${table}`);
			} catch (e) {
				console.log(`    ⚠️  跳过表 ${table}: ${e.message?.split("\n")[0] || e}`);
			}
		}
	}

	// 2. 执行 schema.sql 创建新表
	console.log("  创建新表...");
	try {
		execSync(
			`npx wrangler d1 execute ${DB_NAME} ${remoteFlag} --file="${SCHEMA_FILE}"`,
			{ encoding: "utf-8", stdio: "inherit" }
		);
		console.log(`✅ 表结构重建完成`);
		return true;
	} catch (e) {
		console.error(`❌ 表结构重建失败: ${e.message}`);
		throw e;
	}
}

/**
 * 导出所有表数据
 */
function exportAllTablesData(remote = true) {
	const source = remote ? "远程" : "本地";
	console.log(`\n📤 导出 ${source} 数据...`);

	const tables = getAllTables(remote);
	const result = {};

	for (const table of tables) {
		try {
			const rows = queryTable(table, remote);
			result[table] = rows;
			console.log(`  ✓ ${table}: ${rows.length} 行`);
		} catch (e) {
			console.log(`  ⚠️  跳过 ${table}: ${e.message?.split("\n")[0] || e}`);
			result[table] = [];
		}
	}

	return result;
}

/**
 * 导入数据到数据库
 */
function importTablesData(tablesData, remote = true) {
	const target = remote ? "远程" : "本地";
	console.log(`\n📥 导入数据到 ${target}...`);

	const remoteFlag = remote ? "--remote" : "--local";
	const tables = Object.keys(tablesData);
	const statements = [];

	for (const table of tables) {
		const rows = tablesData[table];
		if (!rows || rows.length === 0) {
			console.log(`  ⏭️  跳过空表: ${table}`);
			continue;
		}

		console.log(`  导入: ${table} (${rows.length} 行)`);

		const columns = Object.keys(rows[0] || {});
		if (columns.length === 0) continue;

		for (const row of rows) {
			const values = columns.map(col => {
				const val = row[col];
				if (val === null || val === undefined) return "NULL";
				if (typeof val === "boolean") return val ? "1" : "0";
				if (typeof val === "number") return val.toString();
				if (typeof val === "string") return `'${val.replace(/'/g, "''")}'`;
				return "NULL";
			});

			statements.push(`INSERT OR REPLACE INTO ${table} (${columns.join(", ")}) VALUES (${values.join(", ")});`);
		}
	}

	if (statements.length === 0) {
		console.log("  ⚠️  没有数据需要导入");
		return true;
	}

	// 写入临时文件并执行
	const tmpDir = path.join(process.cwd(), ".wrangler", "sql-tmp");
	ensureDir(tmpDir);
	const tmpFile = path.join(tmpDir, `import-${timestamp()}.sql`);

	try {
		fs.writeFileSync(tmpFile, statements.join("\n"), "utf-8");
		execSync(
			`npx wrangler d1 execute ${DB_NAME} ${remoteFlag} --file="${tmpFile}"`,
			{ encoding: "utf-8", stdio: ["ignore", "pipe", "pipe"] }
		);
		console.log(`✅ 导入完成: ${statements.length} 条语句`);
		return true;
	} catch (e) {
		console.error(`❌ 导入失败: ${e.message}`);
		throw e;
	} finally {
		if (fs.existsSync(tmpFile)) {
			fs.unlinkSync(tmpFile);
		}
	}
}

// ==================== Schema 数据操作 ====================

/**
 * 备份 schema-data.json
 */
function backupSchemaData() {
	if (!fs.existsSync(SCHEMA_DATA_FILE)) {
		console.log("⏭️  schema-data.json 不存在，跳过备份");
		return;
	}
	const backupFile = path.join(SCHEMA_BACKUP_DIR, `schema-data-${timestamp()}.json`);
	fs.copyFileSync(SCHEMA_DATA_FILE, backupFile);
	console.log(`✅ 已备份 schema-data.json 到: ${backupFile}`);
}

/**
 * 读取 schema-data.json
 */
function readSchemaData() {
	if (!fs.existsSync(SCHEMA_DATA_FILE)) {
		throw new Error("schema-data.json 文件不存在");
	}
	return JSON.parse(fs.readFileSync(SCHEMA_DATA_FILE, "utf-8"));
}

/**
 * 写入 schema-data.json
 */
function writeSchemaData(data) {
	// 更新时间戳
	const now = new Date();
	const year = now.getFullYear();
	const month = String(now.getMonth() + 1).padStart(2, "0");
	const day = String(now.getDate()).padStart(2, "0");
	const hours = String(now.getHours()).padStart(2, "0");
	const minutes = String(now.getMinutes()).padStart(2, "0");
	const seconds = String(now.getSeconds()).padStart(2, "0");
	data._updated_at = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;

	fs.writeFileSync(SCHEMA_DATA_FILE, JSON.stringify(data, null, 2), "utf-8");
	console.log(`✅ 已更新: ${SCHEMA_DATA_FILE}`);
}

// ==================== 同步操作 ====================

/**
 * 本地 → 远程
 */
function exportToRemote() {
	console.log("\n🚀 同步：本地 → 远程");
	console.log("=".repeat(50));

	// 1. 备份远程
	if (!skipBackup) {
		console.log("\n📋 步骤 1/3: 备份远程数据");
		try {
			backupDatabase(true);
		} catch (e) {
			console.log(`⚠️  备份失败: ${e.message}`);
		}
	} else {
		console.log("\n⏭️  步骤 1/3: 跳过备份（SKIP_BACKUP=1）");
	}

	// 2. 重建远程表
	console.log("\n📋 步骤 2/3: 重建远程表结构");
	rebuildSchema(true);

	// 3. 导入本地数据到远程
	console.log("\n📋 步骤 3/3: 导入本地数据到远程");
	const localData = exportAllTablesData(false);
	importTablesData(localData, true);

	console.log("\n" + "=".repeat(50));
	console.log("✅ 同步完成：本地 → 远程");
}

/**
 * 远程 → 本地
 */
function importToLocal() {
	console.log("\n🚀 同步：远程 → 本地");
	console.log("=".repeat(50));

	// 1. 备份本地
	if (!skipBackup) {
		console.log("\n📋 步骤 1/3: 备份本地数据");
		try {
			backupDatabase(false);
		} catch (e) {
			console.log(`⚠️  备份失败: ${e.message}`);
		}
	} else {
		console.log("\n⏭️  步骤 1/3: 跳过备份（SKIP_BACKUP=1）");
	}

	// 2. 重建本地表
	console.log("\n📋 步骤 2/3: 重建本地表结构");
	rebuildSchema(false);

	// 3. 导入远程数据到本地
	console.log("\n📋 步骤 3/3: 导入远程数据到本地");
	const remoteData = exportAllTablesData(true);
	importTablesData(remoteData, false);

	console.log("\n" + "=".repeat(50));
	console.log("✅ 同步完成：远程 → 本地");
}

/**
 * 远程/本地 → Schema
 */
function syncToSchema(remote = true) {
	const source = remote ? "远程" : "本地";
	console.log(`\n🚀 同步：${source} → Schema`);
	console.log("=".repeat(50));

	// 1. 备份 Schema
	if (!skipBackup) {
		console.log("\n📋 步骤 1/2: 备份 schema-data.json");
		backupSchemaData();
	} else {
		console.log("\n⏭️  步骤 1/2: 跳过备份（SKIP_BACKUP=1）");
	}

	// 2. 读取数据库并写入 Schema
	console.log(`\n📋 步骤 2/2: 读取 ${source} 数据并写入 Schema`);

	const tables = getAllTables(remote);
	const schemaData = {
		_comment: "D1 数据库初始数据定义文件",
		_version: "1.0.0",
		tables: {}
	};

	for (const table of tables) {
		console.log(`  同步表: ${table}`);
		try {
			const rows = queryTable(table, remote);
			// 清理自动生成的时间戳字段
			const cleanRows = rows.map(row => {
				const cleanRow = { ...row };
				delete cleanRow.created_at;
				delete cleanRow.updated_at;
				return cleanRow;
			});
			schemaData.tables[table] = { data: cleanRows };
			console.log(`    ✓ ${cleanRows.length} 条数据`);
		} catch (e) {
			console.log(`    ⚠️  跳过: ${e.message?.split("\n")[0] || e}`);
			schemaData.tables[table] = { data: [] };
		}
	}

	writeSchemaData(schemaData);

	console.log("\n" + "=".repeat(50));
	console.log(`✅ 同步完成：${source} → Schema`);
}

/**
 * Schema → 远程/本地
 */
function syncFromSchema(remote = true) {
	const target = remote ? "远程" : "本地";
	console.log(`\n🚀 同步：Schema → ${target}`);
	console.log("=".repeat(50));

	// 1. 备份目标
	if (!skipBackup) {
		console.log(`\n📋 步骤 1/3: 备份 ${target} 数据`);
		try {
			backupDatabase(remote);
		} catch (e) {
			console.log(`⚠️  备份失败: ${e.message}`);
		}
	} else {
		console.log("\n⏭️  步骤 1/3: 跳过备份（SKIP_BACKUP=1）");
	}

	// 2. 重建表
	console.log(`\n📋 步骤 2/3: 重建 ${target} 表结构`);
	rebuildSchema(remote);

	// 3. 导入 Schema 数据
	console.log(`\n📋 步骤 3/3: 导入 Schema 数据到 ${target}`);
	const schemaData = readSchemaData();
	const tablesData = {};

	for (const [tableName, tableConfig] of Object.entries(schemaData.tables || {})) {
		tablesData[tableName] = tableConfig.data || [];
	}

	importTablesData(tablesData, remote);

	console.log("\n" + "=".repeat(50));
	console.log(`✅ 同步完成：Schema → ${target}`);
}

// ==================== 命令入口 ====================

const command = process.argv[2];

switch (command) {
	case "export":
		exportToRemote();
		break;

	case "import":
		importToLocal();
		break;

	case "remote-to-schema":
		syncToSchema(true);
		break;

	case "local-to-schema":
		syncToSchema(false);
		break;

	case "schema-to-remote":
		syncFromSchema(true);
		break;

	case "schema-to-local":
		syncFromSchema(false);
		break;

	case "backup:remote":
		backupDatabase(true);
		break;

	case "backup:local":
		backupDatabase(false);
		break;

	default:
		console.log(`
D1 数据库同步工具（统一版）

数据同步：
  export              本地 → 远程（备份远程 → 重建表 → 注入数据）
  import              远程 → 本地（备份本地 → 重建表 → 注入数据）

Schema 同步：
  remote-to-schema    远程 → schema-data.json
  local-to-schema     本地 → schema-data.json
  schema-to-remote     schema-data.json → 远程
  schema-to-local      schema-data.json → 本地

备份：
  backup:remote       备份远程数据
  backup:local        备份本地数据

环境变量：
  SKIP_BACKUP=1       跳过备份步骤
		`);
}
