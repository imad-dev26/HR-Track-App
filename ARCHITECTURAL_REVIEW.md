# ARCHITECTURAL REVIEW: HR TRACK APPLICATION

**Date:** August 12, 2026  
**Status:** Foundation Phase - Pre-Production Review

---

## EXECUTIVE SUMMARY

The HR Track application is currently in **prototype/proof-of-concept stage** with significant gaps between documented architecture and actual implementation:

| Aspect | Target | Current | Gap |
|--------|--------|---------|-----|
| **Frontend** | React + TypeScript | Vanilla JavaScript (React structure built but not integrated) | 🔴 Critical |
| **Desktop** | Tauri desktop app | Web-only (no Tauri build) | 🔴 Critical |
| **Database** | SQLite (offline-first) | Browser localStorage (5-10MB limit) | 🔴 Critical |
| **Authentication** | Admin/Guest roles | None implemented | 🔴 Critical |
| **Multi-user** | Supported | Single-user only | 🔴 Critical |

**Verdict:** Application compiles and runs but **NOT PRODUCTION-READY** for enterprise HR deployment.

---

## 1. ARCHITECTURE SUITABILITY

### Current Architecture Problems

#### 1.1 **Incomplete Technology Stack Implementation**
- **React/TypeScript:** Properly configured (package.json, vite.config.ts, tsconfig.json exist) but **NOT used** in actual application
- **Tauri:** Only dependencies installed, no desktop build configured
- **SQLite:** Database schema designed (DATABASE_SCHEMA.md) but only 10 migration files exist with no implementation
- **Current Reality:** The application is a single-page vanilla JavaScript app using browser localStorage

#### 1.2 **Storage Architecture Issues**

| Issue | Impact | Severity |
|-------|--------|----------|
| localStorage limit (5-10MB) | Cannot handle >50 employees with history | 🔴 Critical |
| Single-browser only | No multi-user access, no shared data | 🔴 Critical |
| Manual CSV export backup | No automatic persistence, data loss risk | 🔴 Critical |
| No sync mechanism | Locked into offline forever | 🟠 High |

#### 1.3 **Frontend Architecture Issues**
- No component structure (React not used despite being configured)
- All DOM manipulation in single app.js file (101 lines mixed logic + UI)
- No separation of concerns (data layer, business logic, UI rendering)
- Hard to extend for HR modules (will require rewriting from scratch)

### For Long-Term HR Application: ❌ NOT SUITABLE

**Reasons:**
1. Cannot scale to enterprise employee counts (currently ~300 employees)
2. No support for multiple users/roles
3. No audit trail for HR compliance
4. Cannot sync data between devices
5. No backup/recovery mechanism

---

## 2. DATABASE DESIGN PROBLEMS

### Current State
- **localStorage** only: `rhtrack-v2-employees` and `rhtrack-v2-absences` JSON keys
- Documented SQLite schema exists but **not implemented**
- No actual database enforcing constraints or relationships

### Documented Schema Assessment

#### Good Design Choices ✓
- Proper normalization (separate tables for status types, leave types, etc.)
- Employee ID separation (matricule for HR, internal ID for relations)
- Comprehensive history tracking (career, service, status)
- Audit logging table for compliance
- Configurable lookup tables (contract types, leave types, categories)

#### Critical Gaps ✗

| Problem | Impact | Details |
|---------|--------|---------|
| **No Foreign Keys** | Data corruption, orphaned records | Schema has relationships but no constraints defined |
| **Missing Indexes** | O(n) searches with 1000+ employees | Matricule, employee_id, dates need indexing |
| **History Table Inconsistency** | Cannot track individual field changes | career_history mixes function + level + category in one row |
| **Medical Privacy** | GDPR/Compliance risk | No encryption, field-level access control undefined |
| **Leave Accrual Rules** | Incorrect balance calculations | Schema doesn't model accrual rates, caps, carryover rules |
| **No Business Rule Enforcement** | Invalid data allowed | "Sûreté Interne only CDD" has no CHECK constraint |

