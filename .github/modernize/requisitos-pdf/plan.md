# Implementation Plan: PediaCare+ PDF Requirements Completion

**Date**: 2026-11-13 | **Spec**: [spec.md](./spec.md)

## Summary

Restore the missing MySQL login-throttle schema and migration, add safe audit logging and focused
backend/frontend tests, and complete the documentation and Wireshark evidence path. Preserve the
current React/Vite, three Flask services, MySQL, existing API contract, and fictitious-data policy.
MySQL and the five-person team are professor-approved exceptions to the original PDF.

## Technical Context

**Language/Version**: Python 3.11, JavaScript/React 19

**Primary Dependencies**: Flask, PyMySQL, pytest, Vite, Vitest; add React Testing Library,
jsdom, and Playwright for the required component/browser tests

**Storage**: Shared MySQL schema in `db/pedia_care.sql`

**Testing**: Root `npm test` (Node tests, pytest, Vitest); opt-in MySQL-backed API E2E; Playwright
browser tests

**Target Platform**: Windows development environment; local web app and Flask services

**Performance Goals**: No measurable regression in existing request behavior; audit logging must
not include request payloads or introduce extra database queries

**Constraints**: Additive SQL only; no real patient data; test database name must end in `_test`;
database-backed E2E is disabled unless explicitly enabled; no Docker CLI or local MySQL/MariaDB
service was detected, and ports 3306 and 3307 were unreachable at planning time.

**Baseline evidence**: `npm test` passed before changes: 26 Node tests, 12 pytest tests, and 2
Vitest tests. Node.js 24.16.0 is available. Docker and Playwright were not initially available;
Playwright was added and Chromium installed. No local MySQL/MariaDB service was found and ports
3306 and 3307 were unreachable.

**Design inputs**: Existing architecture diagram at
`docs/architecture-diagram.md`, API contract at
`docs/openapi.json`, current schema at `db/pedia_care.sql`, and service/test documentation in
`README.md` and `backend/README.md`. No project topology or knowledge graph was present.

## Constitution Check

- **I. Preserve Existing Behavior**: PASS — service contracts and user flows remain unchanged;
  SQL is additive and the migration does not touch application rows.
- **II. Protect Patient and Account Data**: PASS — tests use fictitious values; audit records avoid
  tokens, bodies, and clinical details; the existing cleartext capture is not reused as TLS proof.
- **III. Verify Behavior with Tests**: PASS — add regression, role, database E2E, component, and
  browser tests. MySQL E2E must be guarded by an explicit opt-in and `_test` database name.
- **IV. Keep Changes Traceable and Understandable**: PASS — every task maps to the REQ table below;
  README and Wireshark documentation are updated with verifiable evidence.
- **V. Prefer Small, Reliable Changes**: PASS — reuse pytest, Vitest, current Flask test clients,
  and existing API patterns; add only test dependencies required by the assignment.
- **Approved deviations**: PASS — document, but do not misrepresent, professor approval for MySQL
  and five group members.

## Applied Guidelines

- No supplied migration guideline matches this work: the source/target frameworks are unchanged,
  and the available Struts-to-Spring guideline is unrelated.
- Follow the repository's existing Flask, PyMySQL, Vitest, and SQL naming conventions.

## Implementation Steps

### Phase 1: Setup

#### Step 1.1: [Cross-cutting] Add frontend test infrastructure
- **Requirements**: REQ-005, REQ-007
- **Design inputs**: `frontend/package.json`, `frontend/vite.config.js`, current API client tests.
- **Description**: Add React Testing Library and jsdom to Vitest, add Playwright for browser tests,
  wire the new test commands into the existing root test command, and keep browser tests isolated
  from MySQL by stubbing API responses at the browser boundary.

**Tasks**
- [x] T001 [Plan:1.1] Add React Testing Library, jsdom, and Vitest test configuration in `frontend/package.json` and `frontend/vite.config.js`.
- [x] T002 [Plan:1.1] Add Playwright configuration, a Vite-backed browser test command, and wire it into the canonical root test flow in `frontend/e2e/` and `package.json`.

### Phase 2: Foundational database and login protection

