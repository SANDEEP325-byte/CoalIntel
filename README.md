# CoalIntel — AI-Powered Mining Knowledge & Decision Intelligence Platform
**SIH Problem Statement:** SIH26023 — "AI-Powered Geological, Mining and other Reporting Solution for CMPDI/CIL subsidiaries"  
**Organization:** Coal India Limited (CIL) & Central Mine Planning and Design Institute (CMPDIL)

---

## 1. Overview
CoalIntel is an enterprise statutory intelligence platform integrating page-aware extraction, hybrid dense/lexical retrieval (RAG), multi-factor confidence scoring, and authoritative Role-Based Access Control (RBAC).

---

## 2. Database Architecture (MongoDB Atlas Cloud)
CoalIntel uses MongoDB Atlas for enterprise document, chunk, vector embedding, and RBAC storage.

### Atlas Prerequisites:
1. **Cluster Creation**: A free M0 cluster (e.g., `CoalIntel-Cluster`) or dedicated M10+ instance.
2. **Database User**: Create a database user with `readWrite` permissions on database `coalintel`.
3. **Network Access (IP Allowlist)**: Add your deployment server IP or `0.0.0.0/0` (Allow from anywhere) in Atlas Network Access.
4. **Connection String**: Copy the `mongodb+srv://` standard connection string.

### Configuration (`.env`):
```env
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/coalintel?retryWrites=true&w=majority
MONGODB_DB=coalintel
DATABASE_MODE=atlas
```
*(Never commit `.env` or plain credentials to source control)*

---

## 3. Database Migration & Backup Tooling
The repository includes automated BSON migration scripts preserving all 384-D vector embeddings, chunk indices, and user credentials:

1. **Backup Local Database to BSON:**
   ```bash
   python scripts/backup_local_db.py
   ```
2. **Verify Backup BSON Integrity:**
   ```bash
   python scripts/verify_backup.py
   ```
3. **Restore / Migrate to MongoDB Atlas:**
   ```bash
   python scripts/migrate_to_atlas.py --uri "mongodb+srv://<user>:<password>@cluster.mongodb.net/coalintel?retryWrites=true&w=majority"
   ```

---

## 4. Starting the Application

### Backend (FastAPI):
```bash
.venv\Scripts\python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
```

### Frontend (React/Vite):
```bash
cd frontend
npm run dev
```

---

## 5. Running Automated Verification Tests
Execute the full 70-test suite:
```bash
.venv\Scripts\python -m unittest discover backend/tests -p "test_*.py" -v
```
Execute the dedicated RBAC security suite:
```bash
.venv\Scripts\python -m unittest backend/tests/test_rbac_suite.py -v
```
