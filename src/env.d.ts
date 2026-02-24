/// <reference types="@cloudflare/workers-types" />

// Cloudflare Pages environment bindings
// These are injected by wrangler at runtime (local: via setupDevPlatform)
interface CloudflareEnv {
  DB: D1Database;
}
