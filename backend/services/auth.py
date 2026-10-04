"""
Authentication and Role-Based Access Control (RBAC) Service for CoalIntel.
Enforces strict JWT token validation, bcrypt password hashing, and granular permissions.
"""

import os
import datetime
from typing import Optional, Dict, Any, List, Set
import bcrypt
import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from database.mongodb import users_collection, roles_collection
from bson import ObjectId

# Configuration
JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "coalintel-sih26023-production-rbac-secret-key-2026")
JWT_ALGORITHM = os.environ.get("JWT_ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.environ.get("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))  # 24 hours

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login", auto_error=False)

# Exact permission definitions required by CoalIntel specification
SYSTEM_ROLES: Dict[str, Dict[str, Any]] = {
    "ADMIN": {
        "description": "Full system administrator with user management, document lifecycle, and audit visibility",
        "permissions": [
            "user.read",
            "user.create",
            "user.update",
            "user.disable",
            "role.read",
            "role.assign",
            "document.read",
            "document.upload",
            "document.delete",
            "document.reprocess",
            "document.reindex",
            "document.search",
            "query.execute",
            "evidence.view",
            "report.generate",
            "report.view",
            "insights.view",
            "system.view",
            "audit.view",
        ],
    },
    "ANALYST": {
        "description": "Mining data analyst with document ingestion, search, RAG query, and report generation capabilities",
        "permissions": [
            "document.read",
            "document.upload",
            "document.search",
            "query.execute",
            "evidence.view",
            "report.generate",
            "report.view",
            "insights.view",
        ],
    },
    "VIEWER": {
        "description": "Read-only stakeholder with query, evidence review, and report viewing access",
        "permissions": [
            "document.read",
            "document.search",
            "query.execute",
            "evidence.view",
            "report.view",
            "insights.view",
        ],
    },
}


def hash_password(plain_password: str) -> str:
    """Hash a plaintext password with bcrypt salt."""
    salt = bcrypt.gensalt(rounds=12)
    hashed = bcrypt.hashpw(plain_password.encode("utf-8"), salt)
    return hashed.decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plaintext password against a bcrypt hash."""
    try:
        return bcrypt.checkpw(
            plain_password.encode("utf-8"),
            hashed_password.encode("utf-8"),
        )
    except Exception:
        return False


def create_access_token(data: Dict[str, Any], expires_delta: Optional[datetime.timedelta] = None) -> str:
    """Generate a signed JWT token."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.datetime.now(datetime.timezone.utc) + expires_delta
    else:
        expire = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire, "iat": datetime.datetime.now(datetime.timezone.utc)})
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)
    return encoded_jwt


def decode_access_token(token: str) -> Dict[str, Any]:
    """Decode and validate a JWT access token."""
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session token has expired. Please log in again.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token.",
            headers={"WWW-Authenticate": "Bearer"},
        )


def get_role_permissions(role_name: str) -> List[str]:
    """Retrieve the permissions for a specified role."""
    norm_role = (role_name or "").strip().upper()
    if norm_role in SYSTEM_ROLES:
        return SYSTEM_ROLES[norm_role]["permissions"]
    # Check database role document if custom role
    db_role = roles_collection.find_one({"name": norm_role})
    if db_role and "permissions" in db_role:
        return db_role["permissions"]
    return []


async def get_current_user(token: Optional[str] = Depends(oauth2_scheme)) -> Dict[str, Any]:
    """
    Authenticate the request and return the current user document.
    Raises 401 if missing, invalid, or expired.
    """
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Please provide a valid Bearer token.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    payload = decode_access_token(token)
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token payload missing subject identifier.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Fetch user from database
    query: Dict[str, Any] = {}
    if ObjectId.is_valid(user_id):
        query = {"$or": [{"_id": ObjectId(user_id)}, {"username": user_id}, {"email": user_id}]}
    else:
        query = {"$or": [{"username": user_id}, {"email": user_id}]}

    user = users_collection.find_one(query)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authenticated user no longer exists.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.get("is_active", True):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is deactivated. Contact an administrator.",
        )

    # Attach computed permissions based on authoritative backend role
    user_role = user.get("role", "VIEWER").upper()
    user["permissions"] = get_role_permissions(user_role)
    user["_id"] = str(user["_id"])
    user.pop("password_hash", None)
    return user


async def get_optional_current_user(token: Optional[str] = Depends(oauth2_scheme)) -> Optional[Dict[str, Any]]:
    """Return user if token is provided and valid, else None without raising error."""
    if not token:
        return None
    try:
        return await get_current_user(token)
    except Exception:
        return None


def require_permission(required_permission: str):
    """
    FastAPI dependency factory enforcing granular permission authorization.
    Rejects unauthorized requests with HTTP 403 Forbidden.
    """
    async def permission_dependency(current_user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
        user_perms: Set[str] = set(current_user.get("permissions", []))
        if required_permission not in user_perms:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Forbidden: You do not have permission '{required_permission}' to perform this action.",
            )
        return current_user

    return permission_dependency


def list_users() -> List[Dict[str, Any]]:
    """List all system users excluding password hashes."""
    users = list(users_collection.find().sort("created_at", -1))
    result = []
    for u in users:
        u_id = str(u["_id"])
        role_str = u.get("role", "VIEWER").upper()
        result.append({
            "id": u_id,
            "username": u.get("username", ""),
            "email": u.get("email", ""),
            "role": role_str,
            "full_name": u.get("full_name"),
            "is_active": u.get("is_active", True),
            "permissions": get_role_permissions(role_str),
            "created_at": u.get("created_at"),
            "updated_at": u.get("updated_at"),
            "last_login": u.get("last_login"),
        })
    return result


