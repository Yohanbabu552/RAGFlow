"""
Lightweight mock API server for RBAC UI demo (v4 — Fully Connected).

Handles ALL endpoints the frontend calls:
- /v1/user/*           -> Auth, user info, settings
- /v1/project/*        -> RBAC project CRUD
- /api/v1/admin/users  -> Admin user management (list, create, activate)
- /api/v1/admin/stats  -> System stats for dashboard
- /api/v1/admin/audit  -> Audit event log
- /v1/kb/list          -> Document/dataset list
- /v1/dialog/*         -> Chat dialogs
- /v1/conversation/*   -> Chat conversations

Pre-seeded with projects, users, documents, and audit events.

Usage:
    pip install flask flask-cors
    python mock_server.py
"""

import uuid
import time
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

ts_now = int(time.time())

# ══════════════════════════════════════════════════════════════
# In-memory data stores
# ══════════════════════════════════════════════════════════════

MOCK_USER = {
    "id": "usr-super-admin-001",
    "email": "admin@emami.com",
    "nickname": "Super Admin",
    "avatar": "",
    "is_superuser": True,
    "is_active": "1",
    "is_anonymous": "0",
    "is_authenticated": "1",
    "language": "English",
    "color_schema": "light",
    "timezone": "Asia/Kolkata",
    "status": "1",
    "login_channel": "password",
    "create_time": ts_now,
    "create_date": "2025-01-01 00:00:00",
    "update_time": ts_now,
    "update_date": "2025-01-01 00:00:00",
    "last_login_time": "2025-01-01 00:00:00",
    "access_token": "mock-token-001",
    "project_roles": [],
}

MOCK_TENANT = {
    "tenant_id": "tenant-001",
    "name": "Emami",
    "llm_id": "", "embd_id": "", "asr_id": "",
    "img2txt_id": "", "rerank_id": "", "tts_id": "",
    "parser_ids": "", "role": "owner",
}

# ── Projects ──────────────────────────────────────────────────
PROJECTS = {
    "proj-001": {
        "id": "proj-001", "tenant_id": "tenant-001",
        "name": "Emami Product Catalog",
        "description": "AI-powered product catalog with document intelligence for Emami's product line.",
        "created_by": "usr-super-admin-001", "status": "1",
        "create_time": ts_now, "update_time": ts_now,
    },
    "proj-002": {
        "id": "proj-002", "tenant_id": "tenant-001",
        "name": "HR Policy Assistant",
        "description": "Internal HR knowledge base for employee onboarding and policy queries.",
        "created_by": "usr-super-admin-001", "status": "1",
        "create_time": ts_now, "update_time": ts_now,
    },
    "proj-003": {
        "id": "proj-003", "tenant_id": "tenant-001",
        "name": "R&D Research Papers",
        "description": "Research document management and Q&A for the R&D division.",
        "created_by": "usr-super-admin-001", "status": "1",
        "create_time": ts_now, "update_time": ts_now,
    },
}

