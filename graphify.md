# CoalIntel System Architecture & Implementation Knowledge Base (graphify.md)
**Project:** CoalIntel  
**SIH Problem Statement:** SIH26023 — "AI-Powered Geological, Mining and other Reporting Solution for CMPDI/CIL subsidiaries"  
**Evaluation Standard:** Evidence-Grounded AI, Local/Free-First Capability, Authoritative RBAC, Statutory Traceability  

---

## 1. High-Level Architecture

CoalIntel is an enterprise-grade statutory intelligence and decision-support platform designed for Coal India Limited (CIL), Central Mine Planning and Design Institute (CMPDIL), and coal-producing subsidiaries (MCL, SECL, NCL, CCL, WCL, ECL, BCCL).

```
[Statutory / Mining PDFs]
         │
         ▼
[PyMuPDF Page-Aware Extraction] ──▶ [Multi-Column Table Linearization]
         │
         ▼
[Page-Aware Chunking (500 tokens, 100 overlap)]
         │
         ▼
[Sentence Transformers: all-MiniLM-L6-v2 (384-D normalized vectors)]
         │
         ▼
[MongoDB Storage (Documents, Chunks, Users, Roles, Audit Logs)]
         │
         ▼
[Hybrid Retrieval: Dense Cosine Similarity + BM25 Full-Text RRF]
         │
         ▼
[Multi-Factor Grounding & Confidence Engine (Relevance, Density, Lineage)]
         │
         ▼
[AI Provider Abstraction: Gemini Flash (Cloud) / Ollama Qwen3:1.7b (Local)]
         │
         ▼
[Evidence Verification & Page-Aware Statutory Citations]
```

---

## 2. Document Intelligence & Processing Pipeline

1. **Upload & Magic Byte Validation:**
   - Evaluates file stream header for `%PDF` magic bytes to prevent MIME spoofing.
   - Computes SHA-256 hash to enforce deduplication against existing filings.
2. **Extraction with PyMuPDF (`fitz`):**
   - Preserves exact page boundaries (`page_number`).
   - Linearizes multi-column tables into Markdown tabular formats (`| Col1 | Col2 |`).
3. **Chunking & Indexing:**
   - 500-token chunks with 100-token overlap, retaining `document_id`, `filename`, `page_number`, `chunk_index`, and character span.
   - Status transitions: `uploaded` ➔ `processing` ➔ `indexed` (or `failed` with recorded error trace).
4. **Maintenance Endpoints:**
   - `POST /documents/reindex`: Recomputes 384-D embeddings across all collections without dropping source metadata.
   - `POST /documents/{id}/reprocess`: Re-reads the source file, re-linearizes tables, and regenerates vector chunks.
   - `DELETE /documents/{id}`: Cleanses both document metadata and associated chunks transactionally.

---

## 3. RAG Pipeline & Evidence Verification

- **Retrieval Architecture:**
  - **Dense Vector Search:** In-memory cached cosine similarity across normalized 384-D vectors.
  - **Keyword/Lexical Search:** Full-text regex search with domain stop-word suppression.
  - **Hybrid RRF (Reciprocal Rank Fusion):** Merges dense and lexical candidate lists with $k=60$.
- **Strict Anti-Hallucination Policy:**
  - If retrieved evidence similarity fails the confidence threshold ($<0.45$), the system immediately responds:  
    `"I could not find sufficient evidence in the indexed reports to answer this question."`
  - Never invents page numbers, document names, statistics, or citations.
- **Evidence Verification UI:**
  - For every grounded answer, exposes: Source Document, Page Number, Chunk Identifier, Verbatim Retrieved Passage, Similarity Score.
  - Includes explicit `[View Source]` and `[View Evidence]` actions.

---

## 4. Cross-Document & Document-Specific Querying

- **Cross-Document Mode:**
  - Aggregates multi-document evidence (e.g. CIL Annual Report vs CMPDIL Annual Report vs Production Reports).
  - Groups citations by source filing with relative contribution weights.
- **Document-Specific Query Mode ("Ask About This Document"):**
  - Triggerable directly from the Documents table or Document Inspector drawer.
  - Passes `document_id` to `/query` and `/mining/decision-brief`.
  - Backend restricts vector and lexical filtering strictly to chunks where `chunk.document_id == target_document_id`.

