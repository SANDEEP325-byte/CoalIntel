import os
import time
import requests
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

BASE_URL = 'http://127.0.0.1:8000'
ATLAS_URI = os.getenv('MONGODB_URI')
DB_NAME = os.getenv('MONGODB_DB_NAME', 'coalintel')

assert ATLAS_URI, "MONGODB_URI must be set in .env"
assert "mongodb+srv://" in ATLAS_URI, "Expected MongoDB Atlas URI"

# Connect directly to MongoDB Atlas
atlas_client = MongoClient(ATLAS_URI, serverSelectionTimeoutMS=5000)
atlas_db = atlas_client[DB_NAME]

print("=== 1. VERIFY ATLAS CONNECTION & METADATA ===")
ping_res = atlas_db.command('ping')
print(f"Atlas ping result: {ping_res}")
# Redact host for safe output
safe_nodes = [f"{host.split('@')[-1] if '@' in host else host}" for host, _ in atlas_client.nodes]
print(f"Connected Atlas cluster nodes (redacted): {safe_nodes}")
print(f"Target Database: {atlas_db.name}")
print(f"Existing collections: {atlas_db.list_collection_names()}")

# Verify health
health_res = requests.get(f"{BASE_URL}/health")
assert health_res.status_code == 200, f"Backend not healthy: {health_res.status_code}"
print("FastAPI Backend Health: 200 OK")

print("\n=== 2. REGISTER NEW USER VIA POST /auth/register ===")
unique_suffix = int(time.time())
test_user = {
    "full_name": f"Atlas Test User {unique_suffix}",
    "email": f"atlas_user_{unique_suffix}@coalintel.gov.in",
    "username": f"atlas_user_{unique_suffix}",
    "password": "SecurePassword2026!"
}

reg_resp = requests.post(f"{BASE_URL}/auth/register", json=test_user)
assert reg_resp.status_code == 201, f"Registration failed: {reg_resp.status_code} {reg_resp.text}"
reg_data = reg_resp.json()
created_user = reg_data.get("user", {})
print(f"HTTP 201 Registration Success! Response role: {created_user.get('role')}")
assert created_user.get("role") == "VIEWER", f"Expected VIEWER, got {created_user.get('role')}"
user_id = created_user.get("id")

print("\n=== 3. VERIFY USER PERSISTENCE DIRECTLY IN MONGODB ATLAS ===")
atlas_doc = atlas_db.users.find_one({"username": test_user["username"]})
assert atlas_doc is not None, "FAIL: Newly registered user was NOT found in MongoDB Atlas users collection!"
print("SUCCESS: User found directly in MongoDB Atlas 'users' collection!")
print(f"Atlas Document ID: {atlas_doc['_id']}")
print(f"Atlas Document Username: {atlas_doc.get('username')}")
print(f"Atlas Document Email: {atlas_doc.get('email')}")
print(f"Atlas Document Role: {atlas_doc.get('role')}")
assert atlas_doc.get("role") == "VIEWER", "Atlas role must be VIEWER"
assert "password_hash" in atlas_doc, "Atlas document must contain hashed password"
assert atlas_doc["password_hash"] != test_user["password"], "Password must be hashed, NOT plaintext!"
assert test_user["password"] not in str(atlas_doc), "Plaintext password must never appear in Atlas document!"
print("Atlas Document Password Hash: Verified securely hashed")

print("\n=== 4. TEST LOGIN AS NEWLY REGISTERED VIEWER ===")
login_resp = requests.post(f"{BASE_URL}/auth/login", json={
    "username": test_user["username"],
    "password": test_user["password"]
})
assert login_resp.status_code == 200, f"Login failed: {login_resp.status_code} {login_resp.text}"
viewer_token = login_resp.json()["access_token"]
print("Login successful! Access token obtained.")

