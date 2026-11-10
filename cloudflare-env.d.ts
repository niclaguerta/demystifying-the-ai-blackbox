declare namespace Cloudflare {
  interface Env {
    DB?: D1Database;
    FACILITATOR_EMAIL?: string;
    BUCKET?: R2Bucket;
  }
}