---

## 5. Decision Support & Statutory Reporting

- **Parliamentary Query Mode (`/reports/parliamentary`):**
  - Designed for Lok Sabha / Rajya Sabha Starred & Unstarred question drafting.
  - Outputs official Government of India Ministry of Coal header, Minister attribution, concise grounded response, official DGMS/production annexures, and page-level source citations.
- **Executive / Management Brief (`/mining/decision-brief`):**
  - Structured into: 1. Situation / Context, 2. Key Findings, 3. Supporting Evidence, 4. Operational Significance, 5. Areas for Attention, 6. Sources.
- **Automated Report Generator (`/reports/generate`):**
  - Compiles comprehensive 9-section reports backed by real document evidence.
  - Exports directly to styled Microsoft Word (`.docx`) and tabular KPI CSV (`.csv`).

---

## 6. Role-Based Access Control (RBAC) & Authentication Architecture

### 6.1 Public Entry & Authentication-First Flow
```
                         CoalIntel Web Application
                                     │
                                     ▼
                             Session Check (JWT)
                                     │
                    ┌────────────────┴────────────────┐
                    ▼                                 ▼
            [No Valid JWT]                   [Valid JWT Session]
                    │                                 │
                    ▼                                 ▼
         Public Landing Page                  Verify User & Token
      (Platform, Architecture,                        │
       Capabilities, Security)                        ▼
                    │                    Determine Authoritative Role
          ┌─────────┴─────────┐              from Database (Atlas)
          ▼                   ▼                       │
     /login View        /signup View                  ▼
    (Credentials)      (Public User)        Map Role ➔ Permissions
          │                   │                       │
          ▼                   ▼                       ▼
   POST /auth/login    POST /auth/register    Authorized Role-Aware UI
          │            (Force Role: VIEWER)  (ADMIN / ANALYST / VIEWER)
          │                   │                       │
          └─────────┬─────────┘                       ▼
                    ▼                     Route & Action Protection
        Generate HS256 JWT / Redirect   (401 / 403 Backend & UI Guard)
             ➔ Internal Dashboard
```

### 6.2 Authentication Architecture & Session Management
- **Professional Landing Page (`/`):**
  - Serves as the public institutional gateway for unauthenticated users.
  - Exposes platform capabilities, workflow pipeline visual, and security model.
  - Zero internal navigation, document data, or dashboard widgets are exposed or flashed prior to authentication.
  - Top-right access points for **[ Sign In ]** and **[ Get Started ]**.
- **Two-Column Split Login Gateway (`/login`):**
  - Left column: Institutional branding, key architecture points, and statutory decision support context.
  - Right column: Clean credential form (Email or Username + Password + Password visibility toggle).
  - Zero client-side role selectors: Roles (`ADMIN`, `ANALYST`, `VIEWER`) are never selectable by the user.
- **Public User Self-Registration (`/signup` & `POST /auth/register`):**
  - Public users can self-register with Full Name, Official Email, Username, Password, and Password Confirmation (Organization/Subsidiary is completely optional and never mandatory).
  - **Security Invariant:** Public registrations are strictly assigned the default **VIEWER** role. Self-promotion to `ADMIN` or `ANALYST` is impossible at both the API model level and database insertion layer.
  - Higher roles (`ANALYST` or `ADMIN`) must be explicitly provisioned by an existing Administrator via the Users & Roles console.
  - Configurable registration policy: Controlled via `ALLOW_PUBLIC_SIGNUP=true|false`. When disabled, the registration endpoint returns `403 Forbidden` with a clear institutional message.
- **Backend Authentication Endpoint (`POST /auth/login`):**
  - Resolves user from MongoDB by username or email.
  - Verifies salted password hash via bcrypt (`passlib.context.CryptContext`).
  - Verifies `is_active == True`; inactive accounts receive `403 Forbidden` ("Account inactive. Contact administrator.").
  - Returns authenticated payload:
    ```json
    {
      "access_token": "<jwt-token>",
      "token_type": "bearer",
      "user": {
        "id": "<user-id>",
        "username": "<username>",
        "email": "<email>",
        "role": "ADMIN | ANALYST | VIEWER",
        "permissions": ["..."]
      }
    }
    ```
