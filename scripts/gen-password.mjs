/**
 * 生成加密密码脚本
 * 使用 username 作为 salt（与代码逻辑一致）
 */

async function hashPasswordWithUsername(password, username) {
	const PBKDF2_ITERATIONS = 1000;
	const KEY_LENGTH = 32;

	// 使用 username 作为 salt
	const salt = username.toLowerCase().trim();

	const encoder = new TextEncoder();
	const passwordBuffer = encoder.encode(password);
	const saltBuffer = encoder.encode(salt);

	// 导入密码作为密钥
	const keyMaterial = await crypto.subtle.importKey(
		'raw',
		passwordBuffer,
		'PBKDF2',
		false,
		['deriveBits']
	);

	// 派生密钥
	const derivedBits = await crypto.subtle.deriveBits(
		{
			name: 'PBKDF2',
			salt: saltBuffer,
			iterations: PBKDF2_ITERATIONS,
			hash: 'SHA-256',
		},
		keyMaterial,
		KEY_LENGTH * 8
	);

	// 转换为十六进制字符串
	const hashArray = Array.from(new Uint8Array(derivedBits));
	const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

	// 格式: salt$hash
	return `${salt}$${hashHex}`;
}

async function main() {
	console.log('=== 生成用户密码哈希（使用 username 作为 salt）===\n');

	// 生成 admin/admin13672210421 的哈希
	const adminHash = await hashPasswordWithUsername('admin13672210421', 'admin');
	console.log('Admin (admin / admin13672210421):');
	console.log(adminHash);
	console.log('');

	// 生成 user/user123 的哈希
	const userHash = await hashPasswordWithUsername('user123', 'user');
	console.log('User (user / user123):');
	console.log(userHash);
	console.log('');

	console.log('=== SQL INSERT 语句 ===');
	console.log(`INSERT OR IGNORE INTO sys_user (id, username, password, nickname, status) VALUES`);
	console.log(`(1, 'admin', '${adminHash}', '管理员', 1),`);
	console.log(`(2, 'user', '${userHash}', '普通用户', 1);`);
}

main();