#### Step 2.1: [Cross-cutting] Restore the login-throttle schema
- **Requirements**: REQ-001, REQ-002
- **Design inputs**: Existing SQL statements and `login_throttle` usage in `backend/services/identity/app.py`.
- **Description**: Add the table with the exact column names/types used by the login service to the
  fresh-install SQL, and create an idempotent numbered migration for existing installations.
  Preserve existing schema and records.

#### Step 2.2: [US1] Verify throttling behavior
- **Requirements**: REQ-003, REQ-006
- **Design inputs**: `_locked`, `_record_login_failure`, and `login` in
  `backend/services/identity/app.py`.
- **Description**: Add focused tests for lockout response, failure recording, hashed account/IP
  scopes, and recovery behavior while avoiding real credentials and MySQL access in unit tests.

**Tasks**
- [x] T003 [US1] [Plan:2.1] Add `login_throttle` creation to `db/pedia_care.sql` with fields and keys matching `backend/services/identity/app.py`.
- [x] T004 [US1] [Plan:2.1] Create idempotent `db/migrations/004_login_throttle.sql` for existing databases without modifying application data.
- [x] T005 [US1] [Plan:2.2] Add focused lockout tests in `backend/tests/test_login_throttle.py` for blocked login, failure recording, hashed scopes, and reset semantics.

### Phase 3: User Story 2 — accountable, role-limited access

#### Step 3.1: [US2] Add minimal authenticated-access audit records
- **Requirements**: REQ-004
- **Design inputs**: Shared Flask application factory in `backend/services/common/app.py` and
  authenticated identity set by `backend/services/common/security.py`.
- **Description**: Record actor ID, role, endpoint, method, and status after authenticated requests.
  Do not log paths containing resource identifiers, query strings, headers, request bodies, or
  clinical values. Keep the existing security headers behavior.

#### Step 3.2: [US2] Verify role and log privacy
- **Requirements**: REQ-004, REQ-006
- **Design inputs**: Existing Flask `test_client` tests and shared role enforcement.
- **Description**: Cover an allowed request and a denied request; assert audit data is useful while
  tokens, passwords, bodies, and patient data are absent.

**Tasks**
- [x] T006 [US2] [Plan:3.1] Add authenticated request audit logging to `backend/services/common/app.py` without including resource IDs or request data.
- [x] T007 [US2] [Plan:3.2] Add audit redaction and role allow/deny tests in `backend/tests/test_shared_patterns.py` and `backend/tests/test_service_endpoints.py`.

### Phase 4: User Story 3 — reproducible backend and frontend tests

#### Step 4.1: [US3] Add guarded MySQL-backed API end-to-end tests
- **Requirements**: REQ-005, REQ-006
- **Design inputs**: `backend/services/identity/app.py`, `backend/services/common/database.py`,
  existing schema, and test client setup.
- **Description**: Add at least two multi-step HTTP flows against a real isolated MySQL test
  database. Use unique fictitious records and cleanup. Require `PEDIACARE_E2E=1` and a database
  name ending in `_test`; fail closed if either condition is missing. Do not count mocked tests as
  database E2E.

#### Step 4.2: [US3] Test role-dependent registration and browser behavior
- **Requirements**: REQ-005, REQ-007
- **Design inputs**: `frontend/src/components/RegisterPage.jsx`, current Vitest setup, and Playwright
  test server.
- **Description**: Add component tests for role-specific professional fields and invalid form
  feedback; add browser-level tests using fictitious data and intercepted API responses. Verify the
  browser test runner and install attempt independently of Docker.

**Tasks**
- [x] T008 [US3] [Plan:4.1] Add opt-in MySQL E2E fixtures and at least two multi-step identity API flows in `backend/tests/test_api_e2e.py`, with `_test` database guard and cleanup.
- [x] T009 [US3] [Plan:4.2] Add React Testing Library tests for role-specific registration fields and password mismatch feedback in `frontend/src/components/RegisterPage.test.jsx`.
- [x] T010 [US3] [Plan:4.2] Add a Playwright browser flow for role-dependent registration UI in `frontend/e2e/register.spec.js`, stubbing API traffic and using fictitious values.

