"""
Lightweight mock API server for RBAC UI demo.

Fakes just enough endpoints for the frontend to render:
- /v1/user/info       -> returns a Super Admin user with project_roles
- /v1/user/login      -> returns a fake token
- /v1/project/*       -> CRUD for projects (in-memory)
- /v1/kb/list         -> empty dataset list
- /v1/dialog/*        -> empty chat list
- /v1/user/tenant_info -> tenant info

Pre-seeded with 3 demo projects to show RBAC features.

Usage:
    pip install flask flask-cors
    python mock_server.py
"""

import json
import uuid
import time
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# ── In-memory storage ──────────────────────────────────────────
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
    "create_time": int(time.time()),
    "create_date": "2025-01-01 00:00:00",
    "update_time": int(time.time()),
    "update_date": "2025-01-01 00:00:00",
    "last_login_time": "2025-01-01 00:00:00",
    "access_token": "mock-token-001",
    "project_roles": [],
}

MOCK_TENANT = {
    "tenant_id": "tenant-001",
    "name": "Emami",
    "llm_id": "",
    "embd_id": "",
    "asr_id": "",
    "img2txt_id": "",
    "rerank_id": "",
    "tts_id": "",
    "parser_ids": "",
    "role": "owner",
}

# ── Pre-seeded demo projects ──────────────────────────────────
ts_now = int(time.time())

PROJECTS = {
    "proj-001": {
        "id": "proj-001",
        "tenant_id": "tenant-001",
        "name": "Emami Product Catalog",
        "description": "AI-powered product catalog with document intelligence for Emami's product line.",
        "created_by": "usr-super-admin-001",
        "status": "1",
        "create_time": ts_now,
        "update_time": ts_now,
    },
    "proj-002": {
        "id": "proj-002",
        "tenant_id": "tenant-001",
        "name": "HR Policy Assistant",
        "description": "Internal HR knowledge base for employee onboarding and policy queries.",
        "created_by": "usr-super-admin-001",
        "status": "1",
        "create_time": ts_now,
        "update_time": ts_now,
    },
    "proj-003": {
        "id": "proj-003",
        "tenant_id": "tenant-001",
        "name": "R&D Research Papers",
        "description": "Research document management and Q&A for the R&D division.",
        "created_by": "usr-super-admin-001",
        "status": "1",
        "create_time": ts_now,
        "update_time": ts_now,
    },
}

PROJECT_USERS = {
    "proj-001": [
        {
            "id": "pu-001",
            "user_id": "usr-super-admin-001",
            "project_id": "proj-001",
            "role": "admin",
            "assigned_by": "usr-super-admin-001",
            "email": "admin@emami.com",
            "nickname": "Super Admin",
            "avatar": "",
            "is_superuser": True,
            "is_active": "1",
            "create_time": ts_now,
            "update_time": ts_now,
        },
        {
            "id": "pu-002",
            "user_id": "usr-proj-admin-001",
            "project_id": "proj-001",
            "role": "admin",
            "assigned_by": "usr-super-admin-001",
            "email": "rahul@emami.com",
            "nickname": "Rahul Sharma",
            "avatar": "",
            "is_superuser": False,
            "is_active": "1",
            "create_time": ts_now,
            "update_time": ts_now,
        },
        {
            "id": "pu-003",
            "user_id": "usr-member-001",
            "project_id": "proj-001",
            "role": "member",
            "assigned_by": "usr-super-admin-001",
            "email": "priya@emami.com",
            "nickname": "Priya Patel",
            "avatar": "",
            "is_superuser": False,
            "is_active": "1",
            "create_time": ts_now,
            "update_time": ts_now,
        },
    ],
    "proj-002": [
        {
            "id": "pu-004",
            "user_id": "usr-super-admin-001",
            "project_id": "proj-002",
            "role": "admin",
            "assigned_by": "usr-super-admin-001",
            "email": "admin@emami.com",
            "nickname": "Super Admin",
            "avatar": "",
            "is_superuser": True,
            "is_active": "1",
            "create_time": ts_now,
            "update_time": ts_now,
        },
        {
            "id": "pu-005",
            "user_id": "usr-member-002",
            "project_id": "proj-002",
            "role": "member",
            "assigned_by": "usr-super-admin-001",
            "email": "amit@emami.com",
            "nickname": "Amit Kumar",
            "avatar": "",
            "is_superuser": False,
            "is_active": "1",
            "create_time": ts_now,
            "update_time": ts_now,
        },
    ],
    "proj-003": [
        {
            "id": "pu-006",
            "user_id": "usr-super-admin-001",
            "project_id": "proj-003",
            "role": "admin",
            "assigned_by": "usr-super-admin-001",
            "email": "admin@emami.com",
            "nickname": "Super Admin",
            "avatar": "",
            "is_superuser": True,
            "is_active": "1",
            "create_time": ts_now,
            "update_time": ts_now,
        },
    ],
}


