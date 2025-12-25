/**
 * D1 Database Service
 * Provides CRUD operations for D1 database
 */
export class D1Service {
  constructor(private db: D1Database) {}

  /**
   * Execute a SELECT query
   * @param sql - SQL query with placeholders (e.g., "SELECT * FROM users WHERE id = ?")
   * @param params - Query parameters
   * @returns Query results
   */
  async query<T = unknown>(sql: string, params: unknown[] = []): Promise<T[]> {
    try {
      const stmt = this.db.prepare(sql);
      const result = params.length > 0
        ? await stmt.bind(...params).all()
        : await stmt.all();
      return result.results as T[];
    } catch (error) {
      throw new Error(`D1 Query Error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Execute a SELECT query and return first result
   * @param sql - SQL query with placeholders
   * @param params - Query parameters
   * @returns First result or null
   */
  async queryFirst<T = unknown>(sql: string, params: unknown[] = []): Promise<T | null> {
    try {
      const stmt = this.db.prepare(sql);
      const result = params.length > 0
        ? await stmt.bind(...params).first()
        : await stmt.first();
      return (result as T | null);
    } catch (error) {
      throw new Error(`D1 QueryFirst Error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Execute an INSERT statement
   * @param sql - INSERT SQL statement
   * @param params - Statement parameters
   * @returns Inserted row metadata
   */
  async insert(sql: string, params: unknown[] = []): Promise<D1Result> {
    try {
      const stmt = this.db.prepare(sql);
      const result = params.length > 0
        ? await stmt.bind(...params).run()
        : await stmt.run();
      return result;
    } catch (error) {
      throw new Error(`D1 Insert Error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Execute an UPDATE statement
   * @param sql - UPDATE SQL statement
   * @param params - Statement parameters
   * @returns Update result metadata
   */
  async update(sql: string, params: unknown[] = []): Promise<D1Result> {
    try {
      const stmt = this.db.prepare(sql);
      const result = params.length > 0
        ? await stmt.bind(...params).run()
        : await stmt.run();
      return result;
    } catch (error) {
      throw new Error(`D1 Update Error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Execute a DELETE statement
   * @param sql - DELETE SQL statement
   * @param params - Statement parameters
   * @returns Delete result metadata
   */
  async delete(sql: string, params: unknown[] = []): Promise<D1Result> {
    try {
      const stmt = this.db.prepare(sql);
      const result = params.length > 0
        ? await stmt.bind(...params).run()
        : await stmt.run();
      return result;
    } catch (error) {
      throw new Error(`D1 Delete Error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Execute a batch of statements in a transaction
   * @param statements - Array of SQL statements with parameters
   * @returns Array of statement results
   */
  async batch(statements: Array<{ sql: string; params?: unknown[] }>): Promise<D1Result[]> {
    try {
      const stmts = statements.map(({ sql, params = [] }) =>
        this.db.prepare(sql).bind(...params)
      );
      return await this.db.batch(stmts);
    } catch (error) {
      throw new Error(`D1 Batch Error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Execute raw SQL (for DDL statements like CREATE TABLE, etc.)
   * @param sql - SQL statement
   * @returns Execution result
   */
  async execute(sql: string): Promise<D1Result> {
    try {
      const stmt = this.db.prepare(sql);
      return await stmt.run();
    } catch (error) {
      throw new Error(`D1 Execute Error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}
