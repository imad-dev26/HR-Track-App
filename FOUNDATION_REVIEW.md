FOUNDATION LAYER REVIEW — HR Track

Purpose
-------
This review analyzes the foundation layer (authentication, DB access, audit logging, permission enforcement) using the project architecture and schema documents and the current codebase on the development branch.

This is analysis-only: no files are modified.

Sources consulted (read-only)
- PROJECT_ARCHITECTURE.md (/Users/mac/Projects/HR-Track-App/PROJECT_ARCHITECTURE.md)
- DATABASE_SCHEMA.md (/Users/mac/Projects/HR-Track-App/DATABASE_SCHEMA.md)
- ARCHITECTURAL_REVIEW.md (repo: /Users/mac/Projects/HR-Track-App.worktrees/development-branch-initiation/ARCHITECTURAL_REVIEW.md)
- Codebase (development branch): key files under /src and /src-tauri

Scope
-----
Analyze current implementation, problems found, exact files requiring modification to implement a secure foundation, and recommended implementation order (no code changes in this task).

1) Authentication system
-----------------------
Current implementation (what exists now)
- DB schema: users table exists in migrations (migrations/008_system_tables.sql and seed in 010_seed_defaults.sql) with fields id, username, password_hash, role, active, timestamps.
- Frontend login UI: src/pages/Login.tsx implements a login form and calls the database select helper:
  - It runs: SELECT id, username, role, display_name FROM users WHERE username = ? AND active = 1
  - If a row exists, it calls login(user) on the local auth store and navigates to "/".
- Frontend auth store: src/store/authStore.ts stores user object, isAuthenticated flag and role in a client-side Zustand store.

Problems found
- No password verification: Login.tsx never verifies the entered password against password_hash (no bcrypt verification). This means any username will log in without a password check if present in the users table.
- Authentication happens entirely in the renderer process: the renderer is calling select() directly to fetch user rows; password verification and session handling should be done in a secure boundary (Tauri backend) but currently are done (or not done) purely client-side.
- Session persistence and security: authStore holds user in memory; no secure session token or server-side session is established. Renderer-level state is vulnerable to tampering and does not persist across app restarts securely.

Exact files needing modification (authentication)
- src/pages/Login.tsx — add secure login flow that verifies password via a trusted backend (Tauri command) that performs bcrypt compare.
- src/store/authStore.ts — expand to store minimal session state (token or server-side session id) and provide secure logout, refresh, and clearing on app exit.
- migrations/010_seed_defaults.sql — replace placeholder password hash handling with clear guidance (ensure seed default does not ship with insecure placeholder in production). (If not modify code, note for developers.)
- src/lib/database.ts — currently the renderer can run raw SELECTs/EXECUTEs; for authentication we must stop using raw selects for the user's password-related checks in the renderer and instead call a backend auth command. So this file will be modified to either proxy all DB access through backend commands or split read-only vs write paths.
- src-tauri/src/main.rs and (new) src-tauri/src/auth.rs or src-tauri/src/api.rs — add a Tauri command to verify username/password with bcrypt and create a secure session context.

2) Database access layer
------------------------
Current implementation (what exists now)
- Frontend database adapter: src/lib/database.ts uses @tauri-apps/plugin-sql Database.load("sqlite:hrtrack.db") and exposes select/execute/executeTransaction functions. This calls the plugin's .select and .execute from renderer.
- Tauri backend registers the plugin in src-tauri/src/main.rs and supplies the migrations to be applied on startup.
- Rust side has database helpers: src-tauri/src/database.rs with open_connection and get_db_path; migrations are managed via tauri-plugin-sql.

Problems found
- Arbitrary SQL execution from renderer: Because src/lib/database.ts loads plugin-sql directly in the renderer, any component can run arbitrary SQL (including writes), making it easy to bypass permissions or audit logging.
- Lack of controlled API boundary: There is no centralized, audited, and permission-checked set of DB commands. Mutating statements are executed directly from renderer (execute) in some code paths (Administration.tsx uses execute for update and other pages likely do the same via forms), which makes enforcement difficult.
- Inconsistent use of transactions: executeTransaction exists but is not guaranteed to be used consistently across all write flows.
- Server-side business logic absence: Business rules and data validation happen mostly in UI code; relying on frontend validation is unsafe for integrity.

Exact files needing modification (DB access layer)
- src/lib/database.ts — redesign as a secure client that only calls backend Tauri commands instead of directly loading plugin-sql in the renderer. Provide read-only helper (if safe) and ensure all mutating operations go through audited backend commands.
- All frontend files that import and call select/execute directly must be updated to use the new API. Key pages identified (examples):
  - src/pages/Administration.tsx (uses execute)
  - src/pages/Personnel.tsx
  - src/pages/Contrats.tsx
  - src/pages/Conges.tsx
  - src/pages/Medical.tsx
  - src/pages/Discipline.tsx
  - src/pages/Formation.tsx
  - src/pages/Accidents.tsx
  - src/pages/Dashboard.tsx
  - src/pages/Organisation.tsx
  - src/pages/Notifications.tsx
  (Note: many of these use select; all write-capable pages will need to be examined and their write paths modified to call backend write API.)
