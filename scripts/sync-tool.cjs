/**
 * 同步工具 - 交互式命令行界面（方向键选择版）
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
		{ name: "从远程同步到本地", value: "d1_import", cmd: "npm run d1:import", desc: "导出远程 D1 数据到本地" },
		{ name: "从本地同步到远程", value: "d1_export", cmd: "npm run d1:export", desc: "导出本地 D1 数据到远程（会先备份远程）" },
		{ name: "从远程同步到 Schema", value: "remote_to_schema", cmd: "npm run schema:remote-to-schema", desc: "从远程 D1 同步到 schema-data.json" },
		{ name: "从本地同步到 Schema", value: "local_to_schema", cmd: "npm run schema:local-to-schema", desc: "从本地 D1 同步到 schema-data.json" },
		{ name: "从 Schema 同步到远程", value: "schema_to_remote", cmd: "npm run schema:schema-to-remote", desc: "从 schema-data.json 同步到远程 D1" },
		{ name: "从 Schema 同步到本地", value: "schema_to_local", cmd: "npm run schema:schema-to-local", desc: "从 schema-data.json 同步到本地 D1" },
		{ name: "返回", value: "back" }
	],
	kv: [
		{ name: "从远程同步到本地", value: "kv_import", cmd: "npm run kv:import", desc: "导出远程 KV 数据到本地" },
		{ name: "从本地同步到远程", value: "kv_export", cmd: "npm run kv:export", desc: "导出本地 KV 数据到远程（会先备份远程）" },
		{ name: "从 Schema 同步到远程", value: "kv_migrate", cmd: "npm run kv:migrate", desc: "应用 kv-schema.json 到远程" },
		{ name: "从 Schema 同步到本地", value: "kv_migrate_local", cmd: "npm run kv:migrate:local", desc: "应用 kv-schema.json 到本地" },
		{ name: "从远程同步到 Schema", value: "kv_remote_to_schema", cmd: "npm run kv:remote-to-schema", desc: "从远程 KV 同步到 kv-schema.json" },
		{ name: "从本地同步到 Schema", value: "kv_local_to_schema", cmd: "npm run kv:local-to-schema", desc: "从本地 KV 同步到 kv-schema.json" },
		{ name: "返回", value: "back" }
	]
};

// 显示标题
function showTitle() {
	console.log("\n" + "=".repeat(50));
	console.log("           🔄 SQ Station 数据同步工具");
	console.log("=".repeat(50) + "\n");
}

// 执行命令
function executeCommand(cmd) {
	console.log("\n" + "▶".repeat(25));
	console.log(`执行: ${cmd}`);
	console.log("▶".repeat(25) + "\n");

	try {
		execSync(cmd, {
			stdio: "inherit",
			stderr: "inherit",
			cwd: process.cwd(),
			shell: true
		});
		return true;
	} catch (e) {
		console.log(`\n❌ 执行失败: ${e.message}`);
		return false;
	}
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
			console.log("\n👋 再见！\n");
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
			console.log(`\n📋 ${selectedItem.desc || selectedItem.name}`);

			const confirmed = await inquirer.prompt([
				{
					type: "confirm",
					name: "confirm",
					message: "确认执行？",
					default: true
				}
			]);

			if (confirmed.confirm) {
				const success = executeCommand(selectedItem.cmd);
				if (success) {
					console.log("\n✅ 执行成功！");
				}
			} else {
				console.log("\n⏭️  已取消");
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
