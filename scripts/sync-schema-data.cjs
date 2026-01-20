/**
 * schema-data.json 双向同步脚本
 * 支持：远程/本地 ↔ schema-data.json 的双向同步
 *
 * 使用方式：
 *   node scripts/sync-schema-data.cjs remote-to-schema  # 远程 → schema-data.json
 *   node scripts/sync-schema-data.cjs local-to-schema   # 本地 → schema-data.json
 *   node scripts/sync-schema-data.cjs schema-to-remote  # schema-data.json → 远程
 *   node scripts/sync-schema-data.cjs schema-to-local   # schema-data.json → 本地
 */

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

// 引入共享模块
const { ensureDir, timestamp } = require("./shared/utils.cjs");
const { D1Helper } = require("./shared/wrangler.cjs");

const DB_NAME = "sq_station";
const SCHEMA_DATA_FILE = path.join(__dirname, "../sql/schema-data.json");
const BACKUP_DIR = path.join(__dirname, "../sql/.backup/schema-data");

// 确保备份目录存在
ensureDir(BACKUP_DIR);

// 创建 D1 helper 实例
const d1Helper = new D1Helper(DB_NAME);

/**
 * 备份 schema-data.json
 */
function backupSchemaData() {
	if (!fs.existsSync(SCHEMA_DATA_FILE)) {
		console.log("⏭️  schema-data.json 不存在，跳过备份");
		return;
	}
	const backupFile = path.join(BACKUP_DIR, `schema-data-${timestamp()}.json`);
	fs.copyFileSync(SCHEMA_DATA_FILE, backupFile);
	console.log(`✅ 已备份到: ${backupFile}`);
}

/**
 * 读取 schema-data.json
 */
function readSchemaData() {
	if (!fs.existsSync(SCHEMA_DATA_FILE)) {
		throw new Error("schema-data.json 文件不存在");
	}
	const content = fs.readFileSync(SCHEMA_DATA_FILE, "utf-8");
	return JSON.parse(content);
}

/**
 * 写入 schema-data.json
 */
function writeSchemaData(data) {
	// 更新时间戳
	// 本地时间格式: 2026-01-20 21:26:48
	const now = new Date();
	const year = now.getFullYear();
	const month = String(now.getMonth() + 1).padStart(2, "0");
	const day = String(now.getDate()).padStart(2, "0");
	const hours = String(now.getHours()).padStart(2, "0");
	const minutes = String(now.getMinutes()).padStart(2, "0");
	const seconds = String(now.getSeconds()).padStart(2, "0");
	data._updated_at = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
	const content = JSON.stringify(data, null, 2);
	fs.writeFileSync(SCHEMA_DATA_FILE, content, "utf-8");
	console.log(`✅ 已更新: ${SCHEMA_DATA_FILE}`);
}

/**
 * 执行 SQL 查询
 */
function executeQuery(sql, remote = true) {
	const remoteFlag = remote ? "--remote" : "--local";
	try {
		const result = execSync(
			`npx npx wrangler d1 execute ${DB_NAME} ${remoteFlag} --command="${sql}" --json`,
			{ encoding: "utf-8", stdio: ["ignore", "pipe", "pipe"] }
		);
		// 解析 JSON 结果
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
		console.error(`❌ 查询失败: ${sql.slice(0, 80)}...`);
		console.error(`   错误: ${e.message?.split("\n")[0] || e}`);
		return [];
	}
}

/**
 * 清空表数据
 */
function clearTable(tableName, remote = true) {
	const remoteFlag = remote ? "--remote" : "--local";
	try {
		execSync(
			`npx wrangler d1 execute ${DB_NAME} ${remoteFlag} --command="DELETE FROM ${tableName}"`,
			{ encoding: "utf-8", stdio: ["ignore", "pipe", "pipe"] }
		);
		console.log(`✅ 已清空表: ${tableName} (${remote ? "远程" : "本地"})`);
		return true;
	} catch (e) {
		console.error(`❌ 清空表失败: ${tableName}`);
		console.error(`   错误: ${e.message?.split("\n")[0] || e}`);
		return false;
	}
}

/**
 * 插入数据到表
 */
