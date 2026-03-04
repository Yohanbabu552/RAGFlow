#
#  Copyright 2025 The InfiniFlow Authors. All Rights Reserved.
#
#  Licensed under the Apache License, Version 2.0 (the "License");
#  you may not use this file except in compliance with the License.
#  You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
#  Unless required by applicable law or agreed to in writing, software
#  distributed under the License is distributed on an "AS IS" BASIS,
#  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
#  See the License for the specific language governing permissions and
#  limitations under the License.
#

"""
Project Management API endpoints for Emami RBAC.

Provides CRUD operations for projects and user-project assignments.
"""

from quart import request

from api.db import ProjectRole
from api.db.services.project_service import ProjectService, UserProjectService
from api.db.services.user_service import UserService
from api.utils.api_utils import (
    get_json_result,
    get_data_error_result,
    get_error_data_result,
    server_error_response,
    validate_request,
    get_request_json,
)
from api.common.rbac import require_super_admin, require_project_role
from api.apps import login_required, current_user
from common.constants import RetCode


# ============================================================
# Project CRUD
# ============================================================

@manager.route('/create', methods=['POST'])  # noqa: F821
@login_required
@require_super_admin
@validate_request("name")
async def create():
    """Create a new project. Super Admin only."""
    req = await get_request_json()
    try:
        ok, result = ProjectService.create_project(
            tenant_id=current_user.id,
            name=req.get("name"),
            created_by=current_user.id,
            description=req.get("description", ""),
        )
        if not ok:
            return get_json_result(data=False, message=result, code=RetCode.OPERATING_ERROR)

        # Auto-assign the creator as Project Admin
        UserProjectService.assign_user(
            user_id=current_user.id,
            project_id=result["id"],
            role=ProjectRole.ADMIN,
            assigned_by=current_user.id,
        )

        return get_json_result(data={"project_id": result["id"]})
    except Exception as e:
        return server_error_response(e)


@manager.route('/list', methods=['GET'])  # noqa: F821
@login_required
async def list_projects():
    """List projects accessible to the current user.
    Super Admin sees all projects. Others see only assigned projects.
    """
    try:
        page_number = int(request.args.get("page", 1))
        items_per_page = int(request.args.get("page_size", 1000))
        orderby = request.args.get("orderby", "create_time")
        desc = request.args.get("desc", "true").lower() == "true"
        keywords = request.args.get("keywords", "")

        if current_user.is_superuser:
            projects, total = ProjectService.get_by_tenant(
                tenant_id=current_user.id,
                page_number=page_number,
                items_per_page=items_per_page,
                orderby=orderby,
                desc=desc,
                keywords=keywords,
            )
        else:
            projects = ProjectService.get_user_projects(
                user_id=current_user.id,
                is_superuser=False,
            )
            # Apply keyword filter
            if keywords:
                projects = [p for p in projects if keywords.lower() in p.name.lower()]
            total = len(projects)

        result = []
        for p in projects:
            d = p.to_dict() if hasattr(p, 'to_dict') else p
            # Get user count for this project
            users = UserProjectService.get_by_project(d["id"])
            d["user_count"] = len(users)
            result.append(d)

        return get_json_result(data={"projects": result, "total": total})
    except Exception as e:
        return server_error_response(e)


@manager.route('/detail', methods=['GET'])  # noqa: F821
@login_required
async def detail():
    """Get project details. Requires project membership."""
    project_id = request.args.get("project_id")
    if not project_id:
        return get_json_result(data=False, message="project_id is required.", code=RetCode.ARGUMENT_ERROR)

    try:
        # Access check
        if not current_user.is_superuser:
            role = UserProjectService.get_user_role(current_user.id, project_id)
            if not role:
                return get_json_result(
                    data=False, message="No access to this project.", code=RetCode.FORBIDDEN
                )

        ok, project = ProjectService.get_by_id(project_id)
        if not ok:
            return get_json_result(data=False, message="Project not found.", code=RetCode.DATA_ERROR)

        result = project.to_dict()
        # Include user list
        result["users"] = UserProjectService.get_by_project(project_id)
        # Include user's role
        result["current_user_role"] = (
            "super_admin" if current_user.is_superuser
            else UserProjectService.get_user_role(current_user.id, project_id)
        )
        return get_json_result(data=result)
    except Exception as e:
        return server_error_response(e)


@manager.route('/update', methods=['PUT'])  # noqa: F821
@login_required
async def update():
    """Update project name/description. Project Admin+ or Super Admin."""
    req = await get_request_json()
    project_id = req.get("project_id")
    if not project_id:
        return get_json_result(data=False, message="project_id is required.", code=RetCode.ARGUMENT_ERROR)

    try:
        # Check access: Super Admin or Project Admin
        if not current_user.is_superuser:
            role = UserProjectService.get_user_role(current_user.id, project_id)
            if role != ProjectRole.ADMIN:
                return get_json_result(
                    data=False, message="Project Admin access required.", code=RetCode.FORBIDDEN
                )

        update_data = {}
        if "name" in req:
            update_data["name"] = req["name"]
        if "description" in req:
            update_data["description"] = req["description"]

        if not update_data:
            return get_json_result(data=False, message="Nothing to update.", code=RetCode.ARGUMENT_ERROR)

        ProjectService.update_by_id(project_id, update_data)
        return get_json_result(data=True)
    except Exception as e:
        return server_error_response(e)


