import { Hono } from "hono";
import type { Env } from "./types/env";
import { D1Service } from "./services/d1.service";
import { KVService } from "./services/kv.service";
import { R2Service } from "./services/r2.service";

const app = new Hono<{ Bindings: Env }>();

app.get("/api/", (c) => c.json({ name: "Cloudflare" }));

// ============ D1 Database Routes ============
app.get("/api/d1/query", async (c) => {
  const { sql, params } = await c.req.query();
  if (!sql) return c.json({ error: "SQL query is required" }, 400);

  try {
    const d1Service = new D1Service(c.env.STATION_D1SQL);
    const parsedParams = params ? JSON.parse(params) : [];
    const result = await d1Service.query(sql, parsedParams);
    return c.json({ success: true, data: result });
  } catch (error) {
    return c.json({ success: false, error: error instanceof Error ? error.message : String(error) }, 500);
  }
});

app.post("/api/d1/query", async (c) => {
  const { sql, params } = await c.req.json();
  if (!sql) return c.json({ error: "SQL query is required" }, 400);

  try {
    const d1Service = new D1Service(c.env.STATION_D1SQL);
    const result = await d1Service.query(sql, params || []);
    return c.json({ success: true, data: result });
  } catch (error) {
    return c.json({ success: false, error: error instanceof Error ? error.message : String(error) }, 500);
  }
});

app.post("/api/d1/insert", async (c) => {
  const { sql, params } = await c.req.json();
  if (!sql) return c.json({ error: "SQL statement is required" }, 400);

  try {
    const d1Service = new D1Service(c.env.STATION_D1SQL);
    const result = await d1Service.insert(sql, params || []);
    return c.json({ success: true, meta: result.meta });
  } catch (error) {
    return c.json({ success: false, error: error instanceof Error ? error.message : String(error) }, 500);
  }
});

app.post("/api/d1/update", async (c) => {
  const { sql, params } = await c.req.json();
  if (!sql) return c.json({ error: "SQL statement is required" }, 400);

  try {
    const d1Service = new D1Service(c.env.STATION_D1SQL);
    const result = await d1Service.update(sql, params || []);
    return c.json({ success: true, meta: result.meta });
  } catch (error) {
    return c.json({ success: false, error: error instanceof Error ? error.message : String(error) }, 500);
  }
});

app.post("/api/d1/delete", async (c) => {
  const { sql, params } = await c.req.json();
  if (!sql) return c.json({ error: "SQL statement is required" }, 400);

  try {
    const d1Service = new D1Service(c.env.STATION_D1SQL);
    const result = await d1Service.delete(sql, params || []);
    return c.json({ success: true, meta: result.meta });
  } catch (error) {
    return c.json({ success: false, error: error instanceof Error ? error.message : String(error) }, 500);
  }
});

app.post("/api/d1/batch", async (c) => {
  const { statements } = await c.req.json();
  if (!Array.isArray(statements)) return c.json({ error: "Statements array is required" }, 400);

  try {
    const d1Service = new D1Service(c.env.STATION_D1SQL);
    const result = await d1Service.batch(statements);
    return c.json({ success: true, results: result });
  } catch (error) {
    return c.json({ success: false, error: error instanceof Error ? error.message : String(error) }, 500);
  }
});

// ============ KV Storage Routes ============
app.get("/api/kv/:key", async (c) => {
  const key = c.req.param("key");
  const type = c.req.query("type") as "text" | "json" | "arrayBuffer" | "stream" || "text";

  try {
    const kvService = new KVService(c.env.STATION_KV);
    const value = await kvService.get(key, { type });
    return c.json({ success: true, data: value });
  } catch (error) {
    return c.json({ success: false, error: error instanceof Error ? error.message : String(error) }, 500);
  }
});

