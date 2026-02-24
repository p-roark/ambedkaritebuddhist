/// <reference types="@cloudflare/workers-types" />

interface CloudflareEnv {
  DB: D1Database;
  EVENT_IMAGES: R2Bucket;
}