### Specific Schema Issues

#### 2.1 **Leave Balance Calculation**
```
Current schema has:
- recovery_balance (current balance)
- recovery_history (additions/consumption)

Missing:
- Accrual schedule (1.75 days/month for staff? 2.25 for management?)
- Maximum cap (40 days? 50 days?)
- Carryover rules (use-it-or-lose-it, partial carryover, etc.)
- Fiscal year configuration
- Leave type-specific limits (some leaves uncapped, some capped)
- Last update timestamp

HR Example: French labor law = 50% annual leave must be used in year, 50% can carry
Current schema cannot model this.
```

#### 2.2 **Medical Records**
```
Schema states: "Guest users cannot see details"
But there's NO implementation of:
- Database-level encryption for sensitive fields
- Field-level access control
- Row-level security rules
- Audit logging of access

Risk: Guest users will see all medical data in current implementation
```

#### 2.3 **Discipline Records**
```
Table has:
- id, employee_id, action_type, date, description, duration_days

Missing:
- Appeal/review process tracking
- Decision maker ID
- Outcome (sustained, overturned, modified)
- Related medical records (some disciplines require medical assessment)
- Follow-up actions
- Status tracking (pending, approved, appealed, resolved)
```

#### 2.4 **Function-Service Relationship**
```
Schema has function_services junction table (functions can exist in multiple services)
But app.js doesn't track this relationship
When employee changes service, unclear if function is still valid
No validation rule exists
```

### Missing HR Data Models

| HR Feature | Schema Coverage | Status |
|-----------|---|---|
| Salary/Compensation | None | ❌ Not modeled |
| Position/Grade progression | Partial (has functions, no grades) | ⚠️ Incomplete |
| Family/Emergency contacts | Partial (has num_children, no details) | ⚠️ Incomplete |
| Training & Certifications | Partial (no expiration, cost, provider) | ⚠️ Incomplete |
| Benefits | None | ❌ Not modeled |
| Performance management | None | ❌ Not modeled |

---

## 3. SCALABILITY ISSUES

### 3.1 **Storage Limits**

| Metric | localStorage | Needed | Status |
|--------|------|--------|---|
| **Capacity** | 5-10 MB | ~50+ MB for 500 employees with history | 🔴 Insufficient |
| **Example:** 500 employees + 20 years history | | ~25-30MB | 🔴 Exceeds limit |
| **Concurrent access** | Single browser only | Multi-user | 🔴 Blocked |
| **Synchronous** | Blocks UI on save | Should be async | ⚠️ Performance risk |

### 3.2 **Query Performance Issues**

#### O(n) Linear Searches
```javascript
// app.js line 23 - Called repeatedly
const employeeByMatricule = m => employees.find(e => e.matricule === m);

// With 1000 employees: ~1000 iterations per query
// Called in: renderAbsences (line 61), historyModal (line 92), renderDashboard (line 42)
// Result: 1000 absences × 1000 employee searches = 1,000,000 comparisons per render
```

#### No Pagination
```javascript
// app.js line 54 - Renders entire list at once
$('#employee-table').innerHTML = list.map(e => ...).join('')

// Browser must render 1000+ employee rows
// No virtual scrolling, no lazy loading
```

#### Repeated Array Operations
```javascript
// app.js line 43 - On every dashboard render
const movements = employees.flatMap(e => (e.events || []).map(...))
                           .sort(...).slice(0,6);

// O(n log n) sort of ALL history every render
// Should cache or paginate
```

### 3.3 **Data Consistency Issues**

```javascript
// app.js line 80 - Direct mutation, no transaction support
e.fonction = d.fonction;
e.service = d.service;
e.events.push({...});  // If this fails, previous changes already applied

// No rollback mechanism if save fails
// No atomic transactions
```

