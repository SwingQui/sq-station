/**
 * 密码加密工具 - 使用 Web Crypto API
 * PBKDF2-SHA256 算法，适配 Cloudflare Workers 环境
 */

const PBKDF2_ITERATIONS = 1000; // Cloudflare Workers CPU 限制，保持较低迭代次数
const SALT_LENGTH = 16;
const KEY_LENGTH = 32; // 256 bits

/**
 * 生成随机盐值
 */
export function generateSalt(): string {
	const array = new Uint8Array(SALT_LENGTH);
	crypto.getRandomValues(array);
	return Array.from(array, (b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * 使用 PBKDF2-SHA256 哈希密码
 * @param password 明文密码
 * @param salt 盐值（如果不提供，则使用 username 作为盐值）
 */
export async function hashPassword(password: string, salt?: string): Promise<string> {
	const actualSalt = salt || generateSalt();

	const encoder = new TextEncoder();
	const passwordBuffer = encoder.encode(password);
	const saltBuffer = encoder.encode(actualSalt);

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
		KEY_LENGTH * 8 // bits
	);

	// 转换为十六进制字符串
	const hashArray = Array.from(new Uint8Array(derivedBits));
	const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

	// 格式: salt$hash
	return `${actualSalt}$${hashHex}`;
}

/**
 * 使用 username 作为盐值哈希密码（简化版，用于用户密码）
 */
export async function hashPasswordWithUsername(password: string, username: string): Promise<string> {
	const salt = username.toLowerCase().trim();
	return hashPassword(password, salt);
}

/**
 * 验证明文密码
 * 同时支持哈希密码和明文密码（兼容现有数据）
 */
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
	// 检查是否为哈希密码（包含 $ 分隔符）
	if (hashedPassword.includes('$')) {
		const [salt] = hashedPassword.split('$');
		const computedHash = await hashPassword(password, salt);
		return computedHash === hashedPassword;
	}

	// 兼容明文密码
	return password === hashedPassword;
}

/**
 * 验证使用 username 作为盐的密码
 */
export async function verifyPasswordWithUsername(
	password: string,
	username: string,
	hashedPassword: string
): Promise<boolean> {
	// 检查是否为哈希密码
	if (hashedPassword.includes('$')) {
		const salt = username.toLowerCase().trim();
		const computedHash = await hashPassword(password, salt);
		return computedHash === hashedPassword;
	}

	// 兼容明文密码
	return password === hashedPassword;
}
