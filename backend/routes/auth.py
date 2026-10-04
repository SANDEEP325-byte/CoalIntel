"""
Authentication Endpoints for CoalIntel.
Provides secure login, current user profile introspection, and audit-logged logout.
"""

from datetime import datetime, timezone
from typing import Optional, Dict, Any
from fastapi import APIRouter, HTTPException, Depends, status, Request
from pydantic import BaseModel, Field
from database.mongodb import users_collection, roles_collection, audit_logs_collection
from services.auth import (
    verify_password,
    create_access_token,
    get_current_user,
    get_role_permissions,
    require_permission,
    list_users,
    create_user,
    update_user_status,
    assign_user_role,
    SYSTEM_ROLES,
)
from services.audit import log_audit_event
from bson import ObjectId

router = APIRouter(prefix="/auth", tags=["Authentication"])


class CreateUserRequest(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: str = Field(..., min_length=5, max_length=120)
    password: str = Field(..., min_length=6)
    role: str = "VIEWER"
    full_name: Optional[str] = None
    is_active: bool = True


class UpdateStatusRequest(BaseModel):
    is_active: bool


class AssignRoleRequest(BaseModel):
    role: str


class LoginRequest(BaseModel):
    username: str
    password: str


class UserResponse(BaseModel):
    id: str
    username: str
    email: str
    role: str
    full_name: Optional[str] = None
    is_active: bool
    permissions: list[str]


class RegisterRequest(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=100)
    organization: Optional[str] = Field(None, max_length=120)
    email: str = Field(..., min_length=5, max_length=120)
    username: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., min_length=6)


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


@router.get("/registration-status")
def get_registration_status():
    """Return whether public account registration is open."""
    import os
    allow_signup = os.environ.get("ALLOW_PUBLIC_SIGNUP", "true").lower() in ("true", "1", "yes")
    return {"allow_public_signup": allow_signup}


@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register(req: RegisterRequest, request: Request):
    """
    Public self-registration endpoint.
    Strictly forces role to 'VIEWER' - self-promotion to ADMIN/ANALYST is impossible.
    """
    import os
    allow_signup = os.environ.get("ALLOW_PUBLIC_SIGNUP", "true").lower() in ("true", "1", "yes")
    if not allow_signup:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="New account registration is currently restricted. Please contact a CoalIntel administrator.",
        )

    # Sanitize inputs
    clean_full_name = req.full_name.strip()
    if req.organization and req.organization.strip():
        clean_full_name = f"{clean_full_name} [{req.organization.strip()}]"

    new_user = create_user(
        username=req.username,
        email=req.email,
        password=req.password,
        role="VIEWER",  # Invariant: public users ALWAYS default to VIEWER
        full_name=clean_full_name,
        is_active=True,
    )

    client_ip = request.client.host if request.client else "unknown"
    log_audit_event(
        user_id=new_user["id"],
        username=new_user["username"],
        action="auth.register",
        resource="system.auth",
        status="success",
        metadata={"ip": client_ip, "role": "VIEWER", "public_signup": True},
    )

    return {
        "message": "Account created successfully. Please sign in to continue.",
        "user": {
            "id": new_user["id"],
            "username": new_user["username"],
            "email": new_user["email"],
            "role": "VIEWER",
            "full_name": new_user["full_name"],
        }
    }


@router.post("/login", response_model=LoginResponse)
async def login(req: LoginRequest, request: Request):
    """
    Authenticate user via username or email and return signed JWT with active permissions.
    """
    identifier = req.username.strip()
    user = users_collection.find_one({
        "$or": [
            {"username": identifier},
            {"email": identifier.lower()},
        ]
    })

    client_ip = request.client.host if request.client else "unknown"

    if not user or not verify_password(req.password, user.get("password_hash", "")):
        log_audit_event(
            user_id=str(user["_id"]) if user else "unregistered",
            username=identifier,
            action="auth.login",
            resource="system.auth",
            status="failure",
            metadata={"ip": client_ip, "reason": "invalid_credentials"},
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username/email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.get("is_active", True):
        log_audit_event(
            user_id=str(user["_id"]),
            username=user.get("username", identifier),
            action="auth.login",
            resource="system.auth",
            status="failure",
            metadata={"ip": client_ip, "reason": "account_deactivated"},
        )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account has been deactivated. Please contact your system administrator.",
        )

    # Update last login
    now_iso = datetime.now(timezone.utc).isoformat()
    users_collection.update_one({"_id": user["_id"]}, {"$set": {"last_login": now_iso}})

    user_id_str = str(user["_id"])
    role_str = user.get("role", "VIEWER").upper()
    perms = get_role_permissions(role_str)

    token_data = {
        "sub": user_id_str,
        "email": user.get("email"),
        "username": user.get("username"),
        "role": role_str,
    }
    token = create_access_token(token_data)

    log_audit_event(
        user_id=user_id_str,
        username=user.get("username", identifier),
        action="auth.login",
        resource="system.auth",
        status="success",
        metadata={"ip": client_ip, "role": role_str},
    )

    return LoginResponse(
        access_token=token,
        token_type="bearer",
        user=UserResponse(
            id=user_id_str,
            username=user.get("username", ""),
            email=user.get("email", ""),
            role=role_str,
            full_name=user.get("full_name"),
            is_active=user.get("is_active", True),
            permissions=perms,
        ),
    )


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: Dict[str, Any] = Depends(get_current_user)):
    """
    Retrieve profile and permissions for the currently authenticated user.
    """
    return UserResponse(
        id=str(current_user["_id"]),
        username=current_user.get("username", ""),
        email=current_user.get("email", ""),
        role=current_user.get("role", "VIEWER"),
        full_name=current_user.get("full_name"),
        is_active=current_user.get("is_active", True),
        permissions=current_user.get("permissions", []),
    )