def create_user(
    username: str,
    email: str,
    password: str,
    role: str = "VIEWER",
    full_name: Optional[str] = None,
    is_active: bool = True,
) -> Dict[str, Any]:
    """Create a new user with hashed password and audit validation."""
    clean_username = username.strip()
    clean_email = email.strip().lower()
    clean_role = role.strip().upper()

    if clean_role not in SYSTEM_ROLES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid role '{role}'. Supported roles: {list(SYSTEM_ROLES.keys())}",
        )

    # Check for existing email or username
    existing = users_collection.find_one({"$or": [{"email": clean_email}, {"username": clean_username}]})
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this username or email already exists.",
        )

    now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()
    new_user = {
        "username": clean_username,
        "email": clean_email,
        "password_hash": hash_password(password),
        "role": clean_role,
        "full_name": full_name.strip() if full_name else None,
        "is_active": is_active,
        "created_at": now_iso,
        "updated_at": now_iso,
        "last_login": None,
    }

    res = users_collection.insert_one(new_user)
    user_id_str = str(res.inserted_id)

    return {
        "id": user_id_str,
        "username": clean_username,
        "email": clean_email,
        "role": clean_role,
        "full_name": new_user.get("full_name"),
        "is_active": is_active,
        "permissions": get_role_permissions(clean_role),
        "created_at": now_iso,
    }


def update_user_status(user_id: str, is_active: bool) -> Dict[str, Any]:
    """Activate or deactivate a user account."""
    if not ObjectId.is_valid(user_id):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid user ID format.")

    now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()
    res = users_collection.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"is_active": is_active, "updated_at": now_iso}},
    )
    if res.matched_count == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")

    updated = users_collection.find_one({"_id": ObjectId(user_id)})
    return {
        "id": user_id,
        "username": updated.get("username"),
        "email": updated.get("email"),
        "role": updated.get("role"),
        "is_active": updated.get("is_active"),
        "updated_at": now_iso,
    }


def assign_user_role(user_id: str, new_role: str) -> Dict[str, Any]:
    """Assign a system role to a user."""
    if not ObjectId.is_valid(user_id):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid user ID format.")

    clean_role = new_role.strip().upper()
    if clean_role not in SYSTEM_ROLES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid role '{new_role}'. Supported roles: {list(SYSTEM_ROLES.keys())}",
        )

    now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()
    res = users_collection.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"role": clean_role, "updated_at": now_iso}},
    )
    if res.matched_count == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")

    updated = users_collection.find_one({"_id": ObjectId(user_id)})
    return {
        "id": user_id,
        "username": updated.get("username"),
        "email": updated.get("email"),
        "role": clean_role,
        "permissions": get_role_permissions(clean_role),
        "is_active": updated.get("is_active"),
        "updated_at": now_iso,
    }


def bootstrap_rbac_and_users() -> None:
    """
    Bootstrap standard roles and default development/admin accounts safely if database is uninitialized.
    Never overwrites existing users or production credentials.
    """
    try:
        now = datetime.datetime.now(datetime.timezone.utc).isoformat()

        # 1. Seed Roles
        for role_name, role_data in SYSTEM_ROLES.items():
            roles_collection.update_one(
                {"name": role_name},
                {
                    "$setOnInsert": {
                        "name": role_name,
                        "description": role_data["description"],
                        "permissions": role_data["permissions"],
                        "created_at": now,
                        "updated_at": now,
                    }
                },
                upsert=True,
            )

        # 2. Seed Default Safe Accounts if users collection has no Admin
        existing_admin = users_collection.find_one({"role": "ADMIN"})
        if not existing_admin:
            seed_accounts = [
                {
                    "username": "admin",
                    "email": "admin@coalintel.gov.in",
                    "password": os.environ.get("DEFAULT_ADMIN_PASSWORD", "Admin@CoalIntel2026"),
                    "role": "ADMIN",
                    "full_name": "System Administrator",
                },
                {
                    "username": "analyst",
                    "email": "analyst@coalintel.gov.in",
                    "password": os.environ.get("DEFAULT_ANALYST_PASSWORD", "Analyst@CoalIntel2026"),
                    "role": "ANALYST",
                    "full_name": "Mining Technical Analyst",
                },
                {
                    "username": "viewer",
                    "email": "viewer@coalintel.gov.in",
                    "password": os.environ.get("DEFAULT_VIEWER_PASSWORD", "Viewer@CoalIntel2026"),
                    "role": "VIEWER",
                    "full_name": "Coal Ministry Stakeholder",
                },
            ]

            for acc in seed_accounts:
                existing = users_collection.find_one({"$or": [{"email": acc["email"]}, {"username": acc["username"]}]})
                if not existing:
                    users_collection.insert_one(
                        {
                            "username": acc["username"],
                            "email": acc["email"],
                            "password_hash": hash_password(acc["password"]),
                            "role": acc["role"],
                            "full_name": acc["full_name"],
                            "is_active": True,
                            "created_at": now,
                            "updated_at": now,
                            "last_login": None,
                        }
                    )
    except Exception as exc:
        print(f"[RBAC Bootstrap Warning] Failed to bootstrap RBAC data: {exc}")