### Phase 5: User Story 4 — complete delivery documentation and network evidence

#### Step 5.1: [US4] Document nursing need, responsibilities, patterns, roles, and approved exceptions
- **Requirements**: REQ-008, REQ-009
- **Design inputs**: Existing README files, architecture diagram, OpenAPI contract, and confirmed
  team approvals.
- **Description**: Explain the nursing problem and application response; identify service
  ownership; provide a role/permission matrix; describe where Factory, Strategy, and Observer are
  used, what they solve, and why they fit; document MySQL/five-member approvals and shared workload.

#### Step 5.2: [US4] Provide safe Wireshark procedure and TLS evidence
- **Requirements**: REQ-010
- **Design inputs**: Existing Vite HTTPS configuration and existing capture metadata.
- **Description**: Create a reproducible Windows-oriented guide for a fictitious API request through
  the HTTPS Vite endpoint, with a capture filter limited to the public TLS port. Verify protocol
  metadata only and ensure the evidence contains no real credentials or clinical data. Do not
  inspect or publish the existing cleartext capture.

**Tasks**
- [x] T011 [US4] [Plan:5.1] Update `README.md` and `backend/README.md` with the nursing need, service ownership, role matrix, pattern rationale, safe logging, migration usage, and professor-approved team/database exceptions.
- [x] T012 [US4] [Plan:5.2] Create `docs/wireshark-lab.md` with a safe TLS test procedure and add a new verified fictitious-data capture only if local capture tooling succeeds.

### Phase 6: Final verification

#### Step 6.1: [Cross-cutting] Run focused and repository-wide quality checks
- **Requirements**: REQ-001 through REQ-010
- **Design inputs**: All deliverables above.
- **Description**: Run migration/static checks, Python tests, canonical `npm test`, frontend build,
  and lint. Attempt the MySQL-backed E2E and Wireshark capture independently; report unavailable
  infrastructure as unverified, never as a pass.

**Tasks**
- [x] T013 [Plan:6.1] Run `python -m pytest backend/tests -q`, `npm test`, `npm run build`, and `npm run lint`; record results and any environmental gaps in the final response.
- [ ] T014 [Plan:6.1] Run the opt-in MySQL E2E flows against an isolated `_test` database; BLOCKED because no local MySQL service or Docker CLI is available. TLS capture was completed and verified under T012.

## Project Structure

```text
db/
  pedia_care.sql
  migrations/
    004_login_throttle.sql
backend/
  services/common/app.py
  tests/
    test_login_throttle.py
    test_api_e2e.py
    test_shared_patterns.py
    test_service_endpoints.py
frontend/
  src/components/RegisterPage.test.jsx
  e2e/register.spec.js
  package.json
docs/
  wireshark-lab.md
README.md
backend/README.md
.github/modernize/requisitos-pdf/
  constitution.md
  spec.md
  requirements-checklist.md
  plan.md
  checkpoints/
```

## Testing Strategy

- **appType**: Mixed Flask API + React single-page application.
- **Critical user journeys**:
  1. Invalid login attempts are recorded against hashed scopes; a locked scope receives HTTP 429.
  2. A tutor can access an in-scope patient and cannot access an out-of-scope patient.
  3. A fictitious parent account can register, log in, retrieve its current identity, and reject a duplicate registration against MySQL.
  4. The registration form changes fields by role and gives accessible feedback when passwords differ.
  5. A fictitious API request to the HTTPS frontend proxy produces TLS traffic without credentials or clinical data.
- **primaryValidationStack**: pytest for unit/API tests; a real MySQL test database for database E2E;
  Vitest + React Testing Library for component behavior; Playwright for browser behavior; root
  `npm test` as the canonical non-database suite.
- **fallbackMatrix**:
  - `infra-tier`: Docker-based MySQL is unavailable in this environment. Primary execution uses a
    manually provisioned local MySQL database named with `_test`; if none is available, database
    E2E remains **UNVERIFIED**. Flask tests with doubles may run but are not an E2E substitute.
  - `browser-tier`: Node.js 24.16.0 is available. Add Playwright and attempt Chromium installation.
    If browser installation fails, retain React Testing Library/API test results and report the
    browser tier as unverified; record the exact installation error.
