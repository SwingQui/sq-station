/**
 * 同步工具 - 交互式命令行界面
 *
 * 运行方式：
 *   node scripts/sync-tool.cjs
 *   npm run sync-tool
 *   双击：同步工具.bat
 */

const { execSync } = require("child_process");
const inquirer = require("inquirer");

// 菜单配置
const menuStructure = {
	main: [
		{ name: "D1 数据同步", value: "d1" },
		{ name: "KV 数据同步", value: "kv" },
		{ name: "退出", value: "exit" }
	],
	d1: [
		{
			name: "从远程同步到本地",
			value: "d1_import",
			cmd: "node scripts/load-env.mjs node scripts/sync-d1.cjs import",
			desc: "备份本地 → 重建表 → 导入远程数据"
		},
		{
			name: "从本地同步到远程",
			value: "d1_export",
			cmd: "node scripts/load-env.mjs node scripts/sync-d1.cjs export",
			desc: "备份远程 → 重建表 → 导入本地数据"
		},
		{
			name: "从远程同步到 Schema",
			value: "remote_to_schema",
			cmd: "node scripts/load-env.mjs node scripts/sync-d1.cjs remote-to-schema",
			desc: "备份 Schema → 读取远程数据 → 写入 schema-data.json"
		},
		{
			name: "从本地同步到 Schema",
			value: "local_to_schema",
			cmd: "node scripts/sync-d1.cjs local-to-schema",
			desc: "备份 Schema → 读取本地数据 → 写入 schema-data.json"
		},
		{
			name: "从 Schema 同步到远程",
			value: "schema_to_remote",
			cmd: "node scripts/load-env.mjs node scripts/sync-d1.cjs schema-to-remote",
			desc: "备份远程 → 重建表 → 导入 Schema 数据"
		},
		{
			name: "从 Schema 同步到本地",
			value: "schema_to_local",
			cmd: "node scripts/sync-d1.cjs schema-to-local",
			desc: "备份本地 → 重建表 → 导入 Schema 数据"
		},
		{ name: "返回", value: "back" }
	],
	kv: [
		{
			name: "从远程同步到本地",
			value: "kv_import",
			cmd: "node scripts/load-env.mjs node scripts/sync-kv.cjs import",
			desc: "导出远程 KV 数据到本地"
		},
		{
			name: "从本地同步到远程",
			value: "kv_export",
			cmd: "node scripts/load-env.mjs node scripts/sync-kv.cjs export",
			desc: "导出本地 KV 数据到远程（会先备份远程）"
		},
		{
			name: "从 Schema 同步到远程",
			value: "kv_migrate",
			cmd: "node scripts/load-env.mjs node scripts/sync-kv.cjs migrate",
			desc: "应用 kv-schema.json 到远程"
		},
		{
			name: "从 Schema 同步到本地",
			value: "kv_migrate_local",
			cmd: "node scripts/sync-kv.cjs migrate local",
			desc: "应用 kv-schema.json 到本地"
		},
		{
			name: "从远程同步到 Schema",
			value: "kv_remote_to_schema",
			cmd: "node scripts/load-env.mjs node scripts/sync-kv.cjs to-schema remote",
			desc: "从远程 KV 同步到 kv-schema.json"
		},
		{
			name: "从本地同步到 Schema",
			value: "kv_local_to_schema",
			cmd: "node scripts/sync-kv.cjs to-schema local",
			desc: "从本地 KV 同步到 kv-schema.json"
		},
		{ name: "返回", value: "back" }
	]
};

// 显示标题
function showTitle() {
	console.log("\n" + "=".repeat(50));
	console.log("           SQ Station 数据同步工具");
	console.log("=".repeat(50) + "\n");
}

// 主循环
async function mainLoop() {
	let currentMenu = "main";

	while (true) {
		showTitle();

		const answer = await inquirer.prompt([
			{
				type: "list",
				name: "selected",
				message: "请选择操作：",
				choices: menuStructure[currentMenu],
				pageSize: 15,
				loop: false
			}
		]);

		const selected = answer.selected;

		// 查找菜单项详情
		let items = menuStructure[currentMenu];
		let selectedItem = items.find(item => item.value === selected);

		if (!selectedItem) {
			continue;
		}

		// 处理特殊操作
		if (selected === "exit") {
			console.log("\n再见！\n");
			break;
		}

		if (selected === "back") {
			currentMenu = "main";
			continue;
		}

		// 切换子菜单
		if (selected === "d1" || selected === "kv") {
			currentMenu = selected;
			continue;
		}

		// 执行命令
		if (selectedItem.cmd) {
			console.log(`\n${selectedItem.desc || selectedItem.name}`);

			// 先确认是否执行
			const confirm = await inquirer.prompt([
				{
					type: "confirm",
					name: "confirm",
					message: "确认执行？",
					default: true
				}
			]);

			if (!confirm.confirm) {
				console.log("\n已取消");
				await inquirer.prompt([
					{ type: "input", name: "continue", message: "按回车继续..." }
				]);
				continue;
			}

			// 再确认是否跳过备份
			const skipBackupAnswer = await inquirer.prompt([
				{
					type: "confirm",
					name: "skipBackup",
					message: "跳过备份？(默认: N)",
					default: false
				}
			]);

			const skipBackup = skipBackupAnswer.skipBackup;

			// 设置环境变量
			const execOptions = {
				stdio: "inherit",
				stderr: "inherit",
				cwd: process.cwd(),
				shell: true,
				env: {
					...process.env,
					SKIP_BACKUP: skipBackup ? "1" : "0"
				}
			};

			console.log("\n" + "-".repeat(50));
			console.log(`执行: ${selectedItem.cmd}`);
			if (skipBackup) {
				console.log("⚠️  跳过备份模式");
			}
			console.log("-".repeat(50) + "\n");

			try {
				execSync(selectedItem.cmd, execOptions);
				console.log("\n✅ 执行成功！");
			} catch (e) {
				console.log(`\n❌ 执行失败: ${e.message}`);
			}

			// 等待用户确认继续
			await inquirer.prompt([
				{
					type: "input",
					name: "continue",
					message: "按回车继续...",
				}
			]);
		}
	}
}

// 启动
mainLoop().catch(err => {
	console.error("\n❌ 错误:", err);
	process.exit(1);
});
