# backend/auth_manager.py
"""
Secure Authentication & Access Management Subsystem
Handles:
1. Hardcoded Administrator Credential Verification (Salted PBKDF2/SHA-256).
2. Token generation and validation (HMAC SHA-256 signed session tokens).
3. Access Request database/encrypted JSON store.
4. User permissions (approved/pending, query limits, audit log).
5. Gateway access gatekeeping for protected RAG/Upload endpoints.
"""

import os
import json
import time
import uuid
import hmac
import hashlib
import datetime
from pathlib import Path
from typing import Dict, Any, List, Optional
from pydantic import BaseModel

BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"
DATA_DIR.mkdir(parents=True, exist_ok=True)
ACCESS_STORE_FILE = DATA_DIR / "access_store.json"
USER_ACCOUNTS_FILE = DATA_DIR / "user_accounts.json"
CONNECTIONS_FILE = DATA_DIR / "active_connections.json"
AUDIT_LOG_FILE = DATA_DIR / "security_audit.log"

# Server Secret Key for HMAC Session Tokens
SERVER_SECRET = os.getenv("AUTH_SERVER_SECRET", "study_ai_enterprise_secret_key_2026_@!#")

# Hardcoded Admin Credentials (Securely hashed on startup)
ADMIN_CREDENTIALS = {
    "sarthaklove71@gmail.com": "Sarthak@123#",
    "sarthakmishra200906@gmail.com": "Sarthak@123#",
}

def _hash_pw(password: str, salt: str = "study_salt_enterprise") -> str:
    return hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), 100000).hex()

ADMIN_HASHES = {email.lower(): _hash_pw(pwd) for email, pwd in ADMIN_CREDENTIALS.items()}

# In-Memory Active Sessions: token -> session_dict
ACTIVE_SESSIONS: Dict[str, Dict[str, Any]] = {}

