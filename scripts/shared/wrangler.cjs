/**
 * Wrangler 命令封装
 */

const { execSync } = require("child_process");

/**
 * 执行命令（静默模式）
 * @param {string} cmd - 命令
 * @returns {string|null} 命令输出，失败返回 null
 */
function exec(cmd) {
	try {
		return execSync(cmd, { encoding: "utf-8", stdio: ["ignore", "pipe", "pipe"] });
	} catch (e) {
		return null;
	}
}

/**
 * 执行命令（显示输出）
 * @param {string} cmd - 命令
 * @returns {boolean} 是否成功
 */
function execShow(cmd) {
	try {
		execSync(cmd, { encoding: "utf-8", stdio: "inherit" });
		return true;
	} catch (e) {
		return false;
	}
}

/**
 * 解析 D1 execute 的 JSON 结果
 * D1 返回格式特殊，需要提取 JSON 数组
 * @param {string} result - wrangler 命令输出
 * @returns {Array} 解析后的数据
 */
function parseD1Result(result) {
	if (!result) return [];

	try {
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
		return [];
	}
}

/**
 * D1 数据库操作封装
 */
class D1Helper {
	constructor(dbName) {
		this.dbName = dbName;
	}

	/**
	 * 执行 SQL 命令
	 * @param {string} sql - SQL 命令
	 * @param {boolean} remote - 是否远程
	 * @returns {Array|null} 查询结果，失败返回 null
	 */
	execute(sql, remote = true) {
		const remoteFlag = remote ? "--remote" : "--local";
		const result = exec(`wrangler d1 execute ${this.dbName} ${remoteFlag} --command="${sql}" --json`);
		return parseD1Result(result);
	}

	/**
	 * 从文件执行 SQL
	 * @param {string} sqlFile - SQL 文件路径
	 * @param {boolean} remote - 是否远程
	 * @param {boolean} showOutput - 是否显示输出
	 * @returns {boolean} 是否成功
	 */
	executeFile(sqlFile, remote = true, showOutput = false) {
		const remoteFlag = remote ? "--remote" : "--local";
		const stdio = showOutput ? "inherit" : ["ignore", "pipe", "pipe"];
		try {
			execSync(`wrangler d1 execute ${this.dbName} ${remoteFlag} --file="${sqlFile}"`, {
				encoding: "utf-8",
				stdio
			});
			return true;
		} catch (e) {
			return false;
		}
	}

	/**
	 * 查询表数据
	 * @param {string} table - 表名
	 * @param {boolean} remote - 是否远程
	 * @returns {Array} 查询结果
	 */
	query(table, remote = true) {
		return this.execute(`SELECT * FROM ${table}`, remote);
	}

	/**
	 * 获取表结构
	 * @param {string} table - 表名
	 * @param {boolean} remote - 是否远程
	 * @returns {Array} 表结构
	 */
	getTableSchema(table, remote = true) {
		return this.execute(`PRAGMA table_info(${table})`, remote);
	}
}

/**
 * KV 存储操作封装
 */
class KVHelper {
	constructor(namespaceId) {
		this.namespaceId = namespaceId;
	}

	/**
	 * 列出所有 keys
	 * @param {boolean} remote - 是否远程
	 * @returns {Array} keys 列表
	 */
	listKeys(remote = true) {
		const remoteFlag = remote ? "--remote" : "";
		const result = exec(`npx wrangler kv key list --namespace-id=${this.namespaceId} ${remoteFlag}`);
		if (!result) return [];

		try {
			return JSON.parse(result);
		} catch (e) {
			return [];
		}
	}

	/**
	 * 获取单个 key 的值
	 * @param {string} key - key 名称
	 * @param {boolean} remote - 是否远程
	 * @returns {string|null} key 的值，失败返回 null
	 */
	get(key, remote = true) {
		const remoteFlag = remote ? "--remote" : "";
		return exec(`npx wrangler kv key get "${key}" --namespace-id=${this.namespaceId} ${remoteFlag} --text`);
	}

	/**
	 * 设置 key 的值（使用文件）
	 * @param {string} key - key 名称
	 * @param {string} value - key 的值
	 * @param {boolean} remote - 是否远程
	 * @returns {boolean} 是否成功
	 */
	set(key, value, remote = true) {
		const remoteFlag = remote ? "--remote" : "";
		const tmpFile = path.join(process.cwd(), ".wrangler", "kv-tmp", key.replace(/[^a-zA-Z0-9_-]/g, "_"));

		try {
			require("fs").mkdirSync(path.dirname(tmpFile), { recursive: true });
			require("fs").writeFileSync(tmpFile, String(value));
			const result = exec(`npx wrangler kv key put "${key}" --path="${tmpFile}" --namespace-id=${this.namespaceId} ${remoteFlag}`);
			require("fs").unlinkSync(tmpFile);
			return result !== null;
		} catch (e) {
			return false;
		}
	}

	/**
	 * 删除 key
	 * @param {string} key - key 名称
	 * @param {boolean} remote - 是否远程
	 * @returns {boolean} 是否成功
	 */
	delete(key, remote = true) {
		const remoteFlag = remote ? "--remote" : "";
		const result = exec(`npx wrangler kv key delete "${key}" --namespace-id=${this.namespaceId} ${remoteFlag}`);
		return result !== null;
	}

	/**
	 * 批量获取所有 key-value 对
	 * @param {boolean} remote - 是否远程
	 * @returns {Object} key-value 对象
	 */
	getAll(remote = true) {
		const keys = this.listKeys(remote);
		const data = {};

		for (const key of keys) {
			const value = this.get(key.name, remote);
			if (value !== null) {
				data[key.name] = value.trim();
			}
		}

		return data;
	}
}

module.exports = {
	exec,
	execShow,
	parseD1Result,
	D1Helper,
	KVHelper
};
