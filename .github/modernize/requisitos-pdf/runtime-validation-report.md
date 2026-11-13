# Runtime Validation Report

**Generated**: 2026-11-13T15:21:08.5903681-03:00

**Target**: `C:\Users\Ulise\Documents\Pediacare+\Proyecto-PediaCare-`

## Summary

| Step | Status | Exit Code | Details |
|------|--------|-----------|---------|
| Startup | PASS | 0 | `npm run dev`; Vite and all Flask services started. `/`, the Vite-proxied OpenAPI endpoint, and each service's `/api/openapi.json` returned HTTP 200. |
| Backend tests | PASS | 0 | `npm test`: 26 Node tests and 16 pytest tests passed; the two opt-in MySQL E2E tests were skipped. |
| Frontend component tests | PASS | 0 | Vitest: 4 tests passed. |
| Browser E2E | PASS | 0 | Playwright: 2 registration flows passed with API traffic stubbed. |
| Build | PASS | 0 | `npm run build` completed successfully. |
| Lint | PASS WITH WARNING | 0 | `npm run lint` passed; one existing `Date.now` purity warning remains in `DoctorConsultationsView.jsx`. |
| Python syntax | PASS | 0 | `python -m compileall -q backend` completed successfully. |
| MySQL E2E | UNVERIFIED | 0 (skipped) | No Docker CLI or local MySQL listener was available on ports 3306 or 3307. No database-backed flow was run. |

**Overall**: NEEDS_SIGNOFF — live MySQL E2E and migration execution against an isolated test schema remain unverified.

## Test Evidence

- Canonical command: `npm test`
- Results: 26 Node passed; 16 pytest passed and 2 skipped; 4 Vitest passed; 2 Playwright passed.
- Independent commands: `npm run build`, `npm run lint`, `python -m compileall -q backend`, and `git diff --check` all exited 0.
- Startup command: `npm run dev`. The Vite page and API proxy returned 200; all three Flask services returned 200 from `/api/openapi.json`.
- The E2E database guard was exercised with `PEDIACARE_E2E=1` and `DB_NAME=pedia_care`; it refused to proceed because the database name does not end in `_test`. No database connection was attempted.
- TLS evidence: `docs/pedia-care-tls-api-ficticia.pcapng` metadata shows 8 TLS packets and 0 HTTP packets on the documented client-to-Vite capture. The existing cleartext capture was not inspected beyond previously recorded protocol metadata.

## Environment and Verdict

```text
environment:
  docker: UNAVAILABLE — Docker CLI is not installed
  node: AVAILABLE — Node.js 24.16.0
  playwright: AVAILABLE — Chromium browser tests completed successfully
  infra-tier: UNVERIFIED — no local MySQL listener on ports 3306/3307; no test database available
  browser-tier: PRIMARY(Playwright) — 2 browser tests passed
startup: PASS — npm run dev; Vite and all three Flask services ready; HTTP 200 readiness probes
integration: PARTIAL — exit_code: 0; 42 backend tests passed (26 Node, 16 pytest), 2 MySQL E2E tests skipped
e2e: PARTIAL — exit_code: 0; 2 Playwright tests passed; MySQL-backed flows remain unverified
overall: NEEDS_SIGNOFF — a live isolated MySQL database is required to verify the remaining E2E and migration behavior
```

## Issues Found

| # | Severity | Description | Escalated To |
|---|----------|-------------|--------------|
| 1 | Medium | No live MySQL test database was available, so schema migration and database-backed HTTP E2E behavior could not be verified. | Project team: run the documented E2E command against an isolated `_test` database. |
| 2 | Low | Lint reports an existing purity warning for `Date.now` in `DoctorConsultationsView.jsx`; this is outside the requirement changes. | None |

## Safety Note

The development server logged that the configured JWT secret is short and is permitted only in
development. Do not use that development configuration or real patient data in production.
