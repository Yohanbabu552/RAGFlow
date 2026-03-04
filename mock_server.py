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
    "llm_id": "qwen2.5:latest@Ollama",
    "embd_id": "BAAI/bge-large-en-v1.5@Ollama",
    "asr_id": "",
    "img2txt_id": "minicpm-v:latest@Ollama",
    "rerank_id": "", "tts_id": "",
    "parser_ids": "naive:General,qa:Q&A,table:Table,resume:Resume,manual:Manual,paper:Paper,book:Book,laws:Laws,presentation:Presentation,one:One,knowledge_graph:Knowledge Graph",
    "role": "owner",
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
# Knowledge Base / Dataset endpoints (full CRUD + detail)
# ══════════════════════════════════════════════════════════════
MOCK_KBS = []
# In-memory document store keyed by kb_id
MOCK_KB_DOCS = {}   # { kb_id: [ {doc}, ... ] }


def _make_default_kb(kb_id):
    """Return a fallback KB object so detail pages never crash."""
    return {
        "kb_id": kb_id, "id": kb_id, "name": "Knowledge Base",
        "description": "", "tenant_id": "tenant-001",
        "embd_id": "BAAI/bge-large-en-v1.5@Ollama",
        "parser_id": "naive",
        "parser_config": {"enable_metadata": False},
        "permission": "me", "language": "English",
        "chunk_num": 0, "document_count": 0, "doc_num": 0,
        "token_num": 0, "chunk_count": 0,
        "status": "1",
        "create_time": int(time.time()),
        "create_date": time.strftime("%Y-%m-%d %H:%M:%S"),
        "update_time": int(time.time()),
        "update_date": time.strftime("%Y-%m-%d %H:%M:%S"),
    }


def _find_kb(kb_id):
    for kb in MOCK_KBS:
        if kb.get("kb_id") == kb_id or kb.get("id") == kb_id:
            return kb
    return None


@app.route("/v1/kb/list", methods=["GET", "POST"])
def kb_list():
    return ok({"kbs": MOCK_KBS, "total": len(MOCK_KBS)})


@app.route("/v1/kb/create", methods=["POST"])
def kb_create():
    data = request.get_json(silent=True) or {}
    kb_id = str(uuid.uuid4())[:12]
    ts = int(time.time())
    kb = {
        "kb_id": kb_id, "id": kb_id,
        "name": data.get("name", "Untitled"),
        "description": data.get("description", ""),
        "tenant_id": "tenant-001",
        "embd_id": data.get("embd_id", "BAAI/bge-large-en-v1.5@Ollama"),
        "parser_id": data.get("parser_id", "naive"),
        "parser_config": data.get("parser_config", {"enable_metadata": False}),
        "permission": data.get("permission", "me"),
        "language": data.get("language", "English"),
        "chunk_num": 0, "document_count": 0, "doc_num": 0,
        "token_num": 0, "chunk_count": 0,
        "status": "1",
        "create_time": ts, "update_time": ts,
        "create_date": time.strftime("%Y-%m-%d %H:%M:%S"),
        "update_date": time.strftime("%Y-%m-%d %H:%M:%S"),
    }
    MOCK_KBS.append(kb)
    MOCK_KB_DOCS[kb_id] = []
    return ok(kb)


@app.route("/v1/kb/detail", methods=["GET"])
def kb_detail_query():
    """GET /v1/kb/detail?kb_id=xxx  — used by useFetchKnowledgeBaseConfiguration."""
    kb_id = request.args.get("kb_id", "")
    kb = _find_kb(kb_id)
    return ok(kb if kb else _make_default_kb(kb_id))


@app.route("/v1/kb/<kb_id>", methods=["GET"])
def kb_detail_path(kb_id):
    """GET /v1/kb/<kb_id>  — alternative path-based detail."""
    kb = _find_kb(kb_id)
    return ok(kb if kb else _make_default_kb(kb_id))


@app.route("/v1/kb/basic_info", methods=["GET"])
def kb_basic_info():
    kb_id = request.args.get("kb_id", "")
    kb = _find_kb(kb_id)
    return ok(kb if kb else _make_default_kb(kb_id))


@app.route("/v1/kb/get_meta", methods=["GET"])
def kb_get_meta():
    return ok({"metadata": {}})