PROJECT_USERS = {
    "proj-001": [
        {"id": "pu-001", "user_id": "usr-super-admin-001", "project_id": "proj-001", "role": "admin", "assigned_by": "usr-super-admin-001", "email": "admin@emami.com", "nickname": "Super Admin", "avatar": "", "is_superuser": True, "is_active": "1", "create_time": ts_now, "update_time": ts_now},
        {"id": "pu-002", "user_id": "usr-proj-admin-001", "project_id": "proj-001", "role": "admin", "assigned_by": "usr-super-admin-001", "email": "rahul@emami.com", "nickname": "Rahul Sharma", "avatar": "", "is_superuser": False, "is_active": "1", "create_time": ts_now, "update_time": ts_now},
        {"id": "pu-003", "user_id": "usr-member-001", "project_id": "proj-001", "role": "member", "assigned_by": "usr-super-admin-001", "email": "priya@emami.com", "nickname": "Priya Patel", "avatar": "", "is_superuser": False, "is_active": "1", "create_time": ts_now, "update_time": ts_now},
    ],
    "proj-002": [
        {"id": "pu-004", "user_id": "usr-super-admin-001", "project_id": "proj-002", "role": "admin", "assigned_by": "usr-super-admin-001", "email": "admin@emami.com", "nickname": "Super Admin", "avatar": "", "is_superuser": True, "is_active": "1", "create_time": ts_now, "update_time": ts_now},
        {"id": "pu-005", "user_id": "usr-member-002", "project_id": "proj-002", "role": "member", "assigned_by": "usr-super-admin-001", "email": "amit@emami.com", "nickname": "Amit Kumar", "avatar": "", "is_superuser": False, "is_active": "1", "create_time": ts_now, "update_time": ts_now},
    ],
    "proj-003": [
        {"id": "pu-006", "user_id": "usr-super-admin-001", "project_id": "proj-003", "role": "admin", "assigned_by": "usr-super-admin-001", "email": "admin@emami.com", "nickname": "Super Admin", "avatar": "", "is_superuser": True, "is_active": "1", "create_time": ts_now, "update_time": ts_now},
    ],
}

# ── Admin Users (full user list for /api/v1/admin/users) ──────
ADMIN_USERS = [
    {"user_id": "usr-super-admin-001", "email": "admin@emami.com", "nickname": "Rajesh Kumar", "is_superuser": True, "is_active": "1", "status": "1", "avatar": "", "create_date": "2025-01-01 00:00:00", "update_date": "2026-03-04 09:30:00", "last_login_time": "2 min ago", "role": "super-admin", "project_count": 3, "projects": ["All Projects"]},
    {"user_id": "usr-proj-admin-001", "email": "priya.mehta@emami.com", "nickname": "Priya Mehta", "is_superuser": False, "is_active": "1", "status": "1", "avatar": "", "create_date": "2025-02-15 00:00:00", "update_date": "2026-03-04 09:15:00", "last_login_time": "15 min ago", "role": "project-admin", "project_count": 2, "projects": ["Emami Product Catalog", "HR Policy Assistant"]},
    {"user_id": "usr-member-001", "email": "rahul.sharma@emami.com", "nickname": "Rahul Sharma", "is_superuser": False, "is_active": "1", "status": "1", "avatar": "", "create_date": "2025-03-10 00:00:00", "update_date": "2026-03-04 08:30:00", "last_login_time": "1 hour ago", "role": "standard", "project_count": 1, "projects": ["Emami Product Catalog"]},
    {"user_id": "usr-proj-admin-002", "email": "amit.kapoor@emami.com", "nickname": "Amit Kapoor", "is_superuser": False, "is_active": "1", "status": "1", "avatar": "", "create_date": "2025-04-01 00:00:00", "update_date": "2026-03-04 06:00:00", "last_login_time": "3 hours ago", "role": "project-admin", "project_count": 1, "projects": ["R&D Research Papers"]},
    {"user_id": "usr-member-003", "email": "sneha.gupta@emami.com", "nickname": "Sneha Gupta", "is_superuser": False, "is_active": "0", "status": "0", "avatar": "", "create_date": "2025-05-20 00:00:00", "update_date": "2026-02-20 00:00:00", "last_login_time": "2 weeks ago", "role": "standard", "project_count": 1, "projects": ["HR Policy Assistant"]},
    {"user_id": "usr-member-004", "email": "vikram.nair@emami.com", "nickname": "Vikram Nair", "is_superuser": False, "is_active": "1", "status": "1", "avatar": "", "create_date": "2025-06-01 00:00:00", "update_date": "2026-03-04 09:00:00", "last_login_time": "30 min ago", "role": "standard", "project_count": 2, "projects": ["Emami Product Catalog", "R&D Research Papers"]},
]

