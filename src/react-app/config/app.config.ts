/**
 * 前端应用配置
 *
 * @description
 * 本文件包含前端 React 应用运行时需要的所有配置项。
 * 这些配置会被打包到前端代码中，任何人都可以看到，因此不要存储真正的敏感信息。
 *
 * @scope
 * - 作用范围：仅限前端 React 应用 (src/react-app)
 * - 不影响：Worker 服务端 (src/worker)
 *
 * @usage
 * ```ts
 * import { SECURITY, APP, STORAGE_KEYS } from '@/config/app.config';
 * ```
 */

/**
 * 安全配置 - 用于前端数据加密
 *
 * @description
 * 用于前端敏感数据的加密/解密，主要用于 localStorage 中存储的数据混淆。
 *
 * @scope
 * - 前端 localStorage 数据加密
 * - 记住密码功能中的凭据加密
 *
 * @warning
 * ⚠️ 安全警告：
 * - 此密钥存储在前端代码中，任何人都可以通过浏览器开发者工具看到
 * - 仅用于防止明文存储在 localStorage 中，提供基本的混淆保护
 * - 不应用于真正的安全加密场景
 * - 与 wrangler.toml 中的加密密钥完全不同用途：
 *   - wrangler 密钥：服务端敏感数据加密（如数据库密码）
 *   - 此密钥：前端本地存储数据混淆（如记住密码）
 */
export const SECURITY = {
	/**
	 * 本地存储加密密钥
	 * 用于 CryptoJS AES 加密算法
	 *
	 * @usage 登录页面"记住密码"功能的凭据加密
	 */
	ENCRYPTION_KEY: "sq-station-secret-key-2026",
} as const;

/**
 * 应用基础信息配置
 *
 * @description
 * 应用的基本展示信息，用于页面标题、描述等显示。
 *
 * @scope
 * - 登录页面标题和描述
 * - 可扩展到页面 title、meta 标签等
 */
export const APP = {
	/**
	 * 应用名称
	 *
	 * @usage 登录页面主标题、HTML <title> 标签
	 */
	NAME: "SQ Station",

	/**
	 * 应用描述/副标题
	 *
	 * @usage 登录页面副标题、SEO 描述
	 */
	DESCRIPTION: "荡荡秋千的小站",
} as const;

/**
 * localStorage 键名配置
 *
 * @description
 * 统一管理所有 localStorage 的键名，避免硬编码字符串造成拼写错误。
 *
 * @scope
 * - 所有使用 localStorage 的前端代码
 * - 认证相关数据存储
 * - 用户偏好设置存储
 *
 * @usage
 * ```ts
 * localStorage.setItem(STORAGE_KEYS.TOKEN, token);
 * localStorage.getItem(STORAGE_KEYS.PERMISSIONS);
 * ```
 */
export const STORAGE_KEYS = {
	/**
	 * 记住的登录凭据（加密存储）
	 *
	 * @description
	 * 存储格式：加密后的 "username:password" 字符串
	 * 使用 SECURITY.ENCRYPTION_KEY 进行 AES 加密
	 *
	 * @scope 登录页面"记住密码"功能
	 */
	REMEMBERED_CREDENTIALS: "sq_remembered_credentials",

	/**
	 * 用户认证信息统一存储（加密）
	 *
	 * @description
	 * 存储格式：AES 加密的 JSON 字符串
	 * 包含：user, permissions, menus, timestamp
	 *
	 * 使用 SECURITY.ENCRYPTION_KEY 进行 AES 加密
	 *
	 * @scope 统一认证存储
	 */
	USER_INFO: "auth_user_info",

	/**
	 * 访问令牌（JWT Token）
	 *
	 * @description
	 * 存储格式：JWT 字符串（明文存储）
	 *
	 * @scope API 请求认证、登录状态维持
	 * @warning 此 token 应该设置合理的过期时间
	 */
	TOKEN: "auth_token",
} as const;