app.put("/api/kv/:key", async (c) => {
  const key = c.req.param("key");
  const { value, expirationTtl, expiration, metadata } = await c.req.json();

  try {
    const kvService = new KVService(c.env.STATION_KV);
    await kvService.put(key, value, { expirationTtl, expiration, metadata });
    return c.json({ success: true, message: "Value stored successfully" });
  } catch (error) {
    return c.json({ success: false, error: error instanceof Error ? error.message : String(error) }, 500);
  }
});

app.delete("/api/kv/:key", async (c) => {
  const key = c.req.param("key");

  try {
    const kvService = new KVService(c.env.STATION_KV);
    await kvService.delete(key);
    return c.json({ success: true, message: "Key deleted successfully" });
  } catch (error) {
    return c.json({ success: false, error: error instanceof Error ? error.message : String(error) }, 500);
  }
});

app.post("/api/kv/delete-multiple", async (c) => {
  const { keys } = await c.req.json();
  if (!Array.isArray(keys)) return c.json({ error: "Keys array is required" }, 400);

  try {
    const kvService = new KVService(c.env.STATION_KV);
    await kvService.deleteMultiple(keys);
    return c.json({ success: true, message: "Keys deleted successfully" });
  } catch (error) {
    return c.json({ success: false, error: error instanceof Error ? error.message : String(error) }, 500);
  }
});

app.get("/api/kv", async (c) => {
  const prefix = c.req.query("prefix");
  const limit = c.req.query("limit") ? parseInt(c.req.query("limit")!) : undefined;
  const cursor = c.req.query("cursor");

  try {
    const kvService = new KVService(c.env.STATION_KV);
    const result = await kvService.list({ prefix, limit, cursor });
    return c.json({ success: true, ...result });
  } catch (error) {
    return c.json({ success: false, error: error instanceof Error ? error.message : String(error) }, 500);
  }
});

app.get("/api/kv/:key/exists", async (c) => {
  const key = c.req.param("key");

  try {
    const kvService = new KVService(c.env.STATION_KV);
    const exists = await kvService.exists(key);
    return c.json({ success: true, exists });
  } catch (error) {
    return c.json({ success: false, error: error instanceof Error ? error.message : String(error) }, 500);
  }
});

app.get("/api/kv/:key/metadata", async (c) => {
  const key = c.req.param("key");

  try {
    const kvService = new KVService(c.env.STATION_KV);
    const metadata = await kvService.getMetadata(key);
    return c.json({ success: true, metadata });
  } catch (error) {
    return c.json({ success: false, error: error instanceof Error ? error.message : String(error) }, 500);
  }
});

// ============ R2 Storage Routes ============
app.get("/api/r2/:key", async (c) => {
  const key = c.req.param("key");

  try {
    const r2Service = new R2Service(c.env.STATION_R2);
    const object = await r2Service.get(key);

    if (!object) {
      return c.json({ success: false, error: "Object not found" }, 404);
    }

    if ("body" in object) {
      // R2ObjectBody - return the object with body
      const headers: Record<string, string> = {};
      if (object.httpMetadata) {
        if (object.httpMetadata.contentType) headers["Content-Type"] = object.httpMetadata.contentType;
        if (object.httpMetadata.cacheControl) headers["Cache-Control"] = object.httpMetadata.cacheControl;
        if (object.httpMetadata.contentEncoding) headers["Content-Encoding"] = object.httpMetadata.contentEncoding;
      }
      return new Response(object.body, { headers });
    } else {
      // R2Object (from head) - return metadata only
      return c.json({ success: true, metadata: object });
    }
  } catch (error) {
    return c.json({ success: false, error: error instanceof Error ? error.message : String(error) }, 500);
  }
});

app.get("/api/r2/:key/head", async (c) => {
  const key = c.req.param("key");

  try {
    const r2Service = new R2Service(c.env.STATION_R2);
    const object = await r2Service.head(key);

    if (!object) {
      return c.text("Not Found", 404);
    }

    const headers: Record<string, string> = {};
    if (object.httpMetadata) {
      if (object.httpMetadata.contentType) headers["Content-Type"] = object.httpMetadata.contentType;
      if (object.httpMetadata.cacheControl) headers["Cache-Control"] = object.httpMetadata.cacheControl;
    }
    headers["Content-Length"] = object.size.toString();

    return c.text("", 200, headers);
  } catch (error) {
    return c.text(error instanceof Error ? error.message : String(error), 500);
  }
});

