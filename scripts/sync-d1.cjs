/**
 * D1 数据库双向同步脚本
 * 使用 wrangler d1 execute 命令实现本地 <-> 远程数据同步
 */

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const DB_NAME = "sq_station";
const TABLES = [
	"sys_user",
	"sys_role",
	"sys_menu",
	"sys_user_role",
	"sys_role_menu",
	"sys_organization",
	"sys_user_organization",
	"sys_org_permission",
	"sys_user_permission",
];
const BACKUP_DIR = path.join(__dirname, "../.wrangler/d1-backup");

// 确保备份目录存在
if (!fs.existsSync(BACKUP_DIR)) {
	fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

/**
 * 执行 SQL 命令
 * @param {string} command - SQL 命令
 * @param {boolean} remote - 是否远程
 * @param {boolean} silent - 是否静默失败（不抛异常）
 */
function executeSQL(command, remote = true, silent = false) {
	const remoteFlag = remote ? "--remote" : "--local";
	try {
		execSync(
			`wrangler d1 execute ${DB_NAME} ${remoteFlag} --command="${command}"`,
			{ encoding: "utf-8", stdio: ["ignore", "pipe", "pipe"] }
		);
		return true;
	} catch (e) {
		const shortCmd = command.slice(0, 80);
		console.error(`❌ SQL 失败 (${remote ? "remote" : "local"}): ${shortCmd}...`);
		console.error(`   错误: ${e.message?.split("\n")[0] || e}`);

		// 如果不是静默模式，抛出异常
		if (!silent) {
			throw new Error(`SQL 执行失败: ${command}`);
		}
		return false;
	}
}

/**
 * 查询表数据
 * @param {string} table - 表名
 * @param {boolean} remote - 是否远程
 */
function queryTable(table, remote = true) {
	const remoteFlag = remote ? "--remote" : "--local";
	try {
		const result = execSync(
			`wrangler d1 execute ${DB_NAME} ${remoteFlag} --command="SELECT * FROM ${table}" --json`,
			{ encoding: "utf-8" }
		);
		// 解析 JSON 结果 (查找完整 JSON 数组)
		const jsonStart = result.indexOf('[');
		const jsonEnd = result.lastIndexOf(']');
		if (jsonStart >= 0 && jsonEnd > jsonStart) {
			const jsonStr = result.substring(jsonStart, jsonEnd + 1);
			const data = JSON.parse(jsonStr);
			if (data && data[0] && data[0].results) {
				return data[0].results;
			}
		}
		return [];
	} catch (e) {
		// 表可能不存在或为空
		return [];
	}
}

/**
 * 获取表结构
 * @param {string} table - 表名
 * @param {boolean} remote - 是否远程
 */
function getTableSchema(table, remote = true) {
	const remoteFlag = remote ? "--remote" : "--local";
	try {
		const result = execSync(
			`wrangler d1 execute ${DB_NAME} ${remoteFlag} --command="PRAGMA table_info(${table})" --json`,
			{ encoding: "utf-8" }
		);
		const jsonStart = result.indexOf('[');
		const jsonEnd = result.lastIndexOf(']');
		if (jsonStart >= 0 && jsonEnd > jsonStart) {
			const jsonStr = result.substring(jsonStart, jsonEnd + 1);
			const data = JSON.parse(jsonStr);
			if (data && data[0] && data[0].results) {
				return data[0].results;
			}
		}
		return [];
	} catch (e) {
		// 表可能不存在，返回空数组
		return [];
	}
}

/**
 * 生成 INSERT 语句
 * @param {string} table - 表名
 * @param {Array} rows - 数据行
 * @param {Array} columns - 列信息
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
			if (typeof val === "number") return val;
			return "NULL";
		});

		const cols = columnNames.join(", ");
		const vals = values.join(", ");
		inserts.push(`INSERT OR REPLACE INTO ${table} (${cols}) VALUES (${vals});`);
	}

	return inserts;
}

/**
 * 备份数据
 * @param {boolean} remote - 是否备份远程数据
 */
function backupData(remote = true) {
	const source = remote ? "remote" : "local";
	console.log(`\n📦 备份 ${source} 数据...`);

	const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, -5);
	const backupFile = path.join(BACKUP_DIR, `${source}-${timestamp}.sql`);

	const statements = [`-- Backup from ${source} at ${new Date().toISOString()}`, ""];

	for (const table of TABLES) {
		console.log(`  导出表: ${table}`);
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
	}

	fs.writeFileSync(backupFile, statements.join("\n"));
	console.log(`✅ 备份完成: ${backupFile}`);

	return backupFile;
}

/**
 * 导入数据
 * @param {string} sqlFile - SQL 文件路径
 * @param {boolean} remote - 是否导入到远程
 */
