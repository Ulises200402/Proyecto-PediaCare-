<!--
Sync Impact Report
Version change: none -> 1.0.0 (initial project-specific constitution for this delivery).
Modified principles: none.
Added sections: five core principles, additional constraints, development workflow, governance.
Removed sections: target technology stack (UPGRADE mode; the existing stack is retained).
Templates requiring updates: implementation plan Constitution Check (pending); feature specification (checked); task template (pending).
Follow-up TODOs: confirm the formal ratification date with the project team.
-->

# PediaCare+ Delivery Constitution

## Migration Mode

**Mode**: UPGRADE

**Justification**: This work completes requirements in the existing PediaCare+ repository. It preserves
the current product, API contract, React interface, Flask services, and approved MySQL database.

## Core Principles

### I. Preserve Existing Behavior

Changes MUST be limited to the approved requirement gaps and preserve existing user-facing behavior,
API contracts, and stored data. Database changes MUST be additive and non-destructive; existing
records MUST NOT be dropped or rewritten by a migration.

### II. Protect Patient and Account Data

Tests and demonstrations MUST use fictitious data. Logs MUST NOT contain passwords, tokens,
authorization headers, request bodies, or unnecessary clinical information. Every protected action
MUST be authorized by the backend, regardless of frontend visibility.

### III. Verify Behavior with Tests

Each behavior change MUST have a focused regression test. Backend and frontend tests MUST use
deterministic fictitious data. Any database-backed end-to-end test MUST require an explicit opt-in
and refuse to connect unless the configured database is clearly a test database.

### IV. Keep Changes Traceable and Understandable

Every implementation task MUST map to one or more specification requirements. Documentation MUST
explain the relevant user need, service ownership, permissions, security controls, and design-pattern
choices in terms that reviewers can verify against the code.

### V. Prefer Small, Reliable Changes

Use the repository's existing patterns and dependencies where practical. Add abstractions or
dependencies only when they directly enable a requirement. Errors and unverified evidence MUST be
reported accurately rather than represented as successful completion.

## Additional Constraints

- MySQL is approved by the professor in place of MongoDB for this project.
- A five-person team is approved by the professor despite the original PDF's four-person limit.
- The team contribution statement MUST describe equitable shared work and MUST NOT invent individual
  assignments.
- The product is an educational prototype and MUST NOT be used with real patient information.
- A network capture is acceptable as security evidence only when it uses fictitious data and
  demonstrates the documented HTTPS/TLS flow without exposing credentials or clinical information.

## Development Workflow

- Review the relevant source, tests, and current documentation before changing behavior.
- Add or update focused tests with implementation changes; run the narrowest relevant test first.
- Run the repository's build, lint, and test commands after coherent changes.
- Apply schema updates only to a new or explicitly selected test database during validation.
- Report skipped database-backed tests and missing Wireshark evidence explicitly.

## Governance

This constitution governs the requirement-completion work described by the linked feature
specification. Amendments require a documented rationale, explicit agreement from the project team,
and an update to the semantic version and last-amended date. MINOR increments add or materially
change a principle; PATCH clarifies wording without changing obligations; MAJOR changes or removes
an existing obligation. Reviews MUST check requirement traceability, test evidence, data safety, and
documentation consistency. Approval of MySQL and five team members is recorded as a project-specific
exception to the original assignment, not as a change to the assignment itself.

**Version**: 1.0.0 | **Ratified**: TODO(RATIFICATION_DATE): confirm with the project team | **Last Amended**: 2026-11-13