@app.route("/v1/kb/check_embedding", methods=["POST"])
def kb_check_embedding():
    return ok(True)


@app.route("/v1/kb/update", methods=["POST", "PUT"])
def kb_update():
    data = request.get_json(silent=True) or {}
    kb_id = data.get("kb_id", "")
    kb = _find_kb(kb_id)
    if kb:
        for key in ("name", "description", "parser_id", "parser_config",
                     "permission", "language", "embd_id"):
            if key in data:
                kb[key] = data[key]
        kb["update_time"] = int(time.time())
        kb["update_date"] = time.strftime("%Y-%m-%d %H:%M:%S")
    return ok(True)


@app.route("/v1/kb/rm", methods=["DELETE", "POST"])
def kb_rm():
    data = request.get_json(silent=True) or {}
    kb_id = data.get("kb_id", "")
    global MOCK_KBS
    MOCK_KBS = [kb for kb in MOCK_KBS if kb.get("kb_id") != kb_id and kb.get("id") != kb_id]
    MOCK_KB_DOCS.pop(kb_id, None)
    return ok(True)


@app.route("/v1/kb/update_metadata_setting", methods=["POST"])
def kb_update_metadata_setting():
    return ok(True)


@app.route("/v1/kb/<kb_id>/tags", methods=["GET"])
def kb_tags(kb_id):
    return ok([])


@app.route("/v1/kb/<kb_id>/rm_tags", methods=["POST"])
def kb_rm_tags(kb_id):
    return ok(True)


@app.route("/v1/kb/<kb_id>/rename_tag", methods=["POST"])
def kb_rename_tag(kb_id):
    return ok(True)


@app.route("/v1/kb/tags", methods=["GET"])
def kb_tags_multi():
    return ok([])


@app.route("/v1/kb/<kb_id>/knowledge_graph", methods=["GET"])
def kb_knowledge_graph(kb_id):
    return ok({"graph": {"nodes": [], "edges": []}})


@app.route("/v1/kb/run_graphrag", methods=["POST"])
def kb_run_graphrag():
    return ok(True)


@app.route("/v1/kb/trace_graphrag", methods=["GET"])
def kb_trace_graphrag():
    return ok({"status": "idle"})


@app.route("/v1/kb/run_raptor", methods=["POST"])
def kb_run_raptor():
    return ok(True)


@app.route("/v1/kb/trace_raptor", methods=["GET"])
def kb_trace_raptor():
    return ok({"status": "idle"})


@app.route("/v1/kb/list_pipeline_logs", methods=["POST"])
def kb_pipeline_logs():
    return ok({"logs": [], "total": 0})


@app.route("/v1/kb/pipeline_log_detail", methods=["GET"])
def kb_pipeline_log_detail():
    return ok({})


@app.route("/v1/kb/list_pipeline_dataset_logs", methods=["POST"])
def kb_pipeline_dataset_logs():
    return ok({"logs": [], "total": 0})


@app.route("/v1/kb/unbind_task", methods=["DELETE"])
def kb_unbind_task():
    return ok(True)


# ══════════════════════════════════════════════════════════════
# Document endpoints (list, upload, parse, filter, etc.)
# ══════════════════════════════════════════════════════════════
@app.route("/v1/document/list", methods=["GET", "POST"])
def document_list():
    """List documents in a knowledge base — used by useFetchDocumentList.
    kb_id comes as a QUERY PARAMETER, filters come in the POST body."""
    # kb_id is always a query param (the frontend sends it via params, not body)
    kb_id = request.args.get("kb_id", "")
    page = int(request.args.get("page", 1))
    page_size = int(request.args.get("page_size", 30))
    keywords = request.args.get("keywords", "")

    docs = MOCK_KB_DOCS.get(kb_id, [])

    # Simple keyword search on doc name
    if keywords:
        docs = [d for d in docs if keywords.lower() in d.get("name", "").lower()]

    start = (page - 1) * page_size
    return ok({"docs": docs[start:start + page_size], "total": len(docs)})