- src-tauri/src/main.rs — add registration of dedicated Tauri commands (API endpoints) for read/write operations or modify plugin usage to restrict direct access from renderer. Prefer adding commands and then refactoring renderer to use them.
- src-tauri/src/database.rs — extend with secure helper functions that accept parameterized queries for backend use, and ensure PRAGMA settings and connection safety are enforced.

3) Audit logging
----------------
Current implementation (what exists now)
- Schema: migrations/008_system_tables.sql defines an audit_log table and indexes.
- Migrations also seed a default admin user (010_seed_defaults.sql).

Problems found
- No audit write path: There is no code in the renderer or Rust backend that writes to audit_log. Grep found no insert/insert into audit_log or calls to log functions.
- No centralized point to record old_value/new_value: Mutating operations executed directly in renderer are not capturing prior row states to insert into audit_log.
- Audit can be bypassed: With renderer performing SQL directly, audit logging implemented in backend would be bypassed unless mutations are forced to go through audited backend commands.

Exact files needing modification (audit)
- src-tauri/src/main.rs — add or enable a backend audit mechanism and Tauri commands for mutating DB operations so audit entries can be created centrally.
- src-tauri/src/database.rs — add helper functions to capture previous row state (SELECT before UPDATE/DELETE) and insert audit_log entries in the same transaction as the mutation.
- src/lib/database.ts — refactor to avoid direct execution of mutating SQL in renderer and switch writes to backend commands that will perform audit logging. All frontend components that previously executed writes must be updated to call these commands.
- All frontend modules that perform mutating operations (see DB access list above) — update call sites so that any create/update/delete goes through the backend API which will record audit_log.

4) Permission enforcement (RBAC)
-------------------------------
Current implementation (what exists now)
- UI-level permissions: src/lib/permissions.ts defines PERMISSIONS and ROLE_PERMISSIONS for Admin and Guest, and helper functions hasPermission, canModify, canViewMedicalDetails. Many pages call canModify(role, module) to hide/show actions.
- users table in DB has a role column and migrations seed an Admin user.

Problems found
- UI-only enforcement: Permissions are enforced in renderer for display and enabling/disabling controls, but there is no enforcement at the backend/DB layer. If an attacker or a modified renderer calls SQL directly, or if the renderer is exploited, permissions can be bypassed.
- No session-bound user identity in backend: Because renderer runs queries directly, the backend does not have an authoritative current_user context to check against ROLE_PERMISSIONS.
- Permissions mapping duplication risk: Current role/permission logic lives in frontend TypeScript; duplicating or mirroring these checks in Rust will be necessary for secure enforcement.

Exact files needing modification (permissions)
- src/lib/permissions.ts — keep as UI-helper but ensure canonical permission set is defined centrally (either ported to Rust or exported to a shared source used by backend enforcement).
- src/store/authStore.ts — ensure that after login, a session token or server-side session context is created and that subsequent backend calls include an authenticated identity for permission checks.
- src/lib/database.ts — change to call backend commands that supply session identity on each call (or the backend consults a session store).
- src-tauri/src/main.rs and new backend command modules (e.g., src-tauri/src/api.rs, src-tauri/src/auth.rs) — implement server-side permission checks that map roles to allowed modules/actions and reject unauthorized mutating requests.

Recommended implementation order (step-by-step)
-----------------------------------------------
Rationale: implement in an order that minimizes exposure (fastest to secure vulnerable paths) and establishes a clean API boundary before updating many front-end modules.

Preparation (quick discovery)
1. Inventory all write paths in the frontend: run a grep (INSERT/UPDATE/DELETE/execute/executeTransaction) and produce a list of components that perform writes. (Partial list provided above.) This helps estimate work and avoid missing write paths.

Phase A — Establish secure authentication boundary (small blast radius)
A1. Implement backend auth command
    - Add a new Tauri command (e.g., `auth_login`) in src-tauri that accepts username and password, looks up the user by username server-side, runs bcrypt password verification (use a Rust bcrypt crate), and returns a session token (JWT-like or server-session id). Store the session in a server-side session store (in-memory with file persistence or DB-based sessions table).
    - Files to modify/add: src-tauri/src/main.rs (register command), add src-tauri/src/auth.rs (implement login, logout, session verification helpers), possibly add src-tauri/src/session.rs.
A2. Update frontend login flow
    - Modify src/pages/Login.tsx to call the `auth_login` command via the Tauri invoke bridge (or via a new client helper) rather than selecting users directly. On success, store session token in authStore (not raw password) and mark isAuthenticated.
    - Files to modify: src/pages/Login.tsx, src/store/authStore.ts (store token, user id, role), src/lib/database.ts (if it automatically attaches session to calls).

