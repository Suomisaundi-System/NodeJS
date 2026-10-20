# NodeJS — trusted backend job pool

Run `node --test backend/job-pool.test.mjs` to validate the in-memory scheduler. Import `JobPool` from `backend/job-pool.mjs` in a trusted Node.js 20+ service.

Provides job submission, worker registration, heartbeats, group-based scheduling, bounded concurrency, expiring leases, retries and completion. This is an **internal library**, not an authenticated network service.

Production still requires durable database storage, credential verification, TLS, authorization, quotas, audit logging, worker isolation, restart recovery and operational deployment. Never publish bot tokens or backend ingest credentials in browser JavaScript.