@app.route("/v1/document/upload", methods=["POST"])
def document_upload():
    """Accept file uploads and store mock document records."""
    kb_id = request.form.get("kb_id", "")
    if kb_id not in MOCK_KB_DOCS:
        MOCK_KB_DOCS[kb_id] = []
    uploaded = []
    files = request.files.getlist("file")
    for f in files:
        doc_id = str(uuid.uuid4())[:12]
        ts = int(time.time())
        ext = f.filename.rsplit(".", 1)[-1].lower() if "." in f.filename else "bin"
        doc = {
            "id": doc_id, "doc_id": doc_id,
            "kb_id": kb_id,
            "name": f.filename,
            "location": f.filename,
            "size": 0,
            "type": ext,
            "suffix": f".{ext}",
            "source_type": "local",
            "parser_id": "naive",
            "parser_config": {},
            "run": "0",
            "progress": 0.0,
            "progress_msg": "",
            "process_begin_at": None,
            "process_duration": 0,
            "status": "1",
            "chunk_num": 42, "token_num": 3200,
            "create_time": ts, "update_time": ts,
            "create_date": time.strftime("%Y-%m-%d %H:%M:%S"),
            "update_date": time.strftime("%Y-%m-%d %H:%M:%S"),
            "created_by": MOCK_USER["nickname"],
            "thumbnail": None,
            "run": "1", "progress": 1.0, "progress_msg": "Done (mock)",
        }
        MOCK_KB_DOCS[kb_id].append(doc)
        uploaded.append(doc)
        # Discard actual file content (mock server)
        f.read()
    # Update KB doc count + chunk count
    kb = _find_kb(kb_id)
    if kb:
        all_docs = MOCK_KB_DOCS.get(kb_id, [])
        kb["document_count"] = len(all_docs)
        kb["doc_num"] = kb["document_count"]
        kb["chunk_num"] = sum(d.get("chunk_num", 0) for d in all_docs)
        kb["token_num"] = sum(d.get("token_num", 0) for d in all_docs)
    return ok(uploaded)


@app.route("/v1/document/filter", methods=["GET", "POST"])
def document_filter():
    """Return available filter options for documents in a KB."""
    kb_id = request.args.get("kb_id", "")
    if not kb_id:
        data = request.get_json(silent=True) or {}
        kb_id = data.get("kb_id", "")
    docs = MOCK_KB_DOCS.get(kb_id, [])
    suffixes = {}
    for d in docs:
        s = d.get("suffix", "")
        if s:
            suffixes[s] = suffixes.get(s, 0) + 1
    return ok({
        "filter": {
            "run_status": {"0": len(docs)},
            "suffix": suffixes,
            "metadata": {},
        }
    })


@app.route("/v1/document/run", methods=["POST"])
def document_run():
    """Simulate starting document parsing."""
    data = request.get_json(silent=True) or {}
    doc_ids = data.get("doc_ids", [])
    run_flag = data.get("run", 1)
    affected_kbs = set()
    # Mark docs as processing/parsed
    for kb_id, docs in MOCK_KB_DOCS.items():
        for doc in docs:
            if doc["id"] in doc_ids or doc.get("doc_id") in doc_ids:
                affected_kbs.add(kb_id)
                if run_flag:
                    doc["run"] = "1"
                    doc["progress"] = 1.0
                    doc["progress_msg"] = "Done (mock)"
                    doc["chunk_num"] = 42
                    doc["token_num"] = 3200
                else:
                    doc["run"] = "0"
                    doc["progress"] = 0.0
                    doc["chunk_num"] = 0
                    doc["token_num"] = 0
    # Update parent KB chunk counts
    for kb_id in affected_kbs:
        kb = _find_kb(kb_id)
        if kb:
            all_docs = MOCK_KB_DOCS.get(kb_id, [])
            kb["chunk_num"] = sum(d.get("chunk_num", 0) for d in all_docs)
            kb["token_num"] = sum(d.get("token_num", 0) for d in all_docs)
    return ok(True)