# ── Audit Events ──────────────────────────────────────────────
AUDIT_EVENTS = [
    {"id": "evt-001", "type": "login", "user_email": "admin@emami.com", "user_name": "Rajesh Kumar", "details": "Successful login from 192.168.1.100", "project": "-", "ip_address": "192.168.1.100", "timestamp": ts_now - 120, "time_ago": "2 minutes ago"},
    {"id": "evt-002", "type": "upload", "user_email": "rahul.sharma@emami.com", "user_name": "Rahul Sharma", "details": "Uploaded product_specs_2025.pdf (2.3 MB)", "project": "Emami Product Catalog", "ip_address": "192.168.1.105", "timestamp": ts_now - 900, "time_ago": "15 minutes ago"},
    {"id": "evt-003", "type": "chat", "user_email": "priya.mehta@emami.com", "user_name": "Priya Mehta", "details": "Started AI chat session - queried product specifications", "project": "Emami Product Catalog", "ip_address": "192.168.1.110", "timestamp": ts_now - 3600, "time_ago": "1 hour ago"},
    {"id": "evt-004", "type": "user_created", "user_email": "admin@emami.com", "user_name": "Rajesh Kumar", "details": "Created user amit.kapoor@emami.com with role Project Admin", "project": "R&D Research Papers", "ip_address": "192.168.1.100", "timestamp": ts_now - 7200, "time_ago": "2 hours ago"},
    {"id": "evt-005", "type": "export", "user_email": "vikram.nair@emami.com", "user_name": "Vikram Nair", "details": "Exported 12 documents as PDF bundle", "project": "Emami Product Catalog", "ip_address": "192.168.1.112", "timestamp": ts_now - 10800, "time_ago": "3 hours ago"},
    {"id": "evt-006", "type": "permission_change", "user_email": "admin@emami.com", "user_name": "Rajesh Kumar", "details": "Changed Priya Mehta role from Member to Project Admin", "project": "HR Policy Assistant", "ip_address": "192.168.1.100", "timestamp": ts_now - 14400, "time_ago": "4 hours ago"},
    {"id": "evt-007", "type": "upload", "user_email": "amit.kapoor@emami.com", "user_name": "Amit Kapoor", "details": "Uploaded 3 research papers to R&D collection", "project": "R&D Research Papers", "ip_address": "192.168.1.108", "timestamp": ts_now - 18000, "time_ago": "5 hours ago"},
    {"id": "evt-008", "type": "login", "user_email": "sneha.gupta@emami.com", "user_name": "Sneha Gupta", "details": "Failed login attempt - account deactivated", "project": "-", "ip_address": "192.168.1.115", "timestamp": ts_now - 86400, "time_ago": "1 day ago"},
]

# ── Mock documents for dashboard ──────────────────────────────
MOCK_DOCUMENTS = [
    {"id": "doc-001", "name": "Sona_Masoori_Rice_Brochure_2026.pdf", "type": "pdf", "category": "Rice Products", "project": "Emami Product Catalog", "size": "2.3 MB", "status": "processed", "uploaded_by": "Rahul Sharma", "create_time": ts_now - 7200, "time_ago": "2 hours ago"},
    {"id": "doc-002", "name": "Fair_And_Handsome_Label_v3.png", "type": "img", "category": "Personal Care", "project": "Emami Product Catalog", "size": "1.1 MB", "status": "processed", "uploaded_by": "Priya Mehta", "create_time": ts_now - 14400, "time_ago": "4 hours ago"},
    {"id": "doc-003", "name": "Navratna_Oil_Product_Spec.docx", "type": "doc", "category": "Healthcare", "project": "R&D Research Papers", "size": "856 KB", "status": "processing", "uploaded_by": "Amit Kapoor", "create_time": ts_now - 18000, "time_ago": "5 hours ago"},
    {"id": "doc-004", "name": "Q4_Product_Master_Data.xlsx", "type": "xls", "category": "Master Data", "project": "Emami Product Catalog", "size": "4.7 MB", "status": "processed", "uploaded_by": "Vikram Nair", "create_time": ts_now - 86400, "time_ago": "yesterday"},
    {"id": "doc-005", "name": "BoroPlus_Cream_Trade_Sheet.pdf", "type": "pdf", "category": "Skincare", "project": "Emami Product Catalog", "size": "1.8 MB", "status": "failed", "uploaded_by": "Rahul Sharma", "create_time": ts_now - 86400, "time_ago": "yesterday"},
]