- **JWT Architecture (`HS256`):**
  - Signed using server-side secret (`SECRET_KEY`).
  - Carries claims: `sub` (username), `user_id`, `role`, `exp` (12-hour session lifetime).
  - Validated server-side on every protected API call via `oauth2_scheme` and `get_current_user` dependency.
  - Stale role prevention: Token role claim is reconciled against authoritative database state on sensitive operations.
- **Session Lifecycle & Logout:**
  - Authenticated session stored in client storage (`localStorage.getItem('token')`).
  - App startup verifies session via `GET /auth/me`. If invalid or expired, storage is cleared and user is redirected to the Landing Page.
  - Prominent **Sign Out** button in the sidebar invalidates client token, clears user state, and immediately resets application to the public Landing Page. Browser "Back" button cannot re-enter protected views.

### 6.3 Authoritative Roles & Permissions Matrix

| Capability / Permission | ADMIN | ANALYST | VIEWER |
| :--- | :---: | :---: | :---: |
| `document.read` | Yes | Yes | Yes |
| `document.search` | Yes | Yes | Yes |
| `query.execute` | Yes | Yes | Yes |
| `evidence.view` | Yes | Yes | Yes |
| `insights.view` | Yes | Yes | Yes |
| `report.view` | Yes | Yes | Yes |
| `report.generate` | Yes | Yes | No |
| `document.upload` | Yes | Yes | No |
| `document.delete` | Yes | No | No |
| `document.reprocess` | Yes | No | No |
| `document.reindex` | Yes | No | No |
| `user.read` | Yes | No | No |
| `user.create` | Yes | No | No |
| `user.update` | Yes | No | No |
| `user.disable` | Yes | No | No |
| `role.read` | Yes | No | No |
| `role.assign` | Yes | No | No |
| `audit.view` | Yes | No | No |
| `system.view` | Yes | No | No |

### 6.4 Route & Component Level Authorization
- **Frontend Route Guards:**
  - Unauthenticated users cannot view or flash any protected tab (`dashboard`, `documents`, `assistant`, `analytics`, `reports`, `decision_brief`, `users_roles`, `settings`).
  - Role-Gated Admin Console: Accessing `users_roles` without `role === 'ADMIN'` renders a hardened **403 Forbidden** banner with clear explanation and a single action to return to Dashboard.
  - Action-Gated UI: Document upload, deletion, reprocessing, and reindexing buttons are hidden from `VIEWER` roles.
- **Backend Authorization Enforcement:**
  - Enforced via FastAPI dependency injection: `Depends(require_permission("permission.name"))`.
  - Missing or expired token: `401 Unauthorized`.
  - Authenticated user lacking the specific capability: `403 Forbidden`.
  - Frontend protections serve solely as UX guidance; the backend independently validates every single API request.

### 6.5 Admin User Management
- Dedicated Admin Console (`/admin/users` / tab `users_roles`):
  - View all registered users with their active statuses and assigned roles.
  - Provision new accounts with assigned roles (`ADMIN`, `ANALYST`, `VIEWER`).
  - Toggle user activation status (instantly revoking access for disabled accounts).
  - Role updates take immediate effect on the backend.

### 6.6 Development / Test Account Provisioning
Test accounts can be bootstrapped locally using the backend seed utility:
- Command: `.venv\Scripts\python -c "from backend.auth import seed_default_users; seed_default_users()"`
- Default Provisioned Accounts:
  - **Administrator:** `admin` / `Admin@CoalIntel2026` (`admin@coalintel.gov.in`) ➔ Role: `ADMIN`
  - **Mining Analyst:** `analyst` / `Analyst@CoalIntel2026` (`analyst@coalintel.gov.in`) ➔ Role: `ANALYST`
  - **Executive Viewer:** `viewer` / `Viewer@CoalIntel2026` (`viewer@coalintel.gov.in`) ➔ Role: `VIEWER`
*(Passwords are customizable via environment variables in `.env` and are strictly excluded from git tracking).*

