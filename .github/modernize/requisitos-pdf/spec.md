# Feature Specification: Completar requisitos del trabajo integrador

> Governed by: `./constitution.md` (principios acordados para esta implementación)

**Feature Branch**: `completion-pdf-requirements`  
**Created**: 2026-03-17  
**Status**: Draft for implementation  
**Input**: User request to restore the missing `login_throttle` database definition and implement the remaining applicable requirements from the Programming II assignment PDF.

## Scope Baseline

- **Discovery method**: Reviewed the three-page assignment PDF, the current README files, Flask services/tests, frontend test setup, MySQL schema, and the available Wireshark capture metadata.
- **Total items discovered**: Seven assignment sections, plus five suggested test scenarios and the delivery constraints.
- **Items in scope**: Outstanding or weakly evidenced database, security logging, backend/frontend testing, Wireshark evidence, and project documentation. Existing application features, Flask services, MySQL usage, React UI, login throttling logic, and the three implemented design patterns are preserved.
- **Approved deviations**: The professor has accepted MySQL instead of MongoDB and a five-person group instead of the PDF's four-person limit. The group contribution statement should describe an equitable shared workload, as requested by the user.
- **Evidence risk**: The existing capture was inspected only through protocol metadata. It contains HTTP and MySQL traffic and no TLS frames, so it does not demonstrate protected HTTPS traffic and must not be presented as TLS evidence. Do not inspect or publish its payloads; use fictitious data for any replacement capture.

## User Scenarios & Testing

### User Story 1 - A new or existing installation can use login throttling (Priority: P1)

As the person configuring PediaCare+, I need the database definitions required by the existing login lockout logic so that login attempts are counted and temporary blocks work consistently after a fresh install or an upgrade.

**Why this priority**: Without the table, the login endpoint can fail at runtime despite the throttling code being present.

**Independent Test**: Apply the initial schema to an empty MySQL test database and the migration to a pre-migration test database; in both cases verify the table shape and exercise a locked login through the API.

**Acceptance Scenarios**:

1. **Given** a fresh test database, **When** the initial schema is applied, **Then** the table required by login throttling exists with the columns and key used by the service.
2. **Given** an existing supported schema without the throttle table, **When** the numbered migration is applied, **Then** the table is created without deleting or rewriting application records.
3. **Given** an active lock for a fictitious account or IP, **When** that login is attempted, **Then** the API rejects it with the documented temporary-block response.

### User Story 2 - Access to patient data is accountable and role-limited (Priority: P1)

As a patient, tutor, or health professional, I need the backend to enforce and test role permissions while recording relevant authenticated access without putting credentials or clinical details in logs.

**Why this priority**: Patient records are sensitive, and hiding interface options alone does not enforce authorization.

**Independent Test**: Send permitted and forbidden API requests for each relevant role with fictitious users; inspect captured audit log records and confirm they contain no token, password, or clinical payload.

**Acceptance Scenarios**:

1. **Given** a tutor token, **When** the tutor requests a patient outside their scope, **Then** the backend denies access.
2. **Given** a professional role, **When** it requests an allowed operation, **Then** the backend returns the expected response; a disallowed operation is rejected.
3. **Given** an authenticated request, **When** the response is completed, **Then** the audit record identifies the actor, action/endpoint, and outcome without logging request bodies, tokens, passwords, or unnecessary clinical data.

### User Story 3 - The team can validate full backend flows and frontend behavior (Priority: P1)

As a developer or reviewer, I need reproducible tests for important API flows and React components so that authentication, authorization, validation, and role-based UI behavior can be checked before delivery.

**Why this priority**: The assignment explicitly requires backend unit tests, backend end-to-end tests, frontend tests, and fictitious test data.

**Independent Test**: Run the backend unit suite, at least two HTTP end-to-end flows against an isolated test database, and the React Testing Library or Jest suite.

**Acceptance Scenarios**:

1. **Given** a dedicated MySQL test database, **When** the backend E2E suite runs, **Then** at least two user-visible HTTP flows pass using fictitious records and cannot connect to a database not explicitly identified as a test database.
2. **Given** invalid or duplicate registration data, **When** the API receives it, **Then** validation rejects it without persisting an invalid account.
3. **Given** a React registration form, **When** the selected account role changes or invalid input is submitted, **Then** the component displays the correct role-specific fields and accessible validation feedback.

### User Story 4 - The submitted documentation explains the solution and its evidence (Priority: P2)

As an evaluator, I need the repository documentation to explain the nursing need, service ownership, permissions, security, design patterns, setup, and safe network-analysis evidence.

**Why this priority**: Complete documentation is a required deliverable and makes the implementation understandable and verifiable.

**Independent Test**: Check the README and linked documents against each required documentation topic, then follow the Wireshark lab with fictitious data and verify the evidence contains TLS rather than cleartext credentials or clinical information.

**Acceptance Scenarios**:

1. **Given** the README, **When** a reviewer looks for the nursing use case, services, role permissions, security, and design patterns, **Then** each is explained with its purpose and suitability.
2. **Given** the approved team composition, **When** the README describes contributions, **Then** it lists the five existing members and states that work was shared equitably without fabricating individual ownership.
3. **Given** a Wireshark capture, **When** it is submitted as evidence, **Then** it demonstrates the documented HTTPS/TLS test flow and contains only fictitious data with no exposed credentials, tokens, or real patient information.

### Edge Cases

- A migration is run more than once or against a schema that already has the throttle table.
- The database is unavailable or configured with a name that is not explicitly a test database when E2E tests are enabled.
- An authenticated request fails with a 4xx or 5xx response; the audit event must still avoid sensitive payloads.
- A request uses an invalid role, a patient outside the caller's scope, or duplicate account data.
- A capture contains unencrypted HTTP/MySQL traffic, credentials, or non-fictitious records; it must not be used as evidence or published.
- The professor-approved MySQL and five-member exceptions must be described as approvals, not represented as the literal wording of the original PDF.

## Requirements

### Functional Requirements

- **REQ-001**: The initial MySQL schema MUST create the `login_throttle` table with the fields, uniqueness, and indexes required by the existing login lockout implementation.
- **REQ-002**: A numbered, non-destructive migration MUST create the same table for existing installations, be safe to re-run, and be documented with a backup and application procedure.
- **REQ-003**: The backend MUST retain login lockout behavior for account and IP scopes, return a temporary-block response when a scope is locked, and log failed attempts without recording credentials or raw identifiers.
- **REQ-004**: Authenticated access to relevant API resources MUST produce an audit record containing a non-sensitive actor identifier, role, endpoint/action, HTTP method, and outcome; it MUST NOT include request bodies, authorization headers, passwords, tokens, or unnecessary clinical data.
- **REQ-005**: Backend tests MUST cover at least two independent unit-level behaviors and at least two HTTP end-to-end flows using fictitious data; end-to-end tests that use MySQL MUST be opt-in and refuse to run unless the configured database is explicitly a test database.
- **REQ-006**: Backend tests MUST include successful and denied role-based access, login throttling, input validation, and duplicate registration behavior without using real patient or account data.
- **REQ-007**: The frontend MUST include React component tests using React Testing Library or Jest, with coverage of role-dependent fields and at least one invalid-input or error-feedback behavior.
- **REQ-008**: Repository documentation MUST explain the nursing problem and solution, responsibilities of the three active services, the role/permission matrix, security measures, and at least three patterns with their location, the problem each solves, and why each is suitable.
- **REQ-009**: Repository documentation MUST describe the professor-approved MySQL and five-person exceptions and the user's requested equitable group workload without inventing individual contributions.
- **REQ-010**: Wireshark documentation MUST provide a reproducible procedure using fictitious data and explain observed protocols and protections; acceptable evidence MUST show the HTTPS/TLS flow without exposed credentials, tokens, or real clinical data.

### Key Entities

- **Throttle entry**: A hashed account/IP scope, number and start time of failed attempts, and optional temporary lock expiry.
- **Audit event**: A non-sensitive actor identifier and role, operation/endpoint, method, result status, and timestamp.
- **Test account and patient**: Synthetic identities and records restricted to automated test environments.
- **Team contribution statement**: The existing member list and a truthful statement that work was shared equitably.
- **Network evidence**: A capture and short explanation of a fictitious HTTPS/TLS scenario.

## Assumptions

- The professor's approval of MySQL and a maximum of five members is valid for this submission.
- The product remains an educational prototype; tests and demonstrations use only fictitious data.
- Existing Flask business behavior and API contracts should be preserved unless a focused failing test proves a change is required.
- A live MySQL server may not be available in the implementation environment. Database-backed E2E tests must be prepared safely, but their live execution result must be reported honestly.
- The existing `.pcapng` file is not acceptable as TLS evidence because protocol metadata shows HTTP and MySQL traffic with no TLS frames. Its packet payloads must not be examined or republished.

## Success Criteria

### Measurable Outcomes

- **SC-001**: Applying either the initial schema or the migration to its intended test setup produces the complete throttle table, and the login flow can read and write it.
- **SC-002**: At least two backend HTTP end-to-end flows and at least two meaningful React component tests pass using fictitious data.
- **SC-003**: All tested role/permission cases return the expected allow/deny result, including one request that is denied for out-of-scope patient access.
- **SC-004**: Audit logs identify authenticated operations while tests confirm that tokens, passwords, request bodies, and clinical payloads are absent.
- **SC-005**: The README and linked documentation cover all required delivery topics; the five-person group and MySQL are identified as professor-approved exceptions.
- **SC-006**: Any capture submitted as security evidence shows the documented TLS-protected flow and contains no credentials, tokens, or real patient data.