app.put("/api/r2/:key", async (c) => {
  const key = c.req.param("key");
  const body = await c.req.arrayBuffer();
  const contentType = c.req.header("Content-Type");
  const cacheControl = c.req.header("Cache-Control");
  const customMetadata = c.req.header("X-Custom-Metadata");

  try {
    const r2Service = new R2Service(c.env.STATION_R2);
    const result = await r2Service.put(key, body, {
      httpMetadata: {
        contentType,
        cacheControl,
      },
      customMetadata: customMetadata ? JSON.parse(customMetadata) : undefined,
    });
    return c.json({ success: true, key: result.key, size: result.size });
  } catch (error) {
    return c.json({ success: false, error: error instanceof Error ? error.message : String(error) }, 500);
  }
});

app.delete("/api/r2/:key", async (c) => {
  const key = c.req.param("key");

  try {
    const r2Service = new R2Service(c.env.STATION_R2);
    await r2Service.delete(key);
    return c.json({ success: true, message: "Object deleted successfully" });
  } catch (error) {
    return c.json({ success: false, error: error instanceof Error ? error.message : String(error) }, 500);
  }
});

app.post("/api/r2/delete-multiple", async (c) => {
  const { keys } = await c.req.json();
  if (!Array.isArray(keys)) return c.json({ error: "Keys array is required" }, 400);

  try {
    const r2Service = new R2Service(c.env.STATION_R2);
    await r2Service.deleteMultiple(keys);
    return c.json({ success: true, message: "Objects deleted successfully" });
  } catch (error) {
    return c.json({ success: false, error: error instanceof Error ? error.message : String(error) }, 500);
  }
});

app.get("/api/r2", async (c) => {
  const prefix = c.req.query("prefix");
  const limit = c.req.query("limit") ? parseInt(c.req.query("limit")!) : undefined;
  const cursor = c.req.query("cursor");
  const delimiter = c.req.query("delimiter");

  try {
    const r2Service = new R2Service(c.env.STATION_R2);
    const result = await r2Service.list({ prefix, limit, cursor, delimiter });
    return c.json({ success: true, ...result });
  } catch (error) {
    return c.json({ success: false, error: error instanceof Error ? error.message : String(error) }, 500);
  }
});

app.get("/api/r2/:key/exists", async (c) => {
  const key = c.req.param("key");

  try {
    const r2Service = new R2Service(c.env.STATION_R2);
    const exists = await r2Service.exists(key);
    return c.json({ success: true, exists });
  } catch (error) {
    return c.json({ success: false, error: error instanceof Error ? error.message : String(error) }, 500);
  }
});

app.post("/api/r2/:key/copy", async (c) => {
  const key = c.req.param("key");
  const { destinationKey } = await c.req.json();
  if (!destinationKey) return c.json({ error: "destinationKey is required" }, 400);

  try {
    const r2Service = new R2Service(c.env.STATION_R2);
    const result = await r2Service.copy(key, destinationKey);
    return c.json({ success: true, key: result.key, size: result.size });
  } catch (error) {
    return c.json({ success: false, error: error instanceof Error ? error.message : String(error) }, 500);
  }
});

// ============ SPA Fallback for Frontend Routes ============
// This fallback handles all non-API routes and serves the React app
// The wrangler.json assets configuration serves static files, and
// not_found_handling: "single-page-application" ensures unmatched routes
// receive index.html for client-side routing to work
app.get("*", (c) => {
  // Static assets are served automatically by Cloudflare's asset handler
  // This is just a fallback for any unmatched routes
  return c.text("Not Found", 404);
});

export default app;