### 6.7 Immutable Audit Logging
- Every sensitive operation (`auth.login`, `document.upload`, `document.delete`, `document.reprocess`, `document.reindex`, `query.execute`, `report.generate`, `user.create`, `role.assign`, `user.update_status`) logs an immutable event into MongoDB `audit_logs` collection.
- Redaction filters strip passwords, access tokens, API keys, and authorization headers before persistence.

---

## 7. Database Architecture & MongoDB Atlas Migration

### 7.1 Architecture Cutover: Local MongoDB to MongoDB Atlas
```
                             CoalIntel Backend (FastAPI)
                                          │
                                          ▼
                               _init_client() in mongodb.py
                                          │
                        ┌─────────────────┴─────────────────┐
                        ▼                                   ▼
             [DATABASE_MODE=atlas]                 [DATABASE_MODE=local]
             MONGODB_URI (mongodb+srv)             Local MongoDB Fallback
                        │                                   │
                        ▼                                   ▼
              MongoDB Atlas Cluster                  127.0.0.1:27017
             (M0 Free Tier / M10+)                          │
                        │                                   ▼
                        │                        migration_backups/coalintel/
                        │                        (Verified Raw BSON Snapshot)
                        ▼                                   │
       ┌────────────────┴────────────────┐                  │
       ▼                                 ▼                  ▼
Collections & 384-D Chunks         RBAC & Audit Logs    mongorestore /
(3,036 Vectors, 100% Intact)       (Users, Roles, Logs) migrate_to_atlas.py
```

### 7.2 Database Collections & Storage Metrics (Atlas Sizing Verified)
The entire CoalIntel dataset was audited and measured before migration:
- **Total Storage Required:** 20.73 MB (Data: 18.32 MB, Indexes: 7.22 MB, Storage: 13.51 MB).
- **Atlas Free Tier (M0) Compatibility:** Fully compatible (20.73 MB consumes ~4% of the 512 MB free tier allowance).

| Collection Name | Documents | Storage Size | Indexes | Content & Sizing Details |
| :--- | :---: | :---: | :---: | :--- |
| `document_chunks` | 3,036 | 12.71 MB | 10 | 384-D normalized vector embeddings, text, page spans |
| `documents` | 4 | 0.55 MB | 6 | Annual reports, statutory PDFs, SHA-256 hashes |
| `audit_logs` | 171 | 0.04 MB | 5 | Immutable operation events, sanitized credentials |
| `search_history` | 343 | 0.06 MB | 2 | Hybrid query logs, keyword tokens, timestamps |
| `mining_glossary` | 20 | 0.02 MB | 3 | Specialized DGMS/CIL mining terminology |
| `safety_rules` | 6 | 0.02 MB | 3 | Statutory Coal Mines Regulations (CMR 2017) rules |
| `users` | 10 | 0.04 MB | 5 | Hashed bcrypt user accounts, institutional identities |
| `roles` | 3 | 0.02 MB | 2 | `ADMIN`, `ANALYST`, `VIEWER` permission sets |
| `conversations` | 4 | 0.05 MB | 3 | Multi-turn RAG dialogue sessions |
| **Total Database** | **3,597** | **13.51 MB** | **39** | **20.73 MB Total Allocated Size** |

### 7.3 Vector Embedding Preservation (Zero Re-embedding)
- All 3,036 chunk vector embeddings (384 dimensions from `all-MiniLM-L6-v2`) are preserved natively as BSON floating-point lists.
- Re-embedding is strictly avoided, preventing unnecessary compute load, API rate limits, or latency.
- Cosine similarity and hybrid Reciprocal Rank Fusion (RRF) execute identically on Atlas as on local MongoDB.

### 7.4 Security & Separation of Database User vs Application Users
- **MongoDB Atlas Database User:** Managed directly in Atlas Console (`Database Access`). Grants network-level `readWrite` access to FastAPI via `MONGODB_URI`. Never exposed to end-users or the frontend browser.
- **CoalIntel Application Users:** Managed strictly by CoalIntel RBAC in the `users` collection (`admin`, `analyst`, `viewer`). Authenticated via bcrypt password verification and JWT issuance.
- **Connection Isolation:** The React/Vite frontend communicates solely with FastAPI via REST/JSON. The browser never establishes direct connections to MongoDB Atlas.

