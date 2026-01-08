/**
 * OAuth 客户端密钥加密工具
 * 用于生成和验证客户端 ID、客户端密钥
 */

import { hashPassword, verifyPassword, generateSalt } from "./password";

const CLIENT_ID_LENGTH = 24;
const CLIENT_SECRET_LENGTH = 48;

/**
 * 生成客户端 ID
 * 格式: client_xxxxxxxxxxxxxxxxxxxxxxx (24 位随机字符)
 */
export function generateClientId(): string {
	const array = new Uint8Array(CLIENT_ID_LENGTH);
	crypto.getRandomValues(array);
	const random = Array.from(array, (b) => b.toString(16).padStart(2, '0')).join('');
	return `client_${random}`;
}

/**
 * 生成客户端密钥（明文）
 * 仅在创建/重置时返回给用户，存储时需加密
 * 格式: cs_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx (48 位随机字符)
 */
export function generateClientSecret(): string {
	const array = new Uint8Array(CLIENT_SECRET_LENGTH);
	crypto.getRandomValues(array);
	const random = Array.from(array, (b) => b.toString(16).padStart(2, '0')).join('');
	return `cs_${random}`;
}

/**
 * 加密客户端密钥用于存储
 * 使用 PBKDF2-SHA256 算法，格式: salt$hash
 */
export async function hashClientSecret(clientSecret: string): Promise<string> {
	const salt = generateSalt();
	return hashPassword(clientSecret, salt);
}

/**
 * 验证客户端密钥
 */
export async function verifyClientSecret(
	clientSecret: string,
	hashedSecret: string
): Promise<boolean> {
	return verifyPassword(clientSecret, hashedSecret);
}