def ok(data=None, message="success"):
    return jsonify({"code": 0, "data": data, "message": message})


def err(message="error", code=100):
    return jsonify({"code": code, "data": False, "message": message})


# ── Auth endpoints ─────────────────────────────────────────────
@app.route("/v1/user/info", methods=["GET"])
def user_info():
    # Include project_roles dynamically from current PROJECTS
    user = dict(MOCK_USER)
    user["project_roles"] = []
    for pid, proj in PROJECTS.items():
        user["project_roles"].append({
            "project_id": pid,
            "role": "admin",
            "project_name": proj["name"],
            "tenant_id": "tenant-001",
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


# ── Project RBAC endpoints ─────────────────────────────────────
@app.route("/v1/project/create", methods=["POST"])
def project_create():
    data = request.get_json(silent=True) or {}
    name = data.get("name", "").strip()
    if not name:
        return err("Project name is required.")

    pid = str(uuid.uuid4())[:8]
    ts = int(time.time())
    proj = {
        "id": pid,
        "tenant_id": "tenant-001",
        "name": name,
        "description": data.get("description", ""),
        "created_by": MOCK_USER["id"],
        "status": "1",
        "create_time": ts,
        "update_time": ts,
    }
    PROJECTS[pid] = proj
    PROJECT_USERS[pid] = [{
        "id": str(uuid.uuid4())[:8],
        "user_id": MOCK_USER["id"],
        "project_id": pid,
        "role": "admin",
        "assigned_by": MOCK_USER["id"],
        "email": MOCK_USER["email"],
        "nickname": MOCK_USER["nickname"],
        "avatar": "",
        "is_superuser": True,
        "is_active": "1",
        "create_time": ts,
        "update_time": ts,
    }]
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
    return ok({
        "project": proj,
        "users": PROJECT_USERS.get(pid, []),
        "current_user_role": "admin",
    })


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
def project_users(pid):
    return ok(PROJECT_USERS.get(pid, []))


@app.route("/v1/project/<pid>/user", methods=["POST"])
def project_assign_user(pid):
    if pid not in PROJECTS:
        return err("Project not found.")
    data = request.get_json(silent=True) or {}
    ts = int(time.time())
    user_entry = {
        "id": str(uuid.uuid4())[:8],
        "user_id": data.get("user_id", ""),
        "project_id": pid,
        "role": data.get("role", "member"),
        "assigned_by": MOCK_USER["id"],
        "email": data.get("user_id", ""),
        "nickname": data.get("user_id", ""),
        "avatar": "",
        "is_superuser": False,
        "is_active": "1",
        "create_time": ts,
        "update_time": ts,
    }
    if pid not in PROJECT_USERS:
        PROJECT_USERS[pid] = []
    PROJECT_USERS[pid].append(user_entry)
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


# ── Stub endpoints (return empty data so frontend doesn't crash) ──
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
    return ok({
        "registerEnabled": 1,
        "languages": ["English", "Hindi"],
    })


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
    print("  RBAC Demo Mock Server (v3 — Full UI)")
    print("  Listening on http://0.0.0.0:9380")
    print("=" * 60)
    print(f"  User: admin@emami.com (Super Admin)")
    print(f"  Pre-seeded projects: {len(PROJECTS)}")
    for pid, proj in PROJECTS.items():
        users_count = len(PROJECT_USERS.get(pid, []))
        print(f"    - {proj['name']} ({users_count} users)")
    print()
    print("  New RBAC UI Features:")
    print("    - Sidebar layout (dark blue, 260px)")
    print("    - Split-screen login page")
    print("    - Dashboard with stats, recent docs, actions")
    print("    - User Management (super-admin only)")
    print("    - Admin Dashboard with storage chart")
    print("    - Audit Logs with event table")
    print("    - RBAC role-based nav visibility")
    print("=" * 60)
    print()
    app.run(host="0.0.0.0", port=9380, debug=False)