# Verify Viewer /auth/me
viewer_headers = {"Authorization": f"Bearer {viewer_token}"}
me_resp = requests.get(f"{BASE_URL}/auth/me", headers=viewer_headers)
assert me_resp.status_code == 200
assert me_resp.json().get("role") == "VIEWER"
print("Viewer /auth/me verified: role is VIEWER")

# Verify Viewer is blocked from Users & Roles
users_blocked = requests.get(f"{BASE_URL}/auth/users", headers=viewer_headers)
assert users_blocked.status_code == 403, f"Expected 403 Forbidden, got {users_blocked.status_code}"
print("Viewer blocked from /auth/users: 403 Forbidden verified")

print("\n=== 5. ADMIN LOGIN & USERS MANAGEMENT ===")
admin_login = requests.post(f"{BASE_URL}/auth/login", json={
    "username": "admin",
    "password": "Admin@CoalIntel2026"
})
assert admin_login.status_code == 200, f"Admin login failed: {admin_login.status_code}"
admin_token = admin_login.json()["access_token"]
admin_headers = {"Authorization": f"Bearer {admin_token}"}
print("Admin login successful!")

# Admin fetches user list
admin_users_resp = requests.get(f"{BASE_URL}/auth/users", headers=admin_headers)
assert admin_users_resp.status_code == 200
all_users = admin_users_resp.json().get("users", [])
matching_user = next((u for u in all_users if u["username"] == test_user["username"]), None)
assert matching_user is not None, "Newly registered user was NOT visible in Admin users list!"
print(f"Admin Users & Roles API: Found new user with role {matching_user.get('role')}")

print("\n=== 6. ROLE REASSIGNMENT: VIEWER -> ANALYST ===")
patch_resp = requests.patch(
    f"{BASE_URL}/auth/users/{user_id}/role",
    headers=admin_headers,
    json={"role": "ANALYST"}
)
assert patch_resp.status_code == 200, f"Role update failed: {patch_resp.text}"
print(f"Admin API Role Reassignment: Response role = {patch_resp.json().get('role')}")

print("\n=== 7. VERIFY UPDATED ROLE DIRECTLY IN MONGODB ATLAS ===")
updated_atlas_doc = atlas_db.users.find_one({"username": test_user["username"]})
assert updated_atlas_doc is not None
print(f"Atlas Document updated role: {updated_atlas_doc.get('role')}")
assert updated_atlas_doc.get("role") == "ANALYST", f"FAIL: Expected ANALYST in Atlas, found {updated_atlas_doc.get('role')}"
print("SUCCESS: Role update to ANALYST verified directly in MongoDB Atlas!")

print("\n=== 8. VERIFY PERSISTENCE ON SECOND API READ ===")
refresh_users_resp = requests.get(f"{BASE_URL}/auth/users", headers=admin_headers)
refreshed_user = next((u for u in refresh_users_resp.json().get("users", []) if u["username"] == test_user["username"]), None)
assert refreshed_user["role"] == "ANALYST", f"Expected persisted ANALYST, got {refreshed_user['role']}"
print("Refreshed Users & Roles API call: Role is persistently ANALYST")

print("\n=== 9. DUPLICATE REGISTRATION TEST ===")
dup_resp = requests.post(f"{BASE_URL}/auth/register", json=test_user)
assert dup_resp.status_code in (400, 409), f"Expected 400/409 duplicate conflict, got {dup_resp.status_code}"
print(f"Duplicate registration prevented: Status {dup_resp.status_code}, detail: {dup_resp.text}")

print("\n=== 10. AUDIT LOG VERIFICATION IN ATLAS ===")
if "audit_logs" in atlas_db.list_collection_names():
    recent_logs = list(atlas_db.audit_logs.find().sort("_id", -1).limit(5))
    print(f"Total audit logs recorded in Atlas: {atlas_db.audit_logs.count_documents({})}")
    print(f"Recent actions in Atlas audit_logs: {[log.get('action') for log in recent_logs]}")

print("\n=======================================================")
print(">>> ALL MONGODB ATLAS PERSISTENCE CHECKS PASSED 100%! <<<")
print("=======================================================")