- **Environment requirements**: Node.js/npm; Python 3.11 with `backend/requirements.txt`; a MySQL
  8 test database for opted-in DB E2E; Playwright Chromium for browser tests; Wireshark/dumpcap
  and loopback capture permission for TLS evidence. Docker is not a prerequisite when local MySQL
  is manually provisioned.
- **knownGaps**: No MySQL service was found and ports 3306/3307 were unreachable during planning.
  The `DB_NAME` schema in `db/pedia_care.sql` is fixed to `pedia_care`, so provisioning a test
  database must use an explicitly reviewed test-only schema import. The existing capture contains
  HTTP and MySQL protocol traffic with no TLS frames; it is not acceptable as TLS proof. The new
  local capture was verified as TLS-only on the filtered client-to-Vite port.
- **Test data strategy**: Generate a unique `@example.test` email per run; use synthetic names and
  values only. Database E2E requires `PEDIACARE_E2E=1` and `DB_NAME` ending `_test`; use a dedicated
  schema, delete only records created by the test, and fail closed on cleanup errors. Browser tests
  intercept API requests and do not persist data.
- **Acceptance criteria**: All unit, component, browser, build, and lint commands return exit code
  zero; two DB E2E flows pass if a guarded test database is available; otherwise DB E2E is reported
  as unverified. The TLS evidence task passes only if metadata confirms TLS and no plaintext
  credentials/clinical data are captured.
- **Validation review expectations**: Check test exit codes and counts; verify migrations against a
  test schema only; confirm the `_test` guard; inspect audit assertions without dumping captured
  sensitive values; verify capture protocol metadata, not payloads; do not claim unrun tests pass.
- **Legacy test assets**: Discovered Node tests and pytest tests are unit/route-level tests, and the
  frontend contains Vitest API-client tests. No existing browser E2E suite was found; there is no
  legacy E2E migration.
- **External dependency strategy**: MySQL is a real dependency only for explicitly enabled database
  E2E; no message broker or external API is used. Vitest tests mock the API module. Playwright tests
  intercept `/api/**` responses. Each Flask service gets startup/API smoke tests through its test
  client and OpenAPI route. Test execution is coordinated by root `npm test`; database E2E uses the
  explicit environment guard.

## Complexity Tracking

No constitution violations or additional production abstractions are planned.

## Requirement Mapping

| REQ ID | Description | Plan Items | Implementation Evidence |
|--------|-------------|------------|------------------------|
| REQ-001 | Fresh schema contains the login-throttle table | 2.1 | `db/pedia_care.sql` |
| REQ-002 | Existing databases receive a safe idempotent migration | 2.1 | `db/migrations/004_login_throttle.sql`, `backend/README.md` |
| REQ-003 | Lockout behavior and safe failed-login logging are tested | 2.2 | `backend/services/identity/app.py`, `backend/tests/test_login_throttle.py` |
| REQ-004 | Authenticated operations produce privacy-safe audit records | 3.1, 3.2 | `backend/services/common/app.py`, `backend/tests/test_shared_patterns.py` |
| REQ-005 | Backend has two guarded API E2E flows | 1.1, 4.1 | `backend/tests/test_api_e2e.py`, root `package.json` |
| REQ-006 | Auth, role access, validation, duplicate behavior use fictitious data | 2.2, 3.2, 4.1 | `backend/tests/test_login_throttle.py`, `backend/tests/test_service_endpoints.py`, `backend/tests/test_api_e2e.py` |
| REQ-007 | Frontend tests cover role-specific fields and invalid feedback | 1.1, 4.2 | `frontend/src/components/RegisterPage.test.jsx`, `frontend/e2e/register.spec.js` |
| REQ-008 | Nursing need, service responsibilities, roles, security, and patterns are documented | 5.1 | `README.md`, `backend/README.md` |
| REQ-009 | Approved MySQL/five-person exceptions and equitable workload are documented | 5.1 | `README.md` |
| REQ-010 | Safe Wireshark/TLS procedure and evidence are provided | 5.2 | `docs/wireshark-lab.md`, new TLS capture if local tooling permits |