### 3.4 **Audit Trail Growth**
- Schema defines multiple history tables: employee_status_history, career_history, service_history, recovery_history
- **No retention policy:** 20-year employee = 40 status changes/year × 20 = 800 records × 1000 employees = 800,000+ records
- **No archival strategy:** Historical queries will be slow
- **No indexing plan:** No date range indexes for historical reports

---

## 4. SECURITY CONCERNS

### 🔴 CRITICAL: No Authentication or Authorization

#### 4.1 **Authentication**
- ❌ No login system
- ❌ No user accounts
- ❌ No password management
- ❌ No session tracking
- ❌ All data visible to anyone who opens browser

**Schema documents (DATABASE_SCHEMA.md line 248-252):** `users` table with roles (Admin/Guest) **NOT IMPLEMENTED**

#### 4.2 **Authorization / Access Control**

Schema documents:
```
Admin: Full access, configuration, import/export, medical details
Guest: View only, limited dashboard, no modifications
```

**Current implementation:** ❌ ZERO access control

```javascript
// app.js line 76 - Anyone can add employee
employees.unshift({id:uid(),...d,status:'Actif',...});

// app.js line 80 - Anyone can modify position
e.fonction = d.fonction;

// app.js line 89 - Anyone can add absence
absences.unshift({id:uid(),matricule,...});

// No permission checks anywhere
```

**Risk:** HR assistant could:
- Modify employee names, national IDs
- Change contracts, functions, services
- Add/remove absences for payroll manipulation
- Access medical records

#### 4.3 **Medical Data Exposure**

Schema requires: Guest users cannot see medical details  
**Current problem:**
1. No database-level encryption
2. All fields in localStorage = plain text
3. No field-level masking
4. All users see everything

**Compliance Risk:** GDPR (EU), CCPA (US), or local privacy laws violated

#### 4.4 **SQL Injection Risk** (When SQLite Added)

```javascript
// app.js line 82 - User input in strings
detail:`${old} → ${d.fonction} · ${d.service}${d.note?` — ${d.note}`:''}`,

// When converted to SQL queries, MUST use parameterized queries
// Current approach unsafe for: employee names, notes, discipline descriptions
```

#### 4.5 **CSV Import Vulnerability**

```javascript
// app.js line 100 - No data validation
const parsed = rows.map(l => l.split(delimiter).map(x => x.replace(/^"|"$/g,'').trim()))
                   .filter(r => r[0]);

employees = parsed.map(r => ({
  id: uid(),
  matricule: r[0],
  nom: r[1],
  // No validation of:
  // - Duplicate matricules (allow multiple employees with same ID)
  // - Valid dates (garbage data accepted)
  // - Required fields (could import partial records)
  // - Data types (string where number expected)
}));
```

**Risks:**
- Duplicate employee entries
- Invalid dates in database
- Data corruption from malformed CSV
- Audit trail missing (who imported, when)

#### 4.6 **No Audit Logging**

Schema (DATABASE_SCHEMA.md line 256-261) defines audit_log table:
```sql
Fields: id, user_id, action, table_name, old_value, new_value, date
```

**Current state:** NOT IMPLEMENTED
- No tracking of who changed what
- No timestamps on modifications
- No way to recover deleted records
- Cannot comply with HR audit requirements (France: 3-year retention required)

---

## 5. CRITICAL BLOCKING ISSUES

### Issues That Must Be Fixed Before Adding HR Modules

| Issue | Severity | Impact | Effort |
|-------|----------|--------|--------|
| **No Database** | 🔴 CRITICAL | Cannot handle >50 employees, no multi-user | 2-3 weeks |
| **No Authentication** | 🔴 CRITICAL | Cannot enforce permissions, security risk | 1-2 weeks |
| **No Authorization** | 🔴 CRITICAL | All users see all data (medical records exposed) | 1 week |
| **No Validation** | 🔴 CRITICAL | Data corruption from invalid imports | 3 days |
| **O(n) Query Problems** | 🔴 CRITICAL | Will crawl with 500+ employees | 1 week |
| **No Sync Strategy** | 🟠 HIGH | Local-only forever or sync later? | 2 weeks |
| **No Audit Trail** | 🟠 HIGH | Cannot comply with regulations | 1 week |
| **Monolithic Code** | 🟠 HIGH | Cannot add modules without rewriting | 2 weeks |