def ok(data=None, message="success"):
    return jsonify({"code": 0, "data": data, "message": message})


def err(message="error", code=100):
    return jsonify({"code": code, "data": False, "message": message})


# ══════════════════════════════════════════════════════════════
# Auth endpoints
# ══════════════════════════════════════════════════════════════
@app.route("/v1/user/info", methods=["GET"])
def user_info():
    user = dict(MOCK_USER)
    user["project_roles"] = []
    for pid, proj in PROJECTS.items():
        user["project_roles"].append({
            "project_id": pid, "role": "admin",
            "project_name": proj["name"], "tenant_id": "tenant-001",
        })
    return ok(user)


@app.route("/v1/user/login", methods=["POST"])
def login():
    return ok({"access_token": "mock-token-001"})


@app.route("/v1/user/register", methods=["POST"])
def register():
    return ok({"access_token": "mock-token-001"})


@app.route("/v1/user/logout", methods=["GET"])
def logout():
    return ok()


@app.route("/v1/user/tenant_info", methods=["GET"])
def tenant_info():
    return ok(MOCK_TENANT)


@app.route("/v1/user/setting", methods=["POST"])
def user_setting():
    return ok()


# ══════════════════════════════════════════════════════════════
# Project RBAC endpoints (/v1/project/*)
# ══════════════════════════════════════════════════════════════
@app.route("/v1/project/create", methods=["POST"])
def project_create():
    data = request.get_json(silent=True) or {}
    name = data.get("name", "").strip()
    if not name:
        return err("Project name is required.")
    pid = str(uuid.uuid4())[:8]
    ts = int(time.time())
    proj = {"id": pid, "tenant_id": "tenant-001", "name": name,
            "description": data.get("description", ""),
            "created_by": MOCK_USER["id"], "status": "1",
            "create_time": ts, "update_time": ts}
    PROJECTS[pid] = proj
    PROJECT_USERS[pid] = [{"id": str(uuid.uuid4())[:8], "user_id": MOCK_USER["id"], "project_id": pid, "role": "admin", "assigned_by": MOCK_USER["id"], "email": MOCK_USER["email"], "nickname": MOCK_USER["nickname"], "avatar": "", "is_superuser": True, "is_active": "1", "create_time": ts, "update_time": ts}]
    return ok(proj)


@app.route("/v1/project/list", methods=["GET"])
def project_list():
    return ok(list(PROJECTS.values()))


@app.route("/v1/project/detail", methods=["GET"])
def project_detail():
    pid = request.args.get("project_id", "")
    proj = PROJECTS.get(pid)
    if not proj:
        return err("Project not found.")
    return ok({"project": proj, "users": PROJECT_USERS.get(pid, []), "current_user_role": "admin"})


@app.route("/v1/project/update", methods=["PUT"])
def project_update():
    data = request.get_json(silent=True) or {}
    pid = data.get("project_id", "")
    proj = PROJECTS.get(pid)
    if not proj:
        return err("Project not found.")
    if data.get("name"):
        proj["name"] = data["name"]
    if "description" in data:
        proj["description"] = data["description"]
    proj["update_time"] = int(time.time())
    return ok(proj)


@app.route("/v1/project/rm", methods=["DELETE"])
def project_rm():
    data = request.get_json(silent=True) or {}
    pid = data.get("project_id", request.args.get("project_id", ""))
    if pid in PROJECTS:
        del PROJECTS[pid]
        PROJECT_USERS.pop(pid, None)
    return ok(True)


@app.route("/v1/project/<pid>/users", methods=["GET"])
def project_users_list(pid):
    return ok(PROJECT_USERS.get(pid, []))