@router.post("/logout")
async def logout(current_user: Dict[str, Any] = Depends(get_current_user)):
    """
    Audit-logged logout endpoint. Client discards the token.
    """
    log_audit_event(
        user_id=str(current_user["_id"]),
        username=current_user.get("username", ""),
        action="auth.logout",
        resource="system.auth",
        status="success",
    )
    return {"message": "Successfully logged out"}


# ---------------------------------------------------------------------------
# ADMIN USER & ROLE MANAGEMENT
# ---------------------------------------------------------------------------

@router.get("/users")
async def get_all_users(
    admin_user: Dict[str, Any] = Depends(require_permission("user.read")),
):
    """
    Retrieve all registered system users (Admin-only).
    Excludes password hashes.
    """
    users = list_users()
    return {"count": len(users), "users": users}


@router.post("/users", status_code=status.HTTP_201_CREATED)
async def create_new_user(
    req: CreateUserRequest,
    admin_user: Dict[str, Any] = Depends(require_permission("user.create")),
):
    """
    Create a new user with designated role (Admin-only).
    """
    new_user = create_user(
        username=req.username,
        email=req.email,
        password=req.password,
        role=req.role,
        full_name=req.full_name,
        is_active=req.is_active,
    )

    log_audit_event(
        user_id=str(admin_user["_id"]),
        username=admin_user.get("username", "admin"),
        action="user.create",
        resource="user",
        resource_id=new_user["id"],
        status="success",
        metadata={"created_username": req.username, "role": req.role},
    )

    return new_user


@router.patch("/users/{user_id}/status")
async def toggle_user_active_status(
    user_id: str,
    req: UpdateStatusRequest,
    admin_user: Dict[str, Any] = Depends(require_permission("user.disable")),
):
    """
    Activate or deactivate user account (Admin-only).
    """
    # Prevent admin from deactivating themselves
    if str(admin_user["_id"]) == user_id and not req.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Administrators cannot deactivate their own account.",
        )

    res = update_user_status(user_id=user_id, is_active=req.is_active)

    log_audit_event(
        user_id=str(admin_user["_id"]),
        username=admin_user.get("username", "admin"),
        action="user.status_update",
        resource="user",
        resource_id=user_id,
        status="success",
        metadata={"new_status": "active" if req.is_active else "inactive"},
    )

    return res


@router.patch("/users/{user_id}/role")
async def assign_role_to_user(
    user_id: str,
    req: AssignRoleRequest,
    admin_user: Dict[str, Any] = Depends(require_permission("role.assign")),
):
    """
    Reassign role for a user (Admin-only).
    """
    # Prevent admin from demoting themselves
    if str(admin_user["_id"]) == user_id and req.role.strip().upper() != "ADMIN":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Administrators cannot demote their own account.",
        )

    res = assign_user_role(user_id=user_id, new_role=req.role)

    log_audit_event(
        user_id=str(admin_user["_id"]),
        username=admin_user.get("username", "admin"),
        action="role.assign",
        resource="user",
        resource_id=user_id,
        status="success",
        metadata={"new_role": req.role},
    )

    return res


@router.get("/roles")
async def get_system_roles(
    admin_user: Dict[str, Any] = Depends(require_permission("role.read")),
):
    """
    List defined system roles and permission sets (Admin-only).
    """
    return {
        "roles": [
            {
                "name": role_name,
                "description": role_info["description"],
                "permissions": role_info["permissions"],
            }
            for role_name, role_info in SYSTEM_ROLES.items()
        ]
    }


@router.get("/audit-logs")
async def get_audit_logs(
    limit: int = 50,
    action: Optional[str] = None,
    resource: Optional[str] = None,
    admin_user: Dict[str, Any] = Depends(require_permission("audit.view")),
):
    """
    Retrieve audit trail events (Admin-only).
    Guarantees no sensitive credentials or plaintext secrets are returned.
    """
    filter_q: Dict[str, Any] = {}
    if action:
        filter_q["action"] = action
    if resource:
        filter_q["resource"] = resource

    raw_logs = list(audit_logs_collection.find(filter_q).sort("timestamp", -1).limit(min(limit, 200)))
    logs = []
    for l in raw_logs:
        logs.append({
            "id": str(l["_id"]),
            "user_id": l.get("user_id"),
            "username": l.get("username"),
            "action": l.get("action"),
            "resource": l.get("resource"),
            "resource_id": l.get("resource_id"),
            "status": l.get("status", "success"),
            "metadata": l.get("metadata", {}),
            "timestamp": l.get("timestamp").isoformat() if hasattr(l.get("timestamp"), "isoformat") else str(l.get("timestamp")),
        })

    return {"count": len(logs), "logs": logs}