### Architectural Decisions Needed

#### 1. **Offline-First vs Cloud Sync**
- **Question:** Pure offline application or sync to cloud later?
- **Current:** Locked into localStorage, no sync mechanism
- **Decision:** Design persistence layer to support sync in future (even if not implemented now)

#### 2. **Desktop vs Web Deployment**
- **Documented:** Tauri desktop app
- **Current:** Neither implemented
- **Decision:** Commit to Tauri + desktop OR switch to web-only; plan accordingly

#### 3. **Database Implementation**
- **Documented:** SQLite
- **Problem:** SQLite in browser requires WASM (complex); backend needs different approach
- **Decision:** Use `better-sqlite3` (Node.js) + Tauri, or local backend with API, or Electron + SQLite

#### 4. **Multi-User Architecture**
- **Documented:** Admin/Guest roles
- **Current:** No sync mechanism
- **Decision:** Cloud sync (requires backend), local network sync, or single-user only?

---

## 6. MISSING CORE UTILITIES (Required Before Modularity)

These must be built before adding HR modules (personnel, contracts, leaves, medical, discipline, etc.):

### 6.1 **Data Validation Framework**
```javascript
// Current state: app.js has ZERO validation
// Needed: Validation framework for all modules

// Should support:
- Schema validation (required fields, types, format)
- Business rule validation (date ranges, unique constraints)
- HR-specific rules (Sûreté Interne only CDD, etc.)
- Cross-field validation (end_date > start_date)
- Custom validators for domain rules
```

### 6.2 **Date Handling Utilities**
```javascript
// Current: Fragile date formatting (app.js line 4)
// Needed: Comprehensive date utilities

// Should support:
- Date range validation
- Fiscal year calculations (varies by country)
- Age calculations (for retirement, benefits)
- Leave year calculations (not always calendar year)
- Date formatting (multiple locales, formats)
```

### 6.3 **Business Rule Engine**
```javascript
// Current: No way to encode rules
// Example: "Sûreté Interne accepts only CDD contracts"
// Should support:
- Service-specific contract type restrictions
- Category-specific leave accrual rates
- Function-level constraints
- Retirement age rules (varies by role in France)
- Medical restriction categories
```

### 6.4 **Query/Filter Abstraction**
```javascript
// Current: Direct array operations
// When SQLite added, need query builder

// Should support:
- Filter syntax (field, operator, value)
- Sorting (multiple fields, directions)
- Pagination (offset, limit)
- Aggregation (count, sum, average)
- Efficient database queries
```

### 6.5 **State Management**
```javascript
// Current: Global variables (let employees, let absences)
// Problems:
- Cannot track changes
- No undo/redo
- No transaction support
- Hard to test
- No state history

// Needed: Centralized state management (Redux, Zustand, MobX)
```

---

## 7. RECOMMENDED FIXES (Priority Order)

### Phase 1: Foundation (Weeks 1-3) - BLOCKING FOR ALL OTHER WORK

- [ ] **Setup proper React + TypeScript integration**
  - Current React config exists but not used
  - Must refactor app.js into React components

- [ ] **Implement validation framework**
  - Create schema validation (Zod, Yup, or custom)
  - Add business rule validators
  - Validate all data before save

