/**
 * JWT 工具类 - 使用 Web Crypto API 实现
 * 适配 Cloudflare Workers 环境，无需外部依赖
 */

export interface JWTPayload {
	userId?: number;
	username?: string;
	clientId?: string;
	clientName?: string;
	scopes?: string[];
	type?: "user" | "oauth";
	exp: number;
	iat: number;
}

/**
 * Base64URL 编码
 */
function base64UrlEncode(data: string): string {
	const base64 = btoa(data);
	return base64
		.replace(/\+/g, '-')
		.replace(/\//g, '_')
		.replace(/=/g, '');
}

/**
 * Base64URL 解码
 */
function base64UrlDecode(str: string): string {
	let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
	while (base64.length % 4) {
		base64 += '=';
	}
	return atob(base64);
}

/**
 * 解析过期时间表达式（如 "24 * 60 * 60"）
 * 使用安全的 Function 构造器计算
 */
function parseExpiresIn(value: string): number {
	try {
		// 只允许数字、空格、乘号和括号
		if (!/^[\d\s\*]+$/.test(value)) {
			return 86400; // 默认 24 小时
		}
		return new Function('return ' + value)() as number;
	} catch {
		return 86400;
	}
}

/**
 * 生成 HMAC-SHA256 签名
 */
async function signHmac(data: string, secret: string): Promise<string> {
	const encoder = new TextEncoder();
	const keyData = encoder.encode(secret);
	const messageData = encoder.encode(data);

	const key = await crypto.subtle.importKey(
		'raw',
		keyData,
		{ name: 'HMAC', hash: 'SHA-256' },
		false,
		['sign']
	);

	const signature = await crypto.subtle.sign('HMAC', key, messageData);
	const signatureArray = Array.from(new Uint8Array(signature));
	const signatureBase64 = btoa(String.fromCharCode.apply(null, signatureArray));

	return signatureBase64
		.replace(/\+/g, '-')
		.replace(/\//g, '_')
		.replace(/=/g, '');
}

/**
 * 验证 HMAC-SHA256 签名
 */
async function verifyHmac(data: string, signature: string, secret: string): Promise<boolean> {
	const expectedSignature = await signHmac(data, secret);
	return signature === expectedSignature;
}

/**
 * 生成 JWT Token
 */
export async function signToken(payload: Omit<JWTPayload, 'iat' | 'exp'>, secret: string, expiresIn?: string): Promise<string> {
	const now = Math.floor(Date.now() / 1000);
	const expiresInSeconds = expiresIn ? parseExpiresIn(expiresIn) : 24 * 60 * 60; // 默认 24 小时
	const exp = now + expiresInSeconds;

	const fullPayload: JWTPayload = {
		...payload,
		iat: now,
		exp,
	};

	const header = {
		alg: 'HS256',
		typ: 'JWT',
	};

	const encodedHeader = base64UrlEncode(JSON.stringify(header));
	const encodedPayload = base64UrlEncode(JSON.stringify(fullPayload));
	const data = `${encodedHeader}.${encodedPayload}`;
	const signature = await signHmac(data, secret);

	return `${data}.${signature}`;
}

/**
 * 验证并解码 JWT Token
 */
export async function verifyToken(token: string, secret: string): Promise<JWTPayload | null> {
	try {
		console.log("[JWT] verifyToken called, token length:", token.length);

		const parts = token.split('.');
		if (parts.length !== 3) {
			console.log("[JWT] Invalid token format, parts:", parts.length);
			return null;
		}

		const [encodedHeader, encodedPayload, signature] = parts;
		const data = `${encodedHeader}.${encodedPayload}`;

		// 验证签名
		const isValid = await verifyHmac(data, signature, secret);
		if (!isValid) {
			console.log("[JWT] Signature verification failed");
			return null;
		}

		// 解码 payload
		const payloadJson = base64UrlDecode(encodedPayload);
		const payload: JWTPayload = JSON.parse(payloadJson);

		console.log("[JWT] Token payload decoded:", payload);

		// 检查过期时间
		const now = Math.floor(Date.now() / 1000);
		if (payload.exp < now) {
			console.log("[JWT] Token expired:", { exp: payload.exp, now });
			return null;
		}

		console.log("[JWT] Token verified successfully");
		return payload;
	} catch (error: any) {
		console.log("[JWT] Exception during verification:", error.message);
		return null;
	}
}

/**
 * 解码 JWT Token (不验证签名，仅用于调试)
 */
export function decodeToken(token: string): JWTPayload | null {
	try {
		const parts = token.split('.');
		if (parts.length !== 3) {
			return null;
		}

		const payloadJson = base64UrlDecode(parts[1]);
		return JSON.parse(payloadJson);
	} catch {
		return null;
	}
}