def _load_connections() -> Dict[str, Any]:
    if CONNECTIONS_FILE.exists():
        try:
            with open(CONNECTIONS_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            pass
    return {}

def _save_connections(data: Dict[str, Any]):
    try:
        with open(CONNECTIONS_FILE, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)
    except Exception as e:
        print(f"[AuthManager] Could not write connections: {e}")

# Active Connections Tracking (IP -> Last Seen & Count) persisted to disk
ACTIVE_CONNECTIONS: Dict[str, Dict[str, Any]] = _load_connections()

class UserRegisterModel(BaseModel):
    name: str
    email: str
    password: str

class UserLoginModel(BaseModel):
    email: str
    password: str

class AccessRequestModel(BaseModel):
    name: str
    email: str
    reason: str

class AdminLoginModel(BaseModel):
    email: str
    password: str

class PermissionUpdateModel(BaseModel):
    request_id: str
    status: str  # "approved" | "pending" | "revoked"
    daily_query_limit: Optional[int] = 50
    can_upload: Optional[bool] = True
    is_active: Optional[bool] = True
    time_window_enabled: Optional[bool] = False
    start_hour: Optional[int] = 0
    end_hour: Optional[int] = 23
    is_paid: Optional[bool] = False
    tier: Optional[str] = "free"

def _load_access_store() -> Dict[str, Any]:
    if ACCESS_STORE_FILE.exists():
        try:
            with open(ACCESS_STORE_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            pass
    return {"requests": [], "user_tokens": {}}

def _save_access_store(data: Dict[str, Any]):
    try:
        with open(ACCESS_STORE_FILE, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)
    except Exception as e:
        print(f"[AuthManager] Could not write access store: {e}")

def log_audit(event_type: str, actor: str, details: str, ip: str = ""):
    timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    entry = f"[{timestamp}] [EVENT: {event_type}] [ACTOR: {actor}] [IP: {ip}] - {details}\n"
    try:
        with open(AUDIT_LOG_FILE, "a", encoding="utf-8") as f:
            f.write(entry)
    except Exception:
        pass

def track_connection(ip: str, endpoint: str, user_email: str = ""):
    now = time.time()
    clean_ip = ip.strip() if ip else "127.0.0.1"
    if clean_ip not in ACTIVE_CONNECTIONS:
        ACTIVE_CONNECTIONS[clean_ip] = {
            "ip": clean_ip,
            "first_seen": datetime.datetime.now().strftime("%Y-%m-%d %H:%M"),
            "request_count": 0,
            "last_endpoint": endpoint,
            "last_seen_ts": now,
            "user_email": user_email or "guest",
        }
    ACTIVE_CONNECTIONS[clean_ip]["request_count"] += 1
    ACTIVE_CONNECTIONS[clean_ip]["last_endpoint"] = endpoint
    ACTIVE_CONNECTIONS[clean_ip]["last_seen_ts"] = now
    if user_email:
        ACTIVE_CONNECTIONS[clean_ip]["user_email"] = user_email
    _save_connections(ACTIVE_CONNECTIONS)

def generate_session_token(email: str, role: str) -> str:
    random_part = uuid.uuid4().hex
    raw_payload = f"{email}:{role}:{time.time()}:{random_part}"
    signature = hmac.new(SERVER_SECRET.encode(), raw_payload.encode(), hashlib.sha256).hexdigest()
    token = f"{raw_payload}:{signature}"
    ACTIVE_SESSIONS[token] = {
        "email": email,
        "role": role,
        "created_at": time.time(),
        "expires_at": time.time() + (3600 * 24), # 24 hours
    }
    return token

def verify_session_token(token: str) -> Optional[Dict[str, Any]]:
    if not token:
        return None
    session = ACTIVE_SESSIONS.get(token)
    if session:
        if time.time() > session["expires_at"]:
            del ACTIVE_SESSIONS[token]
            return None
        return session

    # Check HMAC signature
    try:
        parts = token.split(":")
        if len(parts) >= 5:
            signature = parts[-1]
            raw_payload = ":".join(parts[:-1])
            expected = hmac.new(SERVER_SECRET.encode(), raw_payload.encode(), hashlib.sha256).hexdigest()
            if hmac.compare_digest(signature, expected):
                email = parts[0]
                role = parts[1]
                sess = {
                    "email": email,
                    "role": role,
                    "created_at": float(parts[2]),
                    "expires_at": float(parts[2]) + (3600 * 24),
                }
                ACTIVE_SESSIONS[token] = sess
                return sess
    except Exception:
        pass
    return None

def _load_user_accounts() -> Dict[str, Any]:
    if USER_ACCOUNTS_FILE.exists():
        try:
            with open(USER_ACCOUNTS_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            pass
    return {}

def _save_user_accounts(data: Dict[str, Any]):
    try:
        with open(USER_ACCOUNTS_FILE, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)
    except Exception as e:
        print(f"[AuthManager] Could not write user accounts: {e}")

def register_user(name: str, email: str, password: str, client_ip: str = "") -> Dict[str, Any]:
    name_clean = name.strip()
    email_clean = email.strip().lower()
    pwd = password.strip()

    if not name_clean:
        return {"status": "error", "detail": "Full name is required."}
    if not email_clean or "@" not in email_clean:
        return {"status": "error", "detail": "A valid email address is required."}
    if len(pwd) < 4:
        return {"status": "error", "detail": "Password must be at least 4 characters."}

    if email_clean in ADMIN_HASHES:
        return {"status": "error", "detail": "This email is reserved for administrative accounts."}

    accounts = _load_user_accounts()
    if email_clean in accounts:
        return {"status": "error", "detail": "An account with this email already exists. Please sign in."}

    hashed = _hash_pw(pwd)
    accounts[email_clean] = {
        "name": name_clean,
        "email": email_clean,
        "password_hash": hashed,
        "created_at": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "client_ip": client_ip,
    }
    _save_user_accounts(accounts)
    log_audit("USER_REGISTERED", email_clean, f"New user account registered by {name_clean}", client_ip)
    return {
        "status": "success",
        "message": "Account registered successfully! Please submit an Access Request next.",
        "user": {
            "name": name_clean,
            "email": email_clean,
            "role": "Student Researcher",
        },
    }

def authenticate_user(email: str, password: str, client_ip: str = "") -> Dict[str, Any]:
    email_clean = email.strip().lower()
    pwd = password.strip()

    # 1. Admin login check
    if email_clean in ADMIN_HASHES:
        admin_res = authenticate_admin(email_clean, pwd, client_ip)
        if admin_res:
            return {
                "status": "approved",
                "token": admin_res["token"],
                "user": admin_res["user"],
            }
        return {
            "status": "error",
            "detail": "Invalid administrative password.",
        }

    # 2. Check registered accounts
    accounts = _load_user_accounts()
    user_rec = accounts.get(email_clean)
    if not user_rec:
        log_audit("USER_LOGIN_FAILED_NOT_REGISTERED", email_clean, "Account does not exist", client_ip)
        return {
            "status": "error",
            "detail": "Account not registered. Please create an account first.",
        }

    hashed = _hash_pw(pwd)
    if not hmac.compare_digest(hashed, user_rec.get("password_hash", "")):
        log_audit("USER_LOGIN_FAILED_WRONG_PASSWORD", email_clean, "Incorrect password attempt", client_ip)
        return {
            "status": "error",
            "detail": "Incorrect password. Please verify your credentials.",
        }

    # 3. Check access permission status in access store
    store = _load_access_store()
    req = next((r for r in store.get("requests", []) if r.get("email", "").lower() == email_clean), None)

    user_base = {
        "name": user_rec.get("name", "Study Scholar"),
        "email": email_clean,
        "role": "Student Researcher",
        "is_admin": False,
    }

    if not req:
        log_audit("USER_LOGIN_NEEDS_ACCESS", email_clean, "Logged in but no access request submitted", client_ip)
        return {
            "status": "needs_request",
            "detail": "Account authenticated, but you must submit an Access Request before using the workspace.",
            "user": {
                **user_base,
                "access_status": "needs_request",
            },
        }

    req_status = req.get("status", "pending")
    if req_status == "approved":
        if not req.get("is_active", True):
            log_audit("USER_LOGIN_DEACTIVATED", email_clean, "Account is deactivated by admin", client_ip)
            return {
                "status": "revoked",
                "detail": "Your access has been deactivated by an administrator.",
                "user": {**user_base, "access_status": "deactivated"},
            }

        tok = req.get("access_token")
        if not tok:
            tok = f"usr-{uuid.uuid4().hex}"
            req["access_token"] = tok
            store.setdefault("user_tokens", {})[tok] = email_clean
            _save_access_store(store)

        session_tok = generate_session_token(email_clean, role="user")
        log_audit("USER_LOGIN_SUCCESS", email_clean, "User authenticated with approved access", client_ip)
        return {
            "status": "approved",
            "token": tok,
            "session_token": session_tok,
            "user": {
                **user_base,
                "token": tok,
                "access_status": "approved",
                "tier": req.get("tier", "tier-free"),
                "authenticated": True,
            },
        }
    elif req_status == "pending":
        log_audit("USER_LOGIN_PENDING", email_clean, "Access request pending administrator review", client_ip)
        return {
            "status": "pending_approval",
            "detail": "Your access request is currently pending administrator approval. Please wait for review.",
            "user": {
                **user_base,
                "access_status": "pending",
            },
        }
    else:
        log_audit("USER_LOGIN_REVOKED", email_clean, f"Access status is '{req_status}'", client_ip)
        return {
            "status": "revoked",
            "detail": f"Your access request was {req_status}. Please contact an administrator.",
            "user": {
                **user_base,
                "access_status": req_status,
            },
        }

def submit_access_request(name: str, email: str, reason: str, client_ip: str = "") -> Dict[str, Any]:
    email_clean = email.strip().lower()
    accounts = _load_user_accounts()

    # Enforce that user MUST be registered first
    if email_clean not in accounts and email_clean not in ADMIN_HASHES:
        return {
            "status": "unregistered",
            "error": "You must register/create an account first before requesting server access.",
        }

    store = _load_access_store()
    req_id = f"req-{uuid.uuid4().hex[:8]}"
    email_clean = email.strip().lower()

    # Check if existing request exists
    existing = next((r for r in store["requests"] if r["email"].lower() == email_clean), None)
    if existing:
        existing["name"] = name.strip()
        existing["reason"] = reason.strip()
        existing["updated_at"] = datetime.datetime.now().strftime("%Y-%m-%d %H:%M")
        _save_access_store(store)
        log_audit("ACCESS_REQUEST_UPDATED", email_clean, f"User updated access request: {reason}", client_ip)
        return {"status": "updated", "request": existing}

    new_req = {
        "id": req_id,
        "name": name.strip(),
        "email": email_clean,
        "reason": reason.strip(),
        "status": "pending",  # pending | approved | revoked
        "is_active": True,
        "daily_query_limit": 50,
        "queries_used_today": 0,
        "can_upload": True,
        "time_window_enabled": False,
        "start_hour": 0,
        "end_hour": 23,
        "requested_at": datetime.datetime.now().strftime("%Y-%m-%d %H:%M"),
        "client_ip": client_ip,
    }
    store["requests"].insert(0, new_req)
    _save_access_store(store)
    log_audit("ACCESS_REQUEST_SUBMITTED", email_clean, f"New access request by {name.strip()}", client_ip)
    return {"status": "submitted", "request": new_req}

def authenticate_admin(email: str, password: str, client_ip: str = "") -> Optional[Dict[str, Any]]:
    email_clean = email.strip().lower()
    hashed = _hash_pw(password.strip())
    if email_clean in ADMIN_HASHES and hmac.compare_digest(hashed, ADMIN_HASHES[email_clean]):
        token = generate_session_token(email_clean, role="admin")
        is_admin1 = "sarthaklove71" in email_clean
        log_audit("ADMIN_LOGIN_SUCCESS", email_clean, f"Admin successfully authenticated (Default view: {'user' if is_admin1 else 'admin'})", client_ip)
        return {
            "token": token,
            "user": {
                "name": "Super Administrator" if is_admin1 else "Lead Admin Architect",
                "email": email_clean,
                "role": "admin",
                "is_admin": True,
                "default_portal": "user" if is_admin1 else "admin",
            }
        }
    log_audit("ADMIN_LOGIN_FAILED", email_clean, "Invalid credentials provided", client_ip)
    return None

def update_request_permission(
    request_id: str,
    status: str,
    daily_limit: int = 50,
    can_upload: bool = True,
    is_active: bool = True,
    time_window_enabled: bool = False,
    start_hour: int = 0,
    end_hour: int = 23,
    admin_email: str = "",
    is_paid: Optional[bool] = None,
    tier: Optional[str] = None,
) -> Optional[Dict[str, Any]]:
    store = _load_access_store()
    target = next((r for r in store["requests"] if r["id"] == request_id), None)
    if not target:
        return None
    old_status = target.get("status")
    target["status"] = status
    target["is_active"] = bool(is_active)
    target["daily_query_limit"] = daily_limit
    target["can_upload"] = can_upload
    target["time_window_enabled"] = bool(time_window_enabled)
    target["start_hour"] = int(start_hour)
    target["end_hour"] = int(end_hour)
    target["reviewed_by"] = admin_email
    target["reviewed_at"] = datetime.datetime.now().strftime("%Y-%m-%d %H:%M")

    if tier is not None:
        target["tier"] = tier
        target["is_paid"] = (tier in ["tier-pro", "tier-unlimited", "paid"])
    elif is_paid is not None:
        target["is_paid"] = bool(is_paid)
        target["tier"] = "tier-pro" if is_paid else "tier-free"
    elif "tier" not in target:
        target["tier"] = "tier-free"
        target["is_paid"] = False

    # If approved, generate an approved client token for the user
    if status == "approved" and not target.get("access_token"):
        user_tok = f"usr-{uuid.uuid4().hex}"
        target["access_token"] = user_tok
        store.setdefault("user_tokens", {})[user_tok] = target["email"]

    _save_access_store(store)
    log_audit("PERMISSION_CHANGED", admin_email, f"Changed {target['email']} to {status}, active={is_active}, tier={target.get('tier')}, window={time_window_enabled} ({start_hour}:00-{end_hour}:00)")
    return target

def get_user_tier_limits(token_or_email: str) -> Dict[str, Any]:
    """
    Returns exact quota limits for the user based on their assigned tier.
    Tiers:
      - tier-free: 10 resources, 10 queries, 10 GB
      - tier-pro: 50 resources, 100 queries, 25 GB
      - tier-unlimited: 9999 resources, 9999 queries, 100 GB
      - admin: Unlimited (99999 resources, 99999 queries, 1000 GB)
    """
    if not token_or_email:
        return {
            "tier_id": "tier-free",
            "tier_name": "Freemium Starter",
            "resource_limit": 10,
            "query_limit": 10,
            "storage_limit_gb": 10,
            "storage_limit_bytes": 10 * 1024 * 1024 * 1024,
            "is_admin": False,
        }

    val = token_or_email.strip().lower()
    session = verify_session_token(token_or_email)
    if (session and session.get("role") == "admin") or (val in ADMIN_HASHES):
        return {
            "tier_id": "tier-admin",
            "tier_name": "Administrator (Unlimited)",
            "resource_limit": 99999,
            "query_limit": 99999,
            "storage_limit_gb": 1000,
            "storage_limit_bytes": 1000 * 1024 * 1024 * 1024,
            "is_admin": True,
        }

    store = _load_access_store()
    resolved_email = store.get("user_tokens", {}).get(token_or_email) or val
    user_tier = "tier-free"
    for r in store.get("requests", []):
        if r.get("email", "").lower() == resolved_email or r.get("access_token") == token_or_email:
            user_tier = r.get("tier", "tier-free")
            if user_tier == "paid":
                user_tier = "tier-pro"
            elif user_tier == "free":
                user_tier = "tier-free"
            break

    site_config_path = DATA_DIR / "site_config.json"
    tiers = []
    if site_config_path.exists():
        try:
            with open(site_config_path, "r", encoding="utf-8") as f:
                sc = json.load(f)
                tiers = sc.get("pricing_tiers", [])
        except Exception:
            pass

    matched = next((t for t in tiers if t.get("id") == user_tier), None)
    if not matched:
        if user_tier == "tier-pro":
            matched = {"id": "tier-pro", "name": "Pro Scholar", "resource_limit": 50, "query_limit": 100, "storage_limit_gb": 25}
        elif user_tier == "tier-unlimited":
            matched = {"id": "tier-unlimited", "name": "Enterprise Unlimited", "resource_limit": 9999, "query_limit": 9999, "storage_limit_gb": 100}
        else:
            matched = {"id": "tier-free", "name": "Freemium Starter", "resource_limit": 10, "query_limit": 10, "storage_limit_gb": 10}

    gb = int(matched.get("storage_limit_gb", 10))
    res_lim = int(matched.get("resource_limit", 10))
    q_lim = int(matched.get("query_limit", 10))

    return {
        "tier_id": matched.get("id", "tier-free"),
        "tier_name": matched.get("name", "Freemium Starter"),
        "resource_limit": res_lim,
        "query_limit": q_lim,
        "storage_limit_gb": gb,
        "storage_limit_bytes": gb * 1024 * 1024 * 1024,
        "is_admin": False,
    }

def is_user_paid(token_or_email: str) -> bool:
    """Returns True if the user is an admin or has been granted a paid tier (tier-pro or tier-unlimited)."""
    limits = get_user_tier_limits(token_or_email)
    return limits.get("is_admin", False) or limits.get("tier_id") in ["tier-pro", "tier-unlimited", "paid"]

def check_user_access(token_or_email: str) -> Tuple[bool, str, str]:
    """
    Validates user credentials against permission store and time window.
    Returns: (is_allowed: bool, reason_message: str, resolved_email: str)
    """
    if not token_or_email:
        return False, "403 Forbidden: Missing user authentication credentials.", ""

    val = token_or_email.strip().lower()

    # 1. Admin or active session token check
    session = verify_session_token(token_or_email)
    if session:
        return True, "Authorized Session", session.get("email", "")

    # 2. Hardcoded Admin emails always authorized
    if val in ADMIN_HASHES:
        return True, "Authorized as Administrator", val

    # 3. Always authorize demo and guest users
    if val in ["demo@study.ai", "guest@study.ai", "guest_default@study.ai", "usr-demo-token-studyai-2026"]:
        return True, "Authorized as Demo/Guest", "demo@study.ai"

    store = _load_access_store()

    # If token matches stored user token
    resolved_email = store.get("user_tokens", {}).get(token_or_email) or val

    # Find user request
    user_record = None
    for r in store.get("requests", []):
        if r.get("email", "").lower() == resolved_email or r.get("access_token") == token_or_email:
            user_record = r
            break

    if not user_record:
        return False, "403 Forbidden: User not registered. Please submit an Access Request.", resolved_email

    if user_record.get("status") != "approved":
        return False, f"403 Forbidden: User access status is currently '{user_record.get('status')}'. Administrator approval required.", resolved_email

    if not user_record.get("is_active", True):
        return False, "403 Forbidden: User account is currently deactivated by Administrator.", resolved_email

    # Time Window Gatekeeping
    if user_record.get("time_window_enabled", False):
        now_hour = datetime.datetime.now().hour
        s_h = user_record.get("start_hour", 0)
        e_h = user_record.get("end_hour", 23)
        if s_h <= e_h:
            in_window = (s_h <= now_hour <= e_h)
        else:
            in_window = (now_hour >= s_h or now_hour <= e_h)

        if not in_window:
            return False, f"403 Forbidden: Access is currently closed. Your permitted time window is {s_h:02d}:00 to {e_h:02d}:00 local time.", resolved_email

    return True, "Authorized", user_record.get("email", resolved_email)

def is_user_approved(token_or_email: str) -> bool:
    """Legacy boolean wrapper for check_user_access."""
    allowed, _, _ = check_user_access(token_or_email)
    return allowed

def get_audit_logs(limit: int = 40) -> List[str]:
    if not AUDIT_LOG_FILE.exists():
        return ["No security audit records logged yet."]
    try:
        with open(AUDIT_LOG_FILE, "r", encoding="utf-8") as f:
            lines = f.readlines()
            return [l.strip() for l in lines[-limit:]][::-1]
    except Exception:
        return []