@app.route("/v1/document/create", methods=["POST"])
def document_create():
    data = request.get_json(silent=True) or {}
    kb_id = data.get("kb_id", "")
    doc_id = str(uuid.uuid4())[:12]
    ts = int(time.time())
    doc = {
        "id": doc_id, "doc_id": doc_id, "kb_id": kb_id,
        "name": data.get("name", "Untitled.txt"),
        "location": data.get("name", "Untitled.txt"),
        "size": 0, "type": "txt", "suffix": ".txt",
        "source_type": "local", "parser_id": "naive", "parser_config": {},
        "run": "1", "progress": 1.0, "progress_msg": "Done (mock)", "status": "1",
        "chunk_num": 42, "token_num": 3200,
        "create_time": ts, "update_time": ts,
        "create_date": time.strftime("%Y-%m-%d %H:%M:%S"),
        "update_date": time.strftime("%Y-%m-%d %H:%M:%S"),
        "created_by": MOCK_USER["nickname"], "thumbnail": None,
    }
    MOCK_KB_DOCS.setdefault(kb_id, []).append(doc)
    # Update parent KB chunk counts
    kb = _find_kb(kb_id)
    if kb:
        all_docs = MOCK_KB_DOCS.get(kb_id, [])
        kb["document_count"] = len(all_docs)
        kb["doc_num"] = kb["document_count"]
        kb["chunk_num"] = sum(d.get("chunk_num", 0) for d in all_docs)
        kb["token_num"] = sum(d.get("token_num", 0) for d in all_docs)
    return ok(doc)


@app.route("/v1/document/rename", methods=["POST"])
def document_rename():
    return ok(True)


@app.route("/v1/document/change_status", methods=["POST"])
def document_change_status():
    return ok(True)


@app.route("/v1/document/rm", methods=["POST"])
def document_rm():
    data = request.get_json(silent=True) or {}
    doc_ids = data.get("doc_ids", data.get("doc_id", []))
    if isinstance(doc_ids, str):
        doc_ids = [doc_ids]
    for kb_id in MOCK_KB_DOCS:
        MOCK_KB_DOCS[kb_id] = [d for d in MOCK_KB_DOCS[kb_id] if d["id"] not in doc_ids]
    return ok(True)


@app.route("/v1/document/delete", methods=["DELETE"])
def document_delete():
    return ok(True)


@app.route("/v1/document/change_parser", methods=["POST"])
def document_change_parser():
    return ok(True)


@app.route("/v1/document/thumbnails", methods=["GET"])
def document_thumbnails():
    return ok({})


@app.route("/v1/document/get", methods=["GET"])
def document_get():
    return ok({})


@app.route("/v1/document/download/<doc_id>", methods=["GET"])
def document_download(doc_id):
    return ok({})


@app.route("/v1/document/web_crawl", methods=["POST"])
def document_web_crawl():
    return ok(True)


@app.route("/v1/document/infos", methods=["POST"])
def document_infos():
    return ok([])


@app.route("/v1/document/set_meta", methods=["POST"])
def document_set_meta():
    return ok(True)


@app.route("/v1/document/parse", methods=["POST"])
def document_parse():
    return ok(True)


@app.route("/v1/document/upload_info", methods=["POST"])
def document_upload_info():
    return ok(True)


@app.route("/v1/document/metadata/summary", methods=["POST"])
def document_metadata_summary():
    return ok({"metadata": {}})


@app.route("/v1/document/metadata/update", methods=["POST"])
def document_metadata_update():
    return ok(True)


@app.route("/v1/document/update_metadata_setting", methods=["POST"])
def document_update_metadata_setting():
    return ok(True)


# ══════════════════════════════════════════════════════════════
# Chunk / Retrieval endpoints
# ══════════════════════════════════════════════════════════════
@app.route("/v1/chunk/list", methods=["POST"])
def chunk_list():
    return ok({"chunks": [], "total": 0, "doc": {}})


@app.route("/v1/chunk/create", methods=["POST"])
def chunk_create():
    return ok({"chunk_id": str(uuid.uuid4())[:12]})


@app.route("/v1/chunk/set", methods=["POST"])
def chunk_set():
    return ok(True)


@app.route("/v1/chunk/get", methods=["GET"])
def chunk_get():
    return ok({})


@app.route("/v1/chunk/switch", methods=["POST"])
def chunk_switch():
    return ok(True)


@app.route("/v1/chunk/rm", methods=["POST"])
def chunk_rm():
    return ok(True)


@app.route("/v1/chunk/retrieval_test", methods=["POST"])
def chunk_retrieval_test():
    return ok({"chunks": [], "total": 0, "doc_aggs": []})


@app.route("/v1/chunk/knowledge_graph", methods=["GET"])
def chunk_knowledge_graph():
    return ok({"graph": {"nodes": [], "edges": []}})


# ══════════════════════════════════════════════════════════════
# Dialog / Chat endpoints  (full CRUD + conversations)
# ══════════════════════════════════════════════════════════════