function importData(sqlFile, remote = true) {
	const target = remote ? "remote" : "local";
	console.log(`\n📥 导入数据到 ${target}...`);

	const remoteFlag = remote ? "--remote" : "--local";
	try {
		execSync(
			`wrangler d1 execute ${DB_NAME} ${remoteFlag} --file="${sqlFile}"`,
			{ encoding: "utf-8", stdio: ["ignore", "pipe", "pipe"] }
		);
		// 统计 INSERT 语句数量
		const sql = fs.readFileSync(sqlFile, "utf-8");
		const count = (sql.match(/INSERT OR REPLACE/g) || []).length;
		console.log(`✅ 导入完成: ${count} 条语句`);
	} catch (e) {
		console.error(`❌ 导入失败: ${e.message}`);
		throw e;
	}
}

/**
 * 导出 (本地 -> 远程)
 */
function exportToRemote() {
	console.log("\n🚀 导出本地数据到远程...");

	// 1. 备份远程数据
	console.log("\n⚠️  将要覆盖远程数据，确保已备份！");
	backupData(true);

	// 2. 导出本地数据
	const localBackup = backupData(false);

	// 3. 清空远程表
	console.log("\n🗑️ 清空远程表...");
	for (const table of TABLES) {
		executeSQL(`DELETE FROM ${table}`, true);
	}

	// 4. 导入本地数据到远程
	importData(localBackup, true);

	console.log("\n✅ 本地 -> 远程 同步完成!");
}

/**
 * 导入 (远程 -> 本地)
 */
function exportToLocal() {
	console.log("\n🚀 导出远程数据到本地...");

	// 1. 创建表结构
	console.log("\n🔧 创建本地表结构...");
	try {
		const schemaFile = path.join(process.cwd(), "schema.sql");
		if (fs.existsSync(schemaFile)) {
			execSync(
				`wrangler d1 execute ${DB_NAME} --local --file="${schemaFile}"`,
				{ encoding: "utf-8", stdio: ["ignore", "pipe", "pipe"] }
			);
			console.log("   ✓ 表结构已创建");
		} else {
			console.log("   ⚠️  schema.sql 不存在，跳过");
		}
	} catch (e) {
		console.log("   ℹ️ 表结构已存在或创建失败，继续...");
	}

	// 2. 直接从远程导出数据到本地（不备份）
	console.log("\n📥 从远程导入数据到本地...");
	const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, -5);
	const tempFile = path.join(BACKUP_DIR, `temp-remote-${timestamp}.sql`);

	const statements = [];
	for (const table of TABLES) {
		console.log(`  正在获取 ${table} 数据...`);
		const columns = getTableSchema(table, true);
		const rows = queryTable(table, true);

		if (columns.length > 0 && rows.length > 0) {
			console.log(`    ✓ ${rows.length} 条记录`);
			const inserts = generateInserts(table, rows, columns);
			statements.push(`-- Table: ${table} (${rows.length} rows)`);
			statements.push(...inserts);
			statements.push("");
		} else {
			console.log(`    ℹ️  表为空或不存在`);
		}
	}

	fs.writeFileSync(tempFile, statements.join("\n"));
	importData(tempFile, false);

	// 删除临时文件
	fs.unlinkSync(tempFile);

	console.log("\n✅ 远程 -> 本地 同步完成!");
}

// 主函数
const command = process.argv[2];

switch (command) {
	case "export":
		exportToRemote();
		break;
	case "import":
		exportToLocal();
		break;
	case "migrate":
		// Schema 迁移（自动备份）
		console.log("\n🔄 D1 Schema 迁移\n");
		console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
		console.log("1️⃣ 备份目标数据");
		console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

		// 检测是远程还是本地迁移
		const isRemote = process.argv.includes("--remote");

		try {
			backupData(isRemote);
		} catch (e) {
			console.log("⚠️  备份失败（可能目标为空），继续迁移...\n");
		}

		console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
		console.log("2️⃣ 应用 schema.sql");
		console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

		const schemaFile = path.join(process.cwd(), "schema.sql");
		if (!fs.existsSync(schemaFile)) {
			console.error("❌ schema.sql 不存在");
			process.exit(1);
		}

		try {
			execSync(
				`wrangler d1 execute ${DB_NAME} ${isRemote ? "--remote" : "--local"} --file="${schemaFile}"`,
				{ encoding: "utf-8", stdio: "inherit" }
			);
			console.log("\n✅ 迁移完成!");
		} catch (e) {
			console.error("\n❌ 迁移失败");
			process.exit(1);
		}
		break;
	case "backup:remote":
		backupData(true);
		break;
	case "backup:local":
		backupData(false);
		break;
	default:
		console.log(`
D1 数据同步工具

用法:
  npm run d1:export    # 本地 -> 远程 (导出本地数据到远程)
  npm run d1:import    # 远程 -> 本地 (导出远程数据到本地)
  npm run d1:migrate   # Schema -> 远程 (自动备份)
  npm run d1:migrate:local  # Schema -> 本地 (自动备份)
  npm run d1:backup:remote  # 备份远程数据
  npm run d1:backup:local   # 备份本地数据

注意: 首次使用前请先执行表结构迁移:
  npm run d1:migrate       # 远程
  npm run d1:migrate:local # 本地
		`);
}
