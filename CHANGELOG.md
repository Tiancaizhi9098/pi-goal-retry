# Changelog

## [0.55.0-retry.1] - 2026-11-11

- Add automatic recovery after unclassified upstream failures, including the Antigravity premature-reply error.
- Persist the consecutive failure count, retry number, model scope and absolute recovery deadline in the existing Goal session state.
- Cap the initial request plus native and scheduled retries at eleven consecutive failed responses by default.
- Add exponential backoff, retry settings, pause/cancellation, reload recovery and selective rollback support.
- Retain token budgets, completion checks, native compaction, usage-limit policy and manual controls.