@manager.route('/rm', methods=['DELETE'])  # noqa: F821
@login_required
@require_super_admin
async def rm():
    """Delete a project. Super Admin only. Soft-delete."""
    req = await get_request_json()
    project_id = req.get("project_id")
    if not project_id:
        return get_json_result(data=False, message="project_id is required.", code=RetCode.ARGUMENT_ERROR)

    try:
        ok, project = ProjectService.get_by_id(project_id)
        if not ok:
            return get_json_result(data=False, message="Project not found.", code=RetCode.DATA_ERROR)

        # Soft-delete the project
        ProjectService.update_by_id(project_id, {"status": "0"})
        return get_json_result(data=True)
    except Exception as e:
        return server_error_response(e)


# ============================================================
# User-Project Assignment Management
# ============================================================

@manager.route('/<project_id>/users', methods=['GET'])  # noqa: F821
@login_required
async def list_project_users(project_id):
    """List all users in a project. Project Admin+ or Super Admin."""
    try:
        if not current_user.is_superuser:
            role = UserProjectService.get_user_role(current_user.id, project_id)
            if role != ProjectRole.ADMIN:
                return get_json_result(
                    data=False, message="Project Admin access required.", code=RetCode.FORBIDDEN
                )

        users = UserProjectService.get_by_project(project_id)
        return get_json_result(data=users)
    except Exception as e:
        return server_error_response(e)


@manager.route('/<project_id>/user', methods=['POST'])  # noqa: F821
@login_required
@validate_request("email", "role")
async def assign_user(project_id):
    """Assign a user to a project. Project Admin+ or Super Admin.

    Body: { "email": "user@example.com", "role": "admin" | "member" }
    """
    req = await get_request_json()
    email = req.get("email", "").strip()
    role = req.get("role", ProjectRole.MEMBER)

    if role not in (ProjectRole.ADMIN, ProjectRole.MEMBER):
        return get_json_result(
            data=False, message=f"Invalid role '{role}'. Must be 'admin' or 'member'.",
            code=RetCode.ARGUMENT_ERROR,
        )

    try:
        # Check access
        if not current_user.is_superuser:
            caller_role = UserProjectService.get_user_role(current_user.id, project_id)
            if caller_role != ProjectRole.ADMIN:
                return get_json_result(
                    data=False, message="Project Admin access required.", code=RetCode.FORBIDDEN
                )
            # Project Admins cannot assign other admins (only Super Admin can)
            if role == ProjectRole.ADMIN:
                return get_json_result(
                    data=False,
                    message="Only Super Admin can assign Project Admin role.",
                    code=RetCode.FORBIDDEN,
                )

        # Find user by email
        users = UserService.query(email=email)
        if not users:
            return get_json_result(
                data=False, message=f"User with email '{email}' not found.",
                code=RetCode.DATA_ERROR,
            )
        target_user = users[0]

        # Check project exists
        ok, project = ProjectService.get_by_id(project_id)
        if not ok:
            return get_json_result(data=False, message="Project not found.", code=RetCode.DATA_ERROR)

        # Assign user
        ok, msg = UserProjectService.assign_user(
            user_id=target_user.id,
            project_id=project_id,
            role=role,
            assigned_by=current_user.id,
        )
        return get_json_result(data=ok, message=msg)
    except Exception as e:
        return server_error_response(e)


@manager.route('/<project_id>/user/<user_id>', methods=['DELETE'])  # noqa: F821
@login_required
async def remove_user(project_id, user_id):
    """Remove a user from a project. Project Admin+ or Super Admin."""
    try:
        if not current_user.is_superuser:
            caller_role = UserProjectService.get_user_role(current_user.id, project_id)
            if caller_role != ProjectRole.ADMIN:
                return get_json_result(
                    data=False, message="Project Admin access required.", code=RetCode.FORBIDDEN
                )

        ok = UserProjectService.remove_user(user_id, project_id)
        if ok:
            return get_json_result(data=True, message="User removed from project.")
        return get_json_result(data=False, message="User not found in project.", code=RetCode.DATA_ERROR)
    except Exception as e:
        return server_error_response(e)


@manager.route('/<project_id>/user/<user_id>/role', methods=['PUT'])  # noqa: F821
@login_required
@require_super_admin
async def change_user_role(project_id, user_id):
    """Change a user's role in a project. Super Admin only.

    Body: { "role": "admin" | "member" }
    """
    req = await get_request_json()
    new_role = req.get("role")

    if new_role not in (ProjectRole.ADMIN, ProjectRole.MEMBER):
        return get_json_result(
            data=False, message=f"Invalid role '{new_role}'. Must be 'admin' or 'member'.",
            code=RetCode.ARGUMENT_ERROR,
        )

    try:
        ok = UserProjectService.update_role(user_id, project_id, new_role)
        if ok:
            return get_json_result(data=True, message=f"Role updated to '{new_role}'.")
        return get_json_result(
            data=False, message="User not found in project.", code=RetCode.DATA_ERROR
        )
    except Exception as e:
        return server_error_response(e)
