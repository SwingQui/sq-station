/**
 * R2 Storage Service
 * Provides CRUD operations for R2 bucket
 */
export class R2Service {
  constructor(private bucket: R2Bucket) {}

  /**
   * Get an object from R2
   * @param key - The object key
   * @returns The R2Object or null if not found
   */
  async get(key: string): Promise<R2Object | R2ObjectBody | null> {
    try {
      return await this.bucket.get(key);
    } catch (error) {
      throw new Error(`R2 Get Error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get an object's metadata without downloading the body
   * @param key - The object key
   * @returns The R2Object with metadata only
   */
  async head(key: string): Promise<R2Object | null> {
    try {
      return await this.bucket.head(key);
    } catch (error) {
      throw new Error(`R2 Head Error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Put an object into R2
   * @param key - The object key
   * @param value - The object value (string, array buffer, readable stream)
   * @param options - Optional parameters (httpMetadata, customMetadata)
   * @returns The uploaded object metadata
   */
  async put(
    key: string,
    value: string | ArrayBuffer | ReadableStream,
    options?: {
      httpMetadata?: R2HTTPMetadata;
      customMetadata?: Record<string, string>;
    }
  ): Promise<R2Object> {
    try {
      return await this.bucket.put(key, value, options);
    } catch (error) {
      throw new Error(`R2 Put Error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Delete an object from R2
   * @param key - The object key to delete
   * @returns void
   */
  async delete(key: string): Promise<void> {
    try {
      await this.bucket.delete(key);
    } catch (error) {
      throw new Error(`R2 Delete Error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Delete multiple objects from R2
   * @param keys - Array of object keys to delete
   * @returns void
   */
  async deleteMultiple(keys: string[]): Promise<void> {
    try {
      await this.bucket.delete(keys);
    } catch (error) {
      throw new Error(`R2 DeleteMultiple Error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * List all objects in the bucket with optional prefix
   * @param options - List options (prefix, limit, cursor, delimiter)
   * @returns List result with objects and prefixes
   */
  async list(options?: {
    prefix?: string;
    limit?: number;
    cursor?: string;
    delimiter?: string;
  }): Promise<{
    objects: R2Object[];
    truncated: boolean;
    cursor?: string;
    prefixes?: string[];
  }> {
    try {
      return await this.bucket.list(options);
    } catch (error) {
      throw new Error(`R2 List Error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Check if an object exists
   * @param key - The object key to check
   * @returns true if object exists, false otherwise
   */
  async exists(key: string): Promise<boolean> {
    try {
      const object = await this.bucket.head(key);
      return object !== null;
    } catch (error) {
      throw new Error(`R2 Exists Error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Copy an object within the bucket
   * @param sourceKey - The source object key
   * @param destinationKey - The destination object key
   * @returns The copied object metadata
   */
  async copy(sourceKey: string, destinationKey: string): Promise<R2Object> {
    try {
      const source = await this.bucket.get(sourceKey);
      if (!source) {
        throw new Error(`Source object "${sourceKey}" not found`);
      }
      return await this.bucket.put(destinationKey, source.body, {
        httpMetadata: source.httpMetadata,
        customMetadata: source.customMetadata,
      });
    } catch (error) {
      throw new Error(`R2 Copy Error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  // Note: Multipart upload methods are not included as they have limited
  // support in Cloudflare Workers R2. For large files, consider using
  // the standard put method or implement multipart upload with the
  // R2 API directly when needed.
}
