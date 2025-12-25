/**
 * KV Storage Service
 * Provides CRUD operations for KV namespace
 */
export class KVService {
  constructor(private kv: KVNamespace) {}

  /**
   * Get a value by key
   * @param key - The key to retrieve
   * @param options - Optional parameters (e.g., type)
   * @returns The value or null if not found
   */
  async get<T = string>(
    key: string,
    options?: { type?: 'text' | 'json' | 'arrayBuffer' | 'stream' }
  ): Promise<T | null> {
    try {
      const type = options?.type || 'text';

      if (type === 'json') {
        return await this.kv.get(key, 'json') as T | null;
      } else if (type === 'arrayBuffer') {
        return await this.kv.get(key, 'arrayBuffer') as T | null;
      } else if (type === 'stream') {
        return await this.kv.get(key, 'stream') as T | null;
      } else {
        return await this.kv.get(key, 'text') as T | null;
      }
    } catch (error) {
      throw new Error(`KV Get Error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Put a value into KV
   * @param key - The key to store
   * @param value - The value to store (string, object, or readable stream)
   * @param options - Optional parameters (e.g., expiration, metadata)
   * @returns void
   */
  async put(
    key: string,
    value: string | ReadableStream | ArrayBuffer,
    options?: {
      expirationTtl?: number;
      expiration?: number;
      metadata?: unknown;
    }
  ): Promise<void> {
    try {
      await this.kv.put(key, value, options);
    } catch (error) {
      throw new Error(`KV Put Error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Delete a value by key
   * @param key - The key to delete
   * @returns void
   */
  async delete(key: string): Promise<void> {
    try {
      await this.kv.delete(key);
    } catch (error) {
      throw new Error(`KV Delete Error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Delete multiple keys
   * @param keys - Array of keys to delete
   * @returns void
   */
  async deleteMultiple(keys: string[]): Promise<void> {
    try {
      await Promise.all(keys.map(key => this.kv.delete(key)));
    } catch (error) {
      throw new Error(`KV DeleteMultiple Error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * List all keys with optional prefix
   * @param options - List options (prefix, limit, cursor)
   * @returns List result with keys and list metadata
   */
  async list(options?: {
    prefix?: string;
    limit?: number;
    cursor?: string;
  }): Promise<{
    keys: Array<{ name: string; metadata?: unknown }>;
    list_complete: boolean;
    cursor?: string;
  }> {
    try {
      return await this.kv.list(options);
    } catch (error) {
      throw new Error(`KV List Error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Check if a key exists
   * @param key - The key to check
   * @returns true if key exists, false otherwise
   */
  async exists(key: string): Promise<boolean> {
    try {
      const value = await this.kv.get(key);
      return value !== null;
    } catch (error) {
      throw new Error(`KV Exists Error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get metadata for a key
   * @param key - The key to get metadata for
   * @returns Metadata or null
   */
  async getMetadata(key: string): Promise<unknown | null> {
    try {
      const result = await this.kv.getWithMetadata<{
        value: string | null;
        metadata: unknown;
      }>(key);
      return result.metadata;
    } catch (error) {
      throw new Error(`KV GetMetadata Error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}