def _make_dialog(dialog_id, name, **overrides):
    """Build a properly-shaped dialog (chat assistant) object."""
    ts = int(time.time())
    d = {
        "id": dialog_id, "dialog_id": dialog_id,
        "name": name,
        "description": overrides.get("description", ""),
        "icon": overrides.get("icon", ""),
        "language": "English",
        "kb_ids": overrides.get("kb_ids", []),
        "kb_names": overrides.get("kb_names", []),
        "llm_id": overrides.get("llm_id", MOCK_TENANT["llm_id"]),
        "llm_setting": {"temperature": 0.1, "max_tokens": 4096, "top_p": 0.3,
                        "frequency_penalty": 0.7, "presence_penalty": 0.4},
        "llm_setting_type": "Precise",
        "prompt_config": {
            "system": overrides.get("system", "You are a helpful AI assistant. Answer questions using only the provided knowledge base."),
            "prologue": overrides.get("prologue", "Hi! I'm your AI assistant. Ask me anything about the linked knowledge bases."),
            "empty_response": overrides.get("empty_response", "Sorry, I couldn't find relevant information. Please try rephrasing."),
            "quote": True, "keyword": True, "refine_multiturn": True,
            "use_kg": False, "tts": False, "parameters": [],
        },
        "prompt_type": "simple",
        "top_k": 1024, "top_n": 8,
        "similarity_threshold": 0.2, "vector_similarity_weight": 0.3,
        "meta_data_filter": {},
        "status": "1",
        "tenant_id": "tenant-001",
        "create_time": ts, "update_time": ts,
        "create_date": time.strftime("%Y-%m-%d %H:%M:%S"),
        "update_date": time.strftime("%Y-%m-%d %H:%M:%S"),
    }
    d.update({k: v for k, v in overrides.items() if k not in ("system", "prologue", "empty_response")})
    return d


def _make_conversation(conv_id, dialog_id, name="New conversation", messages=None):
    ts = int(time.time())
    return {
        "id": conv_id, "dialog_id": dialog_id,
        "name": name, "avatar": "",
        "message": messages or [],
        "reference": [],
        "is_new": True,
        "create_time": ts, "update_time": ts,
        "create_date": time.strftime("%Y-%m-%d %H:%M:%S"),
        "update_date": time.strftime("%Y-%m-%d %H:%M:%S"),
    }


# In-memory stores
MOCK_DIALOGS = {}       # { dialog_id: dialog_obj }
MOCK_CONVERSATIONS = {} # { conv_id: conversation_obj }


@app.route("/v1/dialog/list", methods=["GET"])
def dialog_list():
    return ok(list(MOCK_DIALOGS.values()))


@app.route("/v1/dialog/next", methods=["GET", "POST"])
def dialog_next():
    """List dialogs with pagination & keyword search."""
    if request.method == "POST":
        data = request.get_json(silent=True) or {}
    else:
        data = {}
    keywords = data.get("keywords", request.args.get("keywords", ""))
    page = int(data.get("page", request.args.get("page", 1)))
    page_size = int(data.get("page_size", request.args.get("page_size", 30)))
    dialogs = list(MOCK_DIALOGS.values())
    if keywords:
        dialogs = [d for d in dialogs if keywords.lower() in d["name"].lower()]
    dialogs.sort(key=lambda d: d.get("update_time", 0), reverse=True)
    start = (page - 1) * page_size
    return ok({"dialogs": dialogs[start:start + page_size], "total": len(dialogs)})


@app.route("/v1/dialog/get", methods=["GET"])
def dialog_get():
    """Fetch a single dialog by dialogId query param."""
    dialog_id = request.args.get("dialogId", request.args.get("dialog_id", ""))
    d = MOCK_DIALOGS.get(dialog_id)
    if d:
        return ok(d)
    return err("Dialog not found.")


