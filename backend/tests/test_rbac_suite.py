"""
CoalIntel RBAC and Security Automated Test Suite
Smart India Hackathon 2026 - Problem Statement SIH26023

Tests:
1. Authentication (valid login, invalid password, inactive user, token validation)
2. Permissions & Authorization (401 unauthenticated, 403 unauthorized)
3. Role boundaries:
   - Viewer: Can read documents & query, but CANNOT upload, delete, reprocess, or reindex
   - Analyst: Can upload & generate reports, but CANNOT manage users or delete documents
   - Admin: Can manage users, assign roles, view audit logs, and trigger reindex
4. User management (CRUD, role assignment, status toggling)
5. Audit logging (events recorded, passwords/secrets redacted)
"""

import sys
import unittest
from pathlib import Path

# Add backend directory to sys.path
backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from fastapi.testclient import TestClient
from main import app
from database.mongodb import users_collection, audit_logs_collection
from services.auth import (
    bootstrap_rbac_and_users,
    create_access_token,
    hash_password,
    SYSTEM_ROLES,
)
from services.audit import sanitize_metadata


class TestRBACSuite(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        bootstrap_rbac_and_users()
        cls.client = TestClient(app)

        # Retrieve seeded accounts
        cls.admin_user = users_collection.find_one({"role": "ADMIN"})
        cls.analyst_user = users_collection.find_one({"role": "ANALYST"})
        cls.viewer_user = users_collection.find_one({"role": "VIEWER"})

        # Tokens
        cls.admin_token = create_access_token({
            "sub": str(cls.admin_user["_id"]),
            "username": cls.admin_user["username"],
            "role": "ADMIN",
        })
        cls.analyst_token = create_access_token({
            "sub": str(cls.analyst_user["_id"]),
            "username": cls.analyst_user["username"],
            "role": "ANALYST",
        })
        cls.viewer_token = create_access_token({
            "sub": str(cls.viewer_user["_id"]),
            "username": cls.viewer_user["username"],
            "role": "VIEWER",
        })

    # -------------------------------------------------------------
    # 1. AUTHENTICATION TESTS
    # -------------------------------------------------------------
    def test_01_valid_login(self):
        """Test authentication with valid credentials returns JWT token and user profile."""
        payload = {"username": "admin", "password": "Admin@CoalIntel2026"}
        res = self.client.post("/auth/login", json=payload)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("access_token", data)
        self.assertEqual(data["token_type"], "bearer")
        self.assertEqual(data["user"]["role"], "ADMIN")
        self.assertIn("user.read", data["user"]["permissions"])
        self.assertNotIn("password_hash", data["user"])

    def test_02_invalid_password(self):
        """Test authentication with invalid password returns 401 Unauthorized."""
        payload = {"username": "admin", "password": "WrongPassword999!"}
        res = self.client.post("/auth/login", json=payload)
        self.assertEqual(res.status_code, 401)
        self.assertIn("Incorrect username/email or password", res.json()["detail"])

    def test_03_inactive_user_login(self):
        """Test login for deactivated user returns 403 Forbidden."""
        # Create a disabled user
        users_collection.update_one(
            {"username": "test_disabled"},
            {"$set": {
                "username": "test_disabled",
                "email": "disabled@coalintel.gov.in",
                "password_hash": hash_password("Secret123!"),
                "role": "VIEWER",
                "is_active": False,
            }},
            upsert=True,
        )
        res = self.client.post("/auth/login", json={"username": "test_disabled", "password": "Secret123!"})
        self.assertEqual(res.status_code, 403)
        self.assertIn("deactivated", res.json()["detail"].lower())

    def test_04_unauthenticated_request_returns_401(self):
        """Test calling protected endpoint without token returns 401 Unauthorized."""
        res = self.client.get("/documents")
        self.assertEqual(res.status_code, 401)
        self.assertIn("Authentication required", res.json()["detail"])

    def test_05_invalid_token_returns_401(self):
        """Test calling protected endpoint with corrupted token returns 401."""
        res = self.client.get("/documents", headers={"Authorization": "Bearer bad.token.here"})
        self.assertEqual(res.status_code, 401)

    # -------------------------------------------------------------
    # 2. RBAC PERMISSION BOUNDARIES
    # -------------------------------------------------------------
    def test_06_viewer_cannot_upload_document(self):
        """Test Viewer role receives 403 Forbidden when attempting to upload."""
        headers = {"Authorization": f"Bearer {self.viewer_token}"}
        fake_pdf = b"%PDF-1.4 test content"
        files = {"file": ("test.pdf", fake_pdf, "application/pdf")}
        res = self.client.post("/documents/upload", files=files, headers=headers)
        self.assertEqual(res.status_code, 403)
        self.assertIn("document.upload", res.json()["detail"])

    def test_07_viewer_cannot_delete_document(self):
        """Test Viewer role receives 403 Forbidden when attempting to delete."""
        headers = {"Authorization": f"Bearer {self.viewer_token}"}
        res = self.client.delete("/documents/507f1f77bcf86cd799439011", headers=headers)
        self.assertEqual(res.status_code, 403)
        self.assertIn("document.delete", res.json()["detail"])

    def test_08_viewer_can_read_and_query(self):
        """Test Viewer has read and query permissions."""
        headers = {"Authorization": f"Bearer {self.viewer_token}"}
        res_docs = self.client.get("/documents", headers=headers)
        self.assertEqual(res_docs.status_code, 200)

        res_query = self.client.post("/query", json={"question": "CIL coal dispatch"}, headers=headers)
        self.assertEqual(res_query.status_code, 200)

    def test_09_analyst_cannot_manage_users(self):
        """Test Analyst cannot access user management endpoints (returns 403)."""
        headers = {"Authorization": f"Bearer {self.analyst_token}"}
        res = self.client.get("/auth/users", headers=headers)
        self.assertEqual(res.status_code, 403)
        self.assertIn("user.read", res.json()["detail"])

    def test_10_analyst_cannot_reindex(self):
        """Test Analyst cannot trigger system reindexing (requires document.reindex)."""
        headers = {"Authorization": f"Bearer {self.analyst_token}"}
        res = self.client.post("/documents/reindex", headers=headers)
        self.assertEqual(res.status_code, 403)
        self.assertIn("document.reindex", res.json()["detail"])

    def test_11_analyst_can_generate_reports(self):
        """Test Analyst has permission to generate reports."""
        headers = {"Authorization": f"Bearer {self.analyst_token}"}
        res = self.client.post(
            "/reports/generate",
            json={"title": "Analyst Test Report", "report_type": "production_dispatch", "year": "2024-25"},
            headers=headers,
        )
        self.assertEqual(res.status_code, 200)

    def test_12_admin_can_manage_users_and_roles(self):
        """Test Admin can list users, create users, assign roles, and view audit logs."""
        headers = {"Authorization": f"Bearer {self.admin_token}"}

        # 1. List users
        res_list = self.client.get("/auth/users", headers=headers)
        self.assertEqual(res_list.status_code, 200)
        self.assertGreaterEqual(res_list.json()["count"], 3)

        # 2. List system roles
        res_roles = self.client.get("/auth/roles", headers=headers)
        self.assertEqual(res_roles.status_code, 200)
        roles = {r["name"]: r for r in res_roles.json()["roles"]}
        self.assertIn("ADMIN", roles)
        self.assertIn("ANALYST", roles)
        self.assertIn("VIEWER", roles)

        # 3. Create a test user with unique username
        import uuid
        new_username = f"test_sub_analyst_{uuid.uuid4().hex[:8]}"
        res_create = self.client.post(
            "/auth/users",
            json={
                "username": new_username,
                "email": f"{new_username}@coalintel.gov.in",
                "password": "Password123!",
                "role": "ANALYST",
                "full_name": "Junior Analyst",
            },
            headers=headers,
        )
        self.assertEqual(res_create.status_code, 201)
        created_id = res_create.json()["id"]

        # 4. Reassign role
        res_role = self.client.patch(
            f"/auth/users/{created_id}/role",
            json={"role": "VIEWER"},
            headers=headers,
        )
        self.assertEqual(res_role.status_code, 200)
        self.assertEqual(res_role.json()["role"], "VIEWER")

        # 5. Toggle active status
        res_status = self.client.patch(
            f"/auth/users/{created_id}/status",
            json={"is_active": False},
            headers=headers,
        )
        self.assertEqual(res_status.status_code, 200)
        self.assertFalse(res_status.json()["is_active"])

    def test_13_audit_logging_and_sanitization(self):
        """Test audit logs record important operations and redact sensitive secrets."""
        headers = {"Authorization": f"Bearer {self.admin_token}"}
        res_audit = self.client.get("/auth/audit-logs?limit=10", headers=headers)
        self.assertEqual(res_audit.status_code, 200)
        logs = res_audit.json()["logs"]
        self.assertGreater(len(logs), 0)

        # Verify no secrets in audit logs
        for log in logs:
            meta_str = str(log.get("metadata", {}))
            self.assertNotIn("password", meta_str.lower().replace("[redacted]", ""))
            self.assertNotIn("secret", meta_str.lower().replace("[redacted]", ""))

        # Test metadata sanitization unit function directly
        dirty_meta = {
            "password": "plain_password_123",
            "api_key": "gemini_secret_key_abc",
            "user": "analyst",
            "count": 42,
        }
        clean = sanitize_metadata(dirty_meta)
        self.assertEqual(clean["password"], "[REDACTED]")
        self.assertEqual(clean["api_key"], "[REDACTED]")
        self.assertEqual(clean["user"], "analyst")
        self.assertEqual(clean["count"], 42)

    # -------------------------------------------------------------
    # 3. PUBLIC REGISTRATION TESTS
    # -------------------------------------------------------------
    def test_14_public_registration_defaults_to_viewer(self):
        """Test public registration succeeds and strictly forces role to VIEWER."""
        import uuid
        uname = f"reg_user_{uuid.uuid4().hex[:8]}"
        res = self.client.post("/auth/register", json={
            "full_name": "Public Registrant",
            "organization": "CMPDI",
            "email": f"{uname}@coalintel.gov.in",
            "username": uname,
            "password": "Password123!",
        })
        self.assertEqual(res.status_code, 201)
        data = res.json()
        self.assertEqual(data["user"]["role"], "VIEWER")
        self.assertIn("Account created successfully", data["message"])

        # Login with newly registered user
        login_res = self.client.post("/auth/login", json={"username": uname, "password": "Password123!"})
        self.assertEqual(login_res.status_code, 200)
        self.assertEqual(login_res.json()["user"]["role"], "VIEWER")

    def test_15_public_registration_cannot_elevate_to_admin(self):
        """Test public registration cannot self-promote to ADMIN even if attempted."""
        import uuid
        uname = f"hacker_{uuid.uuid4().hex[:8]}"
        res = self.client.post("/auth/register", json={
            "full_name": "Attempted Admin",
            "organization": "Unknown",
            "email": f"{uname}@coalintel.gov.in",
            "username": uname,
            "password": "Password123!",
            "role": "ADMIN",  # Untrusted role parameter
        })
        self.assertEqual(res.status_code, 201)
        self.assertEqual(res.json()["user"]["role"], "VIEWER")

    def test_16_registration_duplicate_rejection(self):
        """Test registration rejects duplicate email or username with 400 Bad Request."""
        res = self.client.post("/auth/register", json={
            "full_name": "Duplicate User",
            "organization": "CIL",
            "email": "admin@coalintel.gov.in",  # already exists
            "username": "unique_username_999",
            "password": "Password123!",
        })
        self.assertEqual(res.status_code, 400)
        self.assertIn("already exists", res.json()["detail"])


if __name__ == "__main__":
    unittest.main()
