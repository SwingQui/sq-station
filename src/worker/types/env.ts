export interface Env {
  // D1 Database binding
  STATION_D1SQL: D1Database;

  // KV Namespace binding
  STATION_KV: KVNamespace;

  // R2 Bucket binding
  STATION_R2: R2Bucket;
}