@app.route("/v1/dialog/set", methods=["POST"])
def dialog_set():
    """Create or update a dialog (chat assistant)."""
    data = request.get_json(silent=True) or {}
    dialog_id = data.get("dialog_id", "")
    if dialog_id and dialog_id in MOCK_DIALOGS:
        # Update existing
        d = MOCK_DIALOGS[dialog_id]
        for key in ("name", "description", "icon", "kb_ids", "kb_names",
                     "llm_id", "llm_setting", "llm_setting_type",
                     "prompt_config", "prompt_type",
                     "top_k", "top_n", "similarity_threshold",
                     "vector_similarity_weight", "meta_data_filter"):
            if key in data:
                d[key] = data[key]
        d["update_time"] = int(time.time())
        d["update_date"] = time.strftime("%Y-%m-%d %H:%M:%S")
        return ok(d)
    else:
        # Create new
        new_id = data.pop("dialog_id", None) or str(uuid.uuid4())[:12]
        name = data.pop("name", "Untitled Chat")
        d = _make_dialog(new_id, name, **data)
        MOCK_DIALOGS[new_id] = d
        return ok(d)


@app.route("/v1/dialog/rm", methods=["DELETE", "POST"])
def dialog_rm():
    data = request.get_json(silent=True) or {}
    dialog_ids = data.get("dialogIds", data.get("dialog_ids", []))
    if isinstance(dialog_ids, str):
        dialog_ids = [dialog_ids]
    for did in dialog_ids:
        MOCK_DIALOGS.pop(did, None)
        # Remove conversations for this dialog
        to_rm = [cid for cid, c in MOCK_CONVERSATIONS.items() if c["dialog_id"] == did]
        for cid in to_rm:
            del MOCK_CONVERSATIONS[cid]
    return ok(True)


# ── Conversation (chat session) endpoints ─────────────────────
@app.route("/v1/conversation/list", methods=["GET"])
def conversation_list():
    """List conversations for a dialog."""
    dialog_id = request.args.get("dialog_id", "")
    convs = [c for c in MOCK_CONVERSATIONS.values() if c["dialog_id"] == dialog_id]
    convs.sort(key=lambda c: c.get("update_time", 0), reverse=True)
    return ok(convs)


@app.route("/v1/conversation/get", methods=["GET"])
def conversation_get():
    """Get a single conversation with message history."""
    conv_id = request.args.get("conversationId", request.args.get("conversation_id", ""))
    c = MOCK_CONVERSATIONS.get(conv_id)
    if c:
        return ok(c)
    return err("Conversation not found.")


@app.route("/v1/conversation/set", methods=["POST"])
def conversation_set():
    """Create or update a conversation."""
    data = request.get_json(silent=True) or {}
    conv_id = data.get("conversation_id", "")
    if conv_id and conv_id in MOCK_CONVERSATIONS:
        # Update
        c = MOCK_CONVERSATIONS[conv_id]
        if "name" in data:
            c["name"] = data["name"]
        if "message" in data:
            c["message"] = data["message"]
        c["update_time"] = int(time.time())
        c["update_date"] = time.strftime("%Y-%m-%d %H:%M:%S")
        c["is_new"] = False
        return ok(c)
    else:
        # Create
        new_id = conv_id or str(uuid.uuid4())[:12]
        dialog_id = data.get("dialog_id", "")
        name = data.get("name", "New conversation")
        c = _make_conversation(new_id, dialog_id, name)
        MOCK_CONVERSATIONS[new_id] = c
        return ok(c)


@app.route("/v1/conversation/rm", methods=["POST"])
def conversation_rm():
    data = request.get_json(silent=True) or {}
    conv_ids = data.get("conversationIds", data.get("conversation_ids", []))
    if isinstance(conv_ids, str):
        conv_ids = [conv_ids]
    for cid in conv_ids:
        MOCK_CONVERSATIONS.pop(cid, None)
    return ok(True)


@app.route("/v1/conversation/delete", methods=["DELETE", "POST"])
def conversation_delete():
    return conversation_rm()