@app.route("/v1/project/<pid>/user", methods=["POST"])
def project_assign_user(pid):
    if pid not in PROJECTS:
        return err("Project not found.")
    data = request.get_json(silent=True) or {}
    ts = int(time.time())
    entry = {"id": str(uuid.uuid4())[:8], "user_id": data.get("user_id", ""), "project_id": pid, "role": data.get("role", "member"), "assigned_by": MOCK_USER["id"], "email": data.get("user_id", ""), "nickname": data.get("user_id", ""), "avatar": "", "is_superuser": False, "is_active": "1", "create_time": ts, "update_time": ts}
    PROJECT_USERS.setdefault(pid, []).append(entry)
    return ok(True, "User assigned to project.")


@app.route("/v1/project/<pid>/user/<uid>", methods=["DELETE"])
def project_remove_user(pid, uid):
    if pid in PROJECT_USERS:
        PROJECT_USERS[pid] = [u for u in PROJECT_USERS[pid] if u["user_id"] != uid]
    return ok(True)


@app.route("/v1/project/<pid>/user/<uid>/role", methods=["PUT"])
def project_update_role(pid, uid):
    data = request.get_json(silent=True) or {}
    if pid in PROJECT_USERS:
        for u in PROJECT_USERS[pid]:
            if u["user_id"] == uid:
                u["role"] = data.get("role", u["role"])
    return ok(True)


# ══════════════════════════════════════════════════════════════
# Admin User Management (/api/v1/admin/users)
# ══════════════════════════════════════════════════════════════
@app.route("/api/v1/admin/users", methods=["GET"])
def admin_list_users():
    """List all users for the admin panel."""
    return ok(ADMIN_USERS)


@app.route("/api/v1/admin/users", methods=["POST"])
def admin_create_user():
    """Create a new user."""
    data = request.get_json(silent=True) or {}
    email = data.get("username", data.get("email", ""))
    if not email:
        return err("Email is required.")
    new_user = {
        "user_id": f"usr-{str(uuid.uuid4())[:8]}",
        "email": email,
        "nickname": data.get("nickname", email.split("@")[0]),
        "is_superuser": False,
        "is_active": "1",
        "status": "1",
        "avatar": "",
        "create_date": time.strftime("%Y-%m-%d %H:%M:%S"),
        "update_date": time.strftime("%Y-%m-%d %H:%M:%S"),
        "last_login_time": "Never",
        "role": data.get("role", "standard"),
        "project_count": 0,
        "projects": [],
    }
    ADMIN_USERS.append(new_user)
    AUDIT_EVENTS.insert(0, {
        "id": f"evt-{str(uuid.uuid4())[:8]}",
        "type": "user_created",
        "user_email": MOCK_USER["email"],
        "user_name": MOCK_USER["nickname"],
        "details": f"Created user {email} with role {new_user['role']}",
        "project": "-",
        "ip_address": "192.168.1.100",
        "timestamp": int(time.time()),
        "time_ago": "just now",
    })
    return ok(True)


@app.route("/api/v1/admin/users/<username>", methods=["GET"])
def admin_get_user(username):
    """Get user details."""
    for u in ADMIN_USERS:
        if u["email"] == username:
            return ok([u])
    return err("User not found.")


@app.route("/api/v1/admin/users/<username>/activate", methods=["PUT"])
def admin_update_user_status(username):
    """Activate or deactivate a user."""
    data = request.get_json(silent=True) or {}
    activate = data.get("activate_status", "on")
    for u in ADMIN_USERS:
        if u["email"] == username:
            u["is_active"] = "1" if activate == "on" else "0"
            u["status"] = "1" if activate == "on" else "0"
            AUDIT_EVENTS.insert(0, {
                "id": f"evt-{str(uuid.uuid4())[:8]}",
                "type": "permission_change",
                "user_email": MOCK_USER["email"],
                "user_name": MOCK_USER["nickname"],
                "details": f"{'Activated' if activate == 'on' else 'Deactivated'} user {username}",
                "project": "-",
                "ip_address": "192.168.1.100",
                "timestamp": int(time.time()),
                "time_ago": "just now",
            })
            return ok(True)
    return err("User not found.")