function insertData(tableName, data, remote = true) {
	const remoteFlag = remote ? "--remote" : "--local";
	const columns = Object.keys(data[0] || {});
	const columnNames = columns.join(", ");

	if (data.length === 0) {
		console.log(`⏭️  跳过空表: ${tableName}`);
		return 0;
	}

	// 创建临时 SQL 文件
	const tmpDir = path.join(process.cwd(), ".wrangler", "sql-tmp");
	if (!fs.existsSync(tmpDir)) {
		fs.mkdirSync(tmpDir, { recursive: true });
	}

	// 批量生成所有 INSERT 语句
	const sqlStatements = data.map(row => {
		const values = columns.map(col => {
			const val = row[col];
			if (val === null || val === undefined) return "NULL";
			if (typeof val === "boolean") return val ? "1" : "0";
			if (typeof val === "number") return val.toString();
			if (typeof val === "object") {
				const jsonStr = JSON.stringify(val);
				// JSON 字符串用单引号包裹，内部双引号转义为 ""
				return `'${jsonStr.replace(/'/g, "''")}'`;
			}
			if (typeof val === "string") {
				// 字符串用单引号包裹，内部单引号转义为 ''
				return `'${val.replace(/'/g, "''")}'`;
			}
			return "NULL";
		}).join(", ");

		return `INSERT INTO ${tableName} (${columnNames}) VALUES (${values});`;
	}).join("\n");

	const tmpFile = path.join(tmpDir, `temp_${tableName}_${Date.now()}.sql`);

	try {
		// 一次性写入所有 SQL 语句
		fs.writeFileSync(tmpFile, sqlStatements, "utf-8");

		// 一次性执行
		execSync(
			`npx wrangler d1 execute ${DB_NAME} ${remoteFlag} --file="${tmpFile}"`,
			{ encoding: "utf-8", stdio: ["ignore", "pipe", "pipe"] }
		);

		console.log(`✅ ${tableName}: ${data.length} 条成功`);
		return data.length;
	} catch (e) {
		console.error(`❌ 插入失败: ${tableName}`);
		console.error(`   错误: ${e.message?.split("\n")[0] || e}`);

		// 如果批量失败，尝试逐条插入
		console.log(`   尝试逐条插入...`);
		let successCount = 0;
		let failCount = 0;

		for (const row of data) {
			const values = columns.map(col => {
				const val = row[col];
				if (val === null || val === undefined) return "NULL";
				if (typeof val === "boolean") return val ? "1" : "0";
				if (typeof val === "number") return val.toString();
				if (typeof val === "object") {
					const jsonStr = JSON.stringify(val);
					return `'${jsonStr.replace(/'/g, "''")}'`;
				}
				if (typeof val === "string") {
					return `'${val.replace(/'/g, "''")}'`;
				}
				return "NULL";
			}).join(", ");

			const sql = `INSERT INTO ${tableName} (${columnNames}) VALUES (${values});`;
			const singleTmpFile = path.join(tmpDir, `single_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.sql`);

			try {
				fs.writeFileSync(singleTmpFile, sql, "utf-8");
				execSync(
					`npx wrangler d1 execute ${DB_NAME} ${remoteFlag} --file="${singleTmpFile}"`,
					{ encoding: "utf-8", stdio: ["ignore", "pipe", "pipe"] }
				);
				fs.unlinkSync(singleTmpFile);
				successCount++;
			} catch (singleErr) {
				failCount++;
				console.error(`   ❌ 第 ${successCount + failCount} 条失败: ${JSON.stringify(row).slice(0, 50)}`);
			}
		}

		console.log(`✅ ${tableName}: ${successCount} 条成功, ${failCount} 条失败`);
		return successCount;
	} finally {
		// 清理临时文件
		if (fs.existsSync(tmpFile)) {
			fs.unlinkSync(tmpFile);
		}
	}
}

/**
 * 从数据库同步到 schema-data.json
 */
function syncToSchemaData(remote = true) {
	console.log(`\n🔄 开始同步 ${remote ? "远程" : "本地"} → schema-data.json\n`);

	const schemaData = readSchemaData();
	const tables = schemaData.tables || {};

	for (const tableName of Object.keys(tables)) {
		console.log(`\n📥 同步表: ${tableName}`);
		const data = executeQuery(`SELECT * FROM ${tableName}`, remote);

		// 清理自动生成的时间戳字段
		const cleanData = data.map(row => {
			const cleanRow = { ...row };
			delete cleanRow.created_at;
			delete cleanRow.updated_at;
			return cleanRow;
		});

		tables[tableName].data = cleanData;
		console.log(`✅ 已同步 ${cleanData.length} 条数据`);
	}

	writeSchemaData(schemaData);
	console.log("\n✨ 同步完成！");
}

/**
 * 从 schema-data.json 同步到数据库
 */
function syncFromSchemaData(remote = true) {
	console.log(`\n🔄 开始同步 schema-data.json → ${remote ? "远程" : "本地"}\n`);

	const schemaData = readSchemaData();
	const tables = schemaData.tables || {};

	// 确认操作
	const target = remote ? "远程" : "本地";
	console.log(`⚠️  即将清空 ${target} 数据并导入 schema-data.json 的数据`);
	console.log("按 Ctrl+C 取消，或按回车继续...");
	process.stdin.once("data", () => {
		console.log("\n🚀 开始执行...\n");

		for (const [tableName, tableConfig] of Object.entries(tables)) {
			const data = tableConfig.data || [];
			console.log(`\n📤 同步表: ${tableName}`);

			// 清空表
			if (data.length > 0) {
				clearTable(tableName, remote);
			}

			// 插入数据
			if (data.length > 0) {
				insertData(tableName, data, remote);
			} else {
				console.log(`⏭️  跳过空表: ${tableName}`);
			}
		}

		console.log("\n✨ 同步完成！");
		process.exit(0);
	});

	// 5秒后自动继续
	setTimeout(() => {
		console.log("\n⏱️  5秒内未确认，自动继续...\n");
		process.stdin.emit("data", "");
	}, 5000);
}

/**
 * 主函数
 */
function main() {
	const command = process.argv[2];

	switch (command) {
		case "remote-to-schema":
			if (process.env.SKIP_BACKUP !== "1") {
				backupSchemaData();
			} else {
				console.log("⏭️  跳过备份（SKIP_BACKUP=1）");
			}
			syncToSchemaData(true);
			break;

		case "local-to-schema":
			if (process.env.SKIP_BACKUP !== "1") {
				backupSchemaData();
			} else {
				console.log("⏭️  跳过备份（SKIP_BACKUP=1）");
			}
			syncToSchemaData(false);
			break;

		case "schema-to-remote":
			syncFromSchemaData(true);
			break;

		case "schema-to-local":
			syncFromSchemaData(false);
			break;

		default:
			console.log(`
❓ 未知命令: ${command}

使用方式：
  node scripts/sync-schema-data.cjs remote-to-schema  # 远程 → schema-data.json
  node scripts/sync-schema-data.cjs local-to-schema   # 本地 → schema-data.json
  node scripts/sync-schema-data.cjs schema-to-remote  # schema-data.json → 远程
  node scripts/sync-schema-data.cjs schema-to-local   # schema-data.json → 本地
			`);
			process.exit(1);
	}
}

main();
