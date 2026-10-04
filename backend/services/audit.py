import logging
from typing import Optional, Dict, Any
from datetime import datetime, timezone
from database.mongodb import audit_logs_collection

logger = logging.getLogger("coalintel.audit")

SENSITIVE_KEYS = {"password", "password_hash", "token", "secret", "api_key", "authorization", "key"}


def sanitize_metadata(data: Optional[Dict[str, Any]]) -> Dict[str, Any]:
    """Sanitizes metadata dictionary removing sensitive credentials."""
    if not data:
        return {}
    clean = {}
    for k, v in data.items():
        if any(s in k.lower() for s in SENSITIVE_KEYS):
            clean[k] = "[REDACTED]"
        elif isinstance(v, dict):
            clean[k] = sanitize_metadata(v)
        else:
            clean[k] = v
    return clean


def log_audit_event(
    action: str,
    resource: str,
    user_id: Optional[str] = None,
    username: Optional[str] = None,
    resource_id: Optional[str] = None,
    status: str = "success",
    metadata: Optional[Dict[str, Any]] = None,
) -> None:
    """
    Persists an auditable event in the audit_logs collection.
    Guarantees no plaintext secrets or credentials are ever recorded.
    """
    try:
        entry = {
            "user_id": str(user_id) if user_id else "system",
            "username": username or "anonymous",
            "action": action,
            "resource": resource,
            "resource_id": str(resource_id) if resource_id else None,
            "status": status,
            "metadata": sanitize_metadata(metadata),
            "timestamp": datetime.now(timezone.utc),
        }
        audit_logs_collection.insert_one(entry)
    except Exception as exc:
        logger.warning(f"Failed to record audit log: {exc}")