@app.route("/api/v1/admin/users/<username>", methods=["DELETE"])
def admin_delete_user(username):
    """Delete a user."""
    global ADMIN_USERS
    ADMIN_USERS = [u for u in ADMIN_USERS if u["email"] != username]
    return ok(True)


@app.route("/api/v1/admin/users/<username>/role", methods=["PUT"])
def admin_update_user_role(username):
    """Update user's role."""
    data = request.get_json(silent=True) or {}
    role = data.get("role_name", "standard")
    for u in ADMIN_USERS:
        if u["email"] == username:
            u["role"] = role
            return ok(True)
    return err("User not found.")


@app.route("/api/v1/admin/users/<username>/admin", methods=["PUT"])
def admin_grant_superuser(username):
    """Grant superuser."""
    for u in ADMIN_USERS:
        if u["email"] == username:
            u["is_superuser"] = True
            u["role"] = "super-admin"
            return ok(True)
    return err("User not found.")


@app.route("/api/v1/admin/users/<username>/admin", methods=["DELETE"])
def admin_revoke_superuser(username):
    """Revoke superuser."""
    for u in ADMIN_USERS:
        if u["email"] == username:
            u["is_superuser"] = False
            u["role"] = "standard"
            return ok(True)
    return err("User not found.")


# ══════════════════════════════════════════════════════════════
# Admin Stats (/api/v1/admin/stats)
# ══════════════════════════════════════════════════════════════
@app.route("/api/v1/admin/stats", methods=["GET"])
def admin_stats():
    """System-wide statistics for admin dashboard."""
    active = sum(1 for u in ADMIN_USERS if u["is_active"] == "1")
    superadmins = sum(1 for u in ADMIN_USERS if u.get("is_superuser"))
    deactivated = sum(1 for u in ADMIN_USERS if u["is_active"] != "1")
    return ok({
        "total_users": len(ADMIN_USERS),
        "active_users": active,
        "super_admins": superadmins,
        "deactivated_users": deactivated,
        "total_documents": len(MOCK_DOCUMENTS),
        "documents_processed": sum(1 for d in MOCK_DOCUMENTS if d["status"] == "processed"),
        "documents_processing": sum(1 for d in MOCK_DOCUMENTS if d["status"] == "processing"),
        "documents_failed": sum(1 for d in MOCK_DOCUMENTS if d["status"] == "failed"),
        "total_projects": len(PROJECTS),
        "total_queries": 342,
        "storage_used_mb": 2457,
        "storage_total_mb": 10240,
    })


@app.route("/api/v1/admin/stats/documents", methods=["GET"])
def admin_doc_stats():
    """Document stats for dashboard."""
    return ok({
        "recent_documents": MOCK_DOCUMENTS,
        "total": len(MOCK_DOCUMENTS),
    })


# ══════════════════════════════════════════════════════════════
# Audit Logs (/api/v1/admin/audit)
# ══════════════════════════════════════════════════════════════
@app.route("/api/v1/admin/audit/events", methods=["GET"])
def admin_audit_events():
    """List audit events with optional filters."""
    event_type = request.args.get("event_type", "")
    user_email = request.args.get("user_email", "")
    limit = int(request.args.get("limit", 50))

    filtered = AUDIT_EVENTS
    if event_type:
        filtered = [e for e in filtered if e["type"] == event_type]
    if user_email:
        filtered = [e for e in filtered if e["user_email"] == user_email]

    return ok({"events": filtered[:limit], "total": len(filtered)})


# ══════════════════════════════════════════════════════════════
# Stub endpoints (keep frontend from crashing)
# ══════════════════════════════════════════════════════════════
@app.route("/v1/kb/list", methods=["GET", "POST"])
def kb_list():
    return ok({"kbs": [], "total": 0})