- [ ] **Add localStorage abstraction layer**
  - Create repository pattern (can swap SQLite later)
  - Support transactions (even if localStorage can't enforce them)
  - Prepare for SQLite migration

- [ ] **Implement basic authentication** (local storage for now)
  - Simple login/logout
  - User accounts with passwords (bcrypt hash)
  - Session management
  - Prepare for role-based access control

### Phase 2: Database & Authorization (Weeks 4-6)

- [ ] **Implement SQLite with proper schema**
  - Create Tauri SQLite backend or Node.js persistence
  - Add foreign key constraints
  - Add indexes (matricule, dates, employee_id)
  - Implement audit logging

- [ ] **Implement role-based access control (RBAC)**
  - Admin: Full access
  - Guest: Read-only, no medical records
  - Field-level permissions for sensitive data

- [ ] **Add CSV import validation**
  - Check duplicates
  - Validate data types and ranges
  - Require mandatory fields
  - Audit trail (who imported, when)

- [ ] **Build data validation rules**
  - Mandatory fields (matricule, nom, prenom, date_naissance)
  - Contract rules (Sûreté Interne = CDD only)
  - Date validations
  - Medical restrictions

### Phase 3: Performance & Quality (Weeks 7-8)

- [ ] **Fix O(n) search problems**
  - Index matricule field
  - Build hash map for fast lookup (or use database indexes)
  - Add pagination to UI

- [ ] **Refactor monolithic code**
  - Separate concerns: data layer, business logic, UI
  - Create modules for: employees, contracts, leaves, medical, discipline
  - Build reusable components

- [ ] **Implement audit logging**
  - Track all changes (who, what, when)
  - Implement data retention policy (3 years)
  - Create audit report views

### Phase 4: Advanced Features (Weeks 9+)

- [ ] **Leave balance calculation**
  - Implement accrual rules (by category, by leave type)
  - Track fiscal years, not calendar years
  - Enforce caps and carryover rules
  - Calculate available balance on demand

- [ ] **Data sync strategy**
  - Decide: Cloud backup, multi-user sync, or local-only?
  - Design sync mechanism
  - Handle conflict resolution

- [ ] **Reports and analytics**
  - Absence reports
  - Career history reports
  - Compliance reports

---

## 8. SUMMARY SCORECARD

| Category | Score | Status | Comment |
|----------|-------|--------|---------|
| **Architecture** | 2/10 | 🔴 CRITICAL | Documented stack not implemented; vanilla JS only |
| **Database Design** | 6/10 | ⚠️ | Good schema but not implemented; missing indexes/constraints |
| **Scalability** | 2/10 | 🔴 CRITICAL | localStorage limits, O(n) queries, no pagination |
| **Security** | 1/10 | 🔴 CRITICAL | No auth, no authz, no audit, medical data exposed |
| **Code Quality** | 4/10 | ⚠️ | Works but monolithic, untestable, hard to extend |
| **HR Domain Fit** | 7/10 | ✓ | Schema covers most needs but rules not enforced |
| **Production Ready** | 1/10 | 🔴 CRITICAL | NOT suitable for deployment |

---

## 9. NEXT STEPS

### Immediately Required
1. ✅ **Decision:** Commit to React + Tauri stack shown in package.json OR revert to vanilla JS?
2. ✅ **Decision:** Desktop (Tauri) or web application?
3. ✅ **Decision:** Single-user (local storage forever) or multi-user (needs backend)?

### Before Writing Any HR Modules
1. Implement validation framework
2. Implement authentication & authorization
3. Implement database layer (even if still localStorage initially)
4. Refactor code into modules

### Testing Before Production
- Unit tests for validation rules
- Integration tests for database operations
- Security audit for auth/authz
- Performance tests with realistic data volumes (500+ employees)

---

## References

- **Database Schema:** DATABASE_SCHEMA.md
- **Project Architecture:** PROJECT_ARCHITECTURE.md  
- **Current Implementation:** /tmp/HR-Track-App/src (React) + /tmp/HR-Track-App/src-tauri (Tauri backend)
- **Build Status:** ✅ TypeScript compiles successfully; Vite build works