Phase B — Create a controlled DB API and disable direct renderer writes
B1. Design backend DB API
    - Implement backend Tauri commands for DB operations. Minimum set:
      - read/query(command): parameterized SELECT queries for read-only operations (optionally allow renderer read directly but consider routing to backend for auditing reasons)
      - write/exec(command): internal API for CREATE/UPDATE/DELETE that requires session identity and performs permission checks and audit logging
      - transaction_exec(statements): accept multiple statements and run them in a single transaction, capturing pre-state and writing audit entries in same transaction
    - Files to modify/add: src-tauri/src/main.rs (register commands), add src-tauri/src/api.rs or src-tauri/src/db_api.rs with handlers, enhance src-tauri/src/database.rs for helper functions.
B2. Implement server-side permission checks
    - Implement RBAC logic in Rust, ideally reusing the same permission definitions used by frontend or converting ROLE_PERMISSIONS table into DB table and loading it.
    - Files to modify/add: src-tauri/src/auth.rs (session check), src-tauri/src/permissions.rs (new), DB seeding/migrations may be updated to include permission config (optional).
B3. Implement audit logging at backend
    - For every write operation, the backend should: begin transaction; capture old_value(s) using SELECT(s) where applicable; perform mutation; insert audit_log entries (user_id, action, table_name, record_id, old_value, new_value, timestamp); commit transaction. If any step fails, rollback.
    - Files to modify/add: src-tauri/src/database.rs (helpers), src-tauri/src/api.rs (write paths use helpers).
B4. Refactor frontend DB adapter
    - Modify src/lib/database.ts to stop calling Database.load in renderer for mutating operations. The module should expose wrappers that invoke backend commands (via window.__TAURI__.invoke). Optionally, read-only selects can still use Database.load if deemed safe, but to centralize audit and RBAC it's recommended to route much of DB access through backend commands.

Phase C — Migrate frontend codepaths
C1. Update frontend pages
    - Replace direct calls to execute/executeTransaction with calls to the new API. Update all pages identified during inventory that perform writes (Administration, Personnel create/edit/delete, Contrats create/edit, Conges create/edit, Medical create/edit, Discipline create/edit, etc.).
C2. Harden client-side validation
    - Add a validation layer (Zod or equivalent) before invoking backend APIs to give good UX but never rely on it for security.

Phase D — Testing, CI and hardening
D1. Add integration tests that run migrations against a temp DB and exercise auth flows, protected write ops, and audit log creation.
D2. Add unit tests for permission enforcement (attempt write as Guest and assert rejection) and for audit_log entries created on operations.
D3. Review and remove any remaining direct Database.load usage in renderer or lock it to read-only if necessary.

Phase E — Optional/Follow-up
- Consider moving permission definitions into DB or a canonical shared config so frontend and backend derive permissions from the same source.
- Implement session expiration, refresh, and secure storage for persistent login (encrypted storage in Tauri environment).

Notes and security considerations
- Do not keep placeholder password hashes in production seeds; require admin to set a password on first run.
- Parameterize every SQL query; never interpolate user input into SQL strings in either renderer or backend (use prepared statements / bound parameters).
- Treat the renderer as an untrusted client: do not trust client-side checks for enforcement.
- Audit logs must be tamper-evident: consider write-once append semantics or storing cryptographic hashes of audit entries for stronger guarantees (optional advanced improvement).

Appendix — Exact files & directories referenced (summary)
- Frontend to modify:
  - src/pages/Login.tsx
  - src/store/authStore.ts
  - src/lib/database.ts
  - src/lib/permissions.ts (for mapping and potential canonicalization)
  - src/pages/Administration.tsx
  - src/pages/Personnel.tsx
  - src/pages/Contrats.tsx
  - src/pages/Conges.tsx
  - src/pages/Medical.tsx
  - src/pages/Discipline.tsx
  - src/pages/Formation.tsx
  - src/pages/Accidents.tsx
  - src/pages/Dashboard.tsx
  - src/pages/Organisation.tsx
  - src/pages/Notifications.tsx
  - plus any components or utility files that call select/execute directly

- Backend (Tauri/Rust) to modify/add:
  - src-tauri/src/main.rs (registering commands)
  - src-tauri/src/database.rs (add helpers: safe_exec, exec_with_audit, fetch_prev_state)
  - src-tauri/src/migrations.rs (verify/extend to support audit tables/_migrations, already present)
  - add new modules: src-tauri/src/auth.rs, src-tauri/src/api.rs (or db_api.rs), src-tauri/src/permissions.rs, src-tauri/src/session.rs (suggested names)

Estimated minimal implementation milestones & rough effort
- Implement backend auth + login command + update Login UI: 1–3 days (small team) — critical
- Implement backend write API and audit logging + update DB adapter to route through it: 1–2 weeks
- Migrate frontend write paths to new API and add tests: 1–2 weeks
- Add CI verification of migrations and auth/audit integration tests: 2–4 days

Conclusion
----------
The repository contains the key architectural components (Tauri, plugin-sql, migrations, frontend pages and permissions matrix). The primary risk is the current renderer-level direct DB access combined with missing password verification and lack of backend-enforced RBAC and auditing. The top priority is to move authentication and mutation operations into a trusted backend boundary (Tauri commands), implement audit logging there, and then refactor the frontend to use that API — all while adding tests to prevent regressions.

Prepared on development branch from the listed project files and repository code (read-only analysis).