@app.route("/v1/dialog/list", methods=["GET"])
def dialog_list():
    return ok([])


@app.route("/v1/dialog/next", methods=["GET"])
def dialog_next():
    return ok({"dialogs": [], "total": 0})


@app.route("/v1/llm/factories", methods=["GET"])
def llm_factories():
    return ok([])


@app.route("/v1/llm/list", methods=["GET"])
def llm_list():
    return ok([])


@app.route("/v1/llm/my_llms", methods=["GET"])
def my_llms():
    return ok({})


@app.route("/v1/system/config", methods=["GET"])
def system_config():
    return ok({"registerEnabled": 1, "languages": ["English", "Hindi"]})


@app.route("/v1/system/version", methods=["GET"])
def system_version():
    return ok({"version": "0.24.0-rbac-demo"})


@app.route("/v1/system/status", methods=["GET"])
def system_status():
    return ok({
        "es": {"status": "green", "elapsed": 0.01, "error": "", "number_of_nodes": 1, "active_shards": 1},
        "storage": {"status": "green", "elapsed": 0.01, "error": ""},
        "database": {"status": "green", "elapsed": 0.01, "error": ""},
        "redis": {"status": "green", "elapsed": 0.01, "error": "", "pending": 0},
        "task_executor_heartbeat": {},
    })


@app.route("/v1/conversation/list", methods=["GET"])
def conversation_list():
    return ok([])


@app.route("/v1/file/list", methods=["GET"])
def file_list():
    return ok({"files": [], "total": 0})


@app.route("/v1/search/list", methods=["GET"])
def search_list():
    return ok({"list": [], "total": 0})


@app.route("/v1/canvas/list", methods=["GET"])
def canvas_list():
    return ok([])


@app.route("/v1/connector/list", methods=["GET"])
def connector_list():
    return ok([])


@app.route("/api/v1/memories", methods=["GET"])
def memory_list():
    return ok([])


@app.route("/api/v1/admin/login", methods=["POST"])
def admin_login():
    return ok({"access_token": "mock-admin-token-001"})


@app.route("/api/v1/admin/logout", methods=["GET"])
def admin_logout():
    return ok()


@app.route("/api/v1/admin/services", methods=["GET"])
def admin_services():
    return ok([])


@app.route("/api/v1/admin/roles", methods=["GET"])
def admin_roles():
    return ok({"roles": [], "total": 0})


@app.route("/api/v1/admin/version", methods=["GET"])
def admin_version():
    return ok({"version": "0.24.0-rbac-demo"})


# ── Catch-all for any other endpoints ──────────────────────────
@app.route("/v1/<path:path>", methods=["GET", "POST", "PUT", "DELETE"])
def catch_all(path):
    return ok([])


@app.route("/api/v1/<path:path>", methods=["GET", "POST", "PUT", "DELETE"])
def catch_all_api(path):
    return ok([])


if __name__ == "__main__":
    print()
    print("=" * 60)
    print("  RBAC Demo Mock Server (v4 — Fully Connected)")
    print("  Listening on http://0.0.0.0:9380")
    print("=" * 60)
    print(f"  User: admin@emami.com (Super Admin)")
    print(f"  Projects: {len(PROJECTS)} | Users: {len(ADMIN_USERS)} | Docs: {len(MOCK_DOCUMENTS)}")
    print()
    print("  Connected endpoints:")
    print("    /v1/user/*                -> Auth + user info")
    print("    /v1/project/*             -> Project CRUD")
    print("    /api/v1/admin/users       -> User management")
    print("    /api/v1/admin/stats       -> System stats")
    print("    /api/v1/admin/audit/*     -> Audit events")
    print("    /api/v1/admin/stats/docs  -> Document stats")
    print("=" * 60)
    print()
    app.run(host="0.0.0.0", port=9380, debug=False)