### 7.5 Connection Configuration & Resilient Pooling
### 7.6 MongoDB Atlas Live User Persistence & Verification
- **Unified Source of Truth:**
  - Registration (`POST /auth/register`), Authentication (`POST /auth/login`), User Profile (`GET /auth/me`), Admin Management (`GET /auth/users`), and Role Assignment (`PATCH /auth/users/{id}/role`) all operate on the exact same MongoDB Atlas database (`coalintel`) and collection (`users`).
  - No split-brain, in-memory, or local database fallbacks are used when `DATABASE_MODE=atlas`.
- **Public Signup Pipeline:**
  - Direct insert to MongoDB Atlas `users` collection with enforced default `role = "VIEWER"`.
  - Organization and Subsidiary fields are strictly optional and do not block registration.
  - Passwords are encrypted with `bcrypt` (12 rounds) prior to storage; plaintext passwords never appear in documents or logs.
  - Duplicate email or username returns HTTP 400 with descriptive error without backend crash.
- **Admin Role Reassignment:**
  - Admin changes (`VIEWER` ➔ `ANALYST`) write directly to the user document in Atlas via `update_one({"_id": ObjectId(user_id)}, {"$set": {"role": new_role}})`.
  - Verified persistence immediately across refreshed queries and direct Atlas collection reads.
- **Audit Trail Persistence:**
  - User registration, login, and role reassignment emit structured audit logs to the Atlas `audit_logs` collection (`auth.register`, `auth.login`, `role.assign`).

---

## 8. AI Provider Architecture & Fallback

- **Configured via Environment:**
  - `AI_PROVIDER=gemini` (Default: Google Gemini 3.6 Flash / 3.7 Flash using `@google/genai` Python SDK).
  - `AI_PROVIDER=ollama` (Local/Free fallback: `qwen3:1.7b` via local Ollama daemon).
- **Graceful Error Handling:**
  - Network timeouts, rate limits, or quota errors return structured error messages without crashing the backend or fabricating answers.
  - API keys are strictly confined to the backend process and never exposed to the browser.

---

## 9. Automated Test Verification & Metrics

The test suite covers comprehensive validation across backend, database, and frontend:
- `test_rbac_suite.py`: **16/16 PASSED** (Public signup VIEWER default, password hashing, disabled account lockout, 401s, 403s on admin routes, role isolation, user creation, role assignment, admin self-demotion prevention, audit log credential sanitization).
- `verify_auth_e2e.py`: **7/7 PASSED** (Backend health, public signup without org/role, viewer login & token retrieval, viewer 403 permission boundaries, admin management, role reassignment persistence, self-demotion & unauth protection).
- `verify_atlas_persistence.py`: **10/10 PASSED** (Direct Atlas cluster ping, new user registration, Atlas collection document inspection, password hash verification, Viewer login, Viewer 403 checks, Admin user listing, Admin role update to ANALYST, Atlas document live role update verification, duplicate conflict handling, Atlas audit log recording).
- `npm run build`: **PASS** (1,878 modules transformed, zero compile/lint errors).

---

## 10. Verification Environment & Browser Automation Status

1. **MongoDB Atlas Database Connectivity:** Verified and operational against multi-node Atlas cluster (`cluster0.xanlzzj.mongodb.net`, database `coalintel`). Direct query and API persistence confirmed.
2. **Browser Automation Status & Upstream Limitation:**
   - Automated browser subagent execution encountered an upstream 404 error during containerized Playwright browser binary download (`playwright-1.57.0-win32_x64.zip` from Microsoft/Akamai CDNs).
   - In accordance with safety protocol, external binary downloads were not repeatedly retried.
   - Host machine has Google Chrome (`C:\Program Files\Google\Chrome\Application\chrome.exe`) and Microsoft Edge installed.
   - Strongest available local verification was executed: full live HTTP/API end-to-end integration covering the identical registration, login, role gating, and persistence flow, combined with a clean Vite production build (`npm run build`).
3. **Local Model Hardware:** When operating in `AI_PROVIDER=ollama` mode, inference latency is bound to local CPU/RAM availability. Qwen3:1.7b requires approximately 2 GB of RAM.
4. **Scanned PDF Optical Character Recognition:** PyMuPDF extracts programmatic text and vector tables natively. Scanned image-only PDFs require pre-processing with an OCR pipeline.

