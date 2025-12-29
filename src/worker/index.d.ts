import { KVNamespace } from "@cloudflare/workers-types";

export interface Env {
	KV_BINDING: KVNamespace;
}