@app.route("/v1/conversation/completion", methods=["POST"])
def conversation_completion():
    """Mock streaming chat response (SSE)."""
    data = request.get_json(silent=True) or {}
    conv_id = data.get("conversation_id", "")
    messages = data.get("messages", [])

    # Get the last user message
    user_msg = ""
    for m in reversed(messages):
        if m.get("role") == "user":
            user_msg = m.get("content", "")
            break

    # Store user message in conversation
    if conv_id and conv_id in MOCK_CONVERSATIONS:
        c = MOCK_CONVERSATIONS[conv_id]
        c["message"].append({"id": str(uuid.uuid4())[:12], "content": user_msg, "role": "user"})

    # Build a mock AI answer
    mock_answer = (
        f"Based on the documents in your knowledge base, here is what I found regarding your query:\n\n"
        f"**Summary:** The information related to \"{user_msg[:80]}\" indicates that the relevant data "
        f"has been processed and indexed. The key findings from the uploaded documents suggest "
        f"comprehensive coverage of this topic.\n\n"
        f"*Source: Knowledge Base Documents*"
    )

    msg_id = str(uuid.uuid4())[:12]

    # Store assistant message
    if conv_id and conv_id in MOCK_CONVERSATIONS:
        c = MOCK_CONVERSATIONS[conv_id]
        c["message"].append({"id": msg_id, "content": mock_answer, "role": "assistant"})
        c["is_new"] = False
        c["update_time"] = int(time.time())
        if user_msg:
            c["name"] = user_msg[:40]

    # Return SSE stream
    import json as _json

    def generate():
        # Send message event with the full answer
        event_data = {
            "event": "message",
            "message_id": msg_id,
            "session_id": conv_id,
            "created_at": int(time.time()),
            "task_id": str(uuid.uuid4())[:8],
            "data": {"content": mock_answer, "audio_binary": "", "outputs": None},
        }
        yield f"data: {_json.dumps(event_data)}\n\n"

        # Send message_end event with references
        end_data = {
            "event": "message_end",
            "message_id": msg_id,
            "session_id": conv_id,
            "created_at": int(time.time()),
            "task_id": str(uuid.uuid4())[:8],
            "data": {
                "reference": {
                    "chunks": [
                        {
                            "id": "chunk-mock-001",
                            "content": None,
                            "document_id": "doc-mock-001",
                            "document_name": "Knowledge_Base_Document.pdf",
                            "dataset_id": "kb-mock-001",
                            "image_id": "",
                            "similarity": 0.85,
                            "vector_similarity": 0.82,
                            "term_similarity": 0.88,
                            "positions": [],
                        }
                    ],
                    "doc_aggs": [
                        {"count": 1, "doc_id": "doc-mock-001", "doc_name": "Knowledge_Base_Document.pdf"}
                    ],
                    "total": 1,
                },
            },
        }
        yield f"data: {_json.dumps(end_data)}\n\n"

    from flask import Response
    return Response(generate(), mimetype="text/event-stream",
                    headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"})


@app.route("/v1/conversation/thumbup", methods=["POST"])
def conversation_thumbup():
    return ok(True)


@app.route("/v1/conversation/tts", methods=["POST"])
def conversation_tts():
    return ok({"audio": ""})


@app.route("/v1/conversation/ask", methods=["POST"])
def conversation_ask():
    return ok({"answer": "This is a mock search answer.", "reference": {"chunks": [], "doc_aggs": [], "total": 0}})


@app.route("/v1/conversation/mindmap", methods=["POST"])
def conversation_mindmap():
    return ok({"mindmap": ""})


@app.route("/v1/conversation/related_questions", methods=["POST"])
def conversation_related_questions():
    return ok({"questions": ["What are the key features?", "How does it compare?", "What are the latest updates?"]})


@app.route("/v1/conversation/delete_msg", methods=["POST"])
def conversation_delete_msg():
    return ok(True)


# ══════════════════════════════════════════════════════════════
# LLM endpoints — full mock (no real API keys needed)
# ══════════════════════════════════════════════════════════════
MOCK_LLM_LIST = {
    "Ollama": [
        {"llm_name": "BAAI/bge-large-en-v1.5", "model_type": "embedding", "available": True, "fid": "Ollama", "max_tokens": 512, "status": "1"},
        {"llm_name": "qwen2.5:latest", "model_type": "chat", "available": True, "fid": "Ollama", "max_tokens": 8192, "status": "1"},
        {"llm_name": "minicpm-v:latest", "model_type": "image2text", "available": True, "fid": "Ollama", "max_tokens": 4096, "status": "1"},
    ],
}

MOCK_LLM_FACTORIES = [
    {"name": "Ollama", "logo": "", "tags": "LLM,TEXT EMBEDDING,IMAGE2TEXT",
     "status": "1", "llm": [
         {"llm_name": "BAAI/bge-large-en-v1.5", "model_type": "embedding", "tags": "TEXT EMBEDDING", "status": "1"},
         {"llm_name": "qwen2.5:latest", "model_type": "chat", "tags": "LLM,CHAT", "status": "1"},
         {"llm_name": "minicpm-v:latest", "model_type": "image2text", "tags": "IMAGE2TEXT,CHAT", "status": "1"},
     ]},
]


@app.route("/v1/llm/factories", methods=["GET"])
def llm_factories():
    return ok(MOCK_LLM_FACTORIES)


@app.route("/v1/llm/list", methods=["GET"])
def llm_list():
    return ok(MOCK_LLM_LIST)


@app.route("/v1/llm/my_llms", methods=["GET"])
def my_llms():
    return ok(MOCK_LLM_LIST)


@app.route("/v1/llm/set_api_key", methods=["POST"])
def llm_set_api_key():
    """Accept (and ignore) API key saves — no real keys needed for demo."""
    data = request.get_json(silent=True) or {}
    factory = data.get("llm_factory", "Unknown")
    # Add factory to our mock list if not already there
    if factory not in MOCK_LLM_LIST:
        MOCK_LLM_LIST[factory] = []
        MOCK_LLM_FACTORIES.append({
            "name": factory, "logo": "", "tags": "LLM", "status": "1", "llm": [],
        })
    return ok(True)


@app.route("/v1/llm/add_llm", methods=["POST"])
def llm_add():
    """Add a new LLM model to the mock list."""
    data = request.get_json(silent=True) or {}
    factory = data.get("llm_factory", data.get("fid", "Ollama"))
    model_name = data.get("llm_name", data.get("model_name", "custom-model"))
    model_type = data.get("model_type", "chat")
    new_model = {
        "llm_name": model_name, "model_type": model_type,
        "available": True, "fid": factory, "max_tokens": 4096, "status": "1",
    }
    MOCK_LLM_LIST.setdefault(factory, []).append(new_model)
    return ok(True)


@app.route("/v1/llm/delete_llm", methods=["POST"])
def llm_delete():
    return ok(True)


@app.route("/v1/llm/enable_llm", methods=["POST"])
def llm_enable():
    return ok(True)


@app.route("/v1/llm/delete_factory", methods=["POST"])
def llm_delete_factory():
    return ok(True)


@app.route("/v1/user/set_tenant_info", methods=["POST"])
def set_tenant_info():
    """Save system model settings (chat model, embedding model, etc.)."""
    data = request.get_json(silent=True) or {}
    for key in ("llm_id", "embd_id", "asr_id", "img2txt_id", "rerank_id", "tts_id", "name"):
        if key in data:
            MOCK_TENANT[key] = data[key]
    return ok(True)


# ══════════════════════════════════════════════════════════════
# System & Misc endpoints
# ══════════════════════════════════════════════════════════════
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


@app.route("/v1/file/list", methods=["GET"])
def file_list():
    return ok({"files": [], "total": 0})


@app.route("/v1/file/upload", methods=["POST"])
def file_upload():
    return ok(True)


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
    """Return empty but valid data for unknown endpoints."""
    return ok({})


@app.route("/api/v1/<path:path>", methods=["GET", "POST", "PUT", "DELETE"])
def catch_all_api(path):
    return ok({})


if __name__ == "__main__":
    print()
    print("=" * 60)
    print("  RBAC Demo Mock Server (v5 — Full Dataset + Upload)")
    print("  Listening on http://0.0.0.0:9380")
    print("=" * 60)
    print(f"  User: admin@emami.com (Super Admin)")
    print(f"  Projects: {len(PROJECTS)} | Users: {len(ADMIN_USERS)} | Docs: {len(MOCK_DOCUMENTS)}")
    print(f"  LLM providers: {list(MOCK_LLM_LIST.keys())} (no real API keys needed)")
    print()
    print("  Endpoints:")
    print("    /v1/user/*                -> Auth + user info + tenant settings")
    print("    /v1/project/*             -> Project CRUD")
    print("    /v1/kb/*                  -> Dataset CRUD + detail")
    print("    /v1/document/*            -> Upload, list, parse, filter")
    print("    /v1/chunk/*               -> Chunk CRUD + retrieval")
    print("    /v1/llm/*                 -> LLM config (no keys needed)")
    print("    /v1/dialog/*              -> Chat dialogs")
    print("    /api/v1/admin/*           -> Admin panel")
    print("=" * 60)
    print()
    app.run(host="0.0.0.0", port=9380, debug=False)
