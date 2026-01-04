/**
 * API 请求统一导出
 * 导出底层 core/request 的所有功能
 */

export * from "../core/request";

// 重新导出 apiRequest 保持兼容性
export { apiRequest } from "../core/request";
