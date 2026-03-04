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
RBAC (Role-Based Access Control) middleware for Emami Document Intelligence.

Three-tier role system:
  - Super Admin:   User.is_superuser == True → full access to everything
  - Project Admin: UserProject.role == 'admin' → manage within assigned projects
  - Standard User: UserProject.role == 'member' → view/upload/chat within assigned projects
"""

import logging
from functools import wraps

from quart import request, current_app

from api.db import ProjectRole
from api.db.services.project_service import UserProjectService
from api.db.services.knowledgebase_service import KnowledgebaseService
from api.utils.api_utils import get_json_result
from common.constants import RetCode

logger = logging.getLogger(__name__)

# Role hierarchy (higher index = more permissions)
ROLE_HIERARCHY = {
    ProjectRole.MEMBER: 1,
    ProjectRole.ADMIN: 2,
    'super_admin': 3,
}


def _get_current_user():
    """Get the current authenticated user from request context."""
    from api.apps import current_user
    return current_user


def _role_meets_minimum(user_role, min_role):
    """Check if a user's role meets the minimum required level."""
    if user_role is None:
        return False
    user_level = ROLE_HIERARCHY.get(user_role, 0)
    min_level = ROLE_HIERARCHY.get(min_role, 0)
    return user_level >= min_level


def get_effective_role(user, project_id=None):
    """Determine a user's effective role.

    Args:
        user: The current user object.
        project_id: Optional project ID to check project-level role.

    Returns:
        str: 'super_admin', 'admin', 'member', or None
    """
    if not user:
        return None

    if getattr(user, 'is_superuser', False):
        return 'super_admin'

    if project_id:
        role = UserProjectService.get_user_role(user.id, project_id)
        return role  # 'admin', 'member', or None

    return None


async def _extract_project_id():
    """Extract project_id from request (query params, JSON body, or form data)."""
    # Try query parameters first
    project_id = request.args.get("project_id")
    if project_id:
        return project_id

    # Try JSON body
    try:
        json_body = await request.get_json(silent=True)
        if json_body and isinstance(json_body, dict):
            return json_body.get("project_id")
    except Exception:
        pass

    return None


def require_super_admin(func):
    """Decorator: Requires Super Admin role (is_superuser == True).

    Usage:
        @manager.route("/admin/action", methods=["POST"])
        @login_required
        @require_super_admin
        async def admin_action():
            ...
    """
    @wraps(func)
    async def wrapper(*args, **kwargs):
        user = _get_current_user()
        if not user or not getattr(user, 'is_superuser', False):
            return get_json_result(
                data=False,
                message="Super Admin access required.",
                code=RetCode.FORBIDDEN
            )
        return await current_app.ensure_async(func)(*args, **kwargs)
    return wrapper


def require_project_role(min_role=ProjectRole.MEMBER, project_id_param="project_id"):
    """Decorator: Requires minimum project role.

    Super Admins always pass. For others, extracts project_id from request
    and checks the user's role in that project.

    Args:
        min_role: Minimum required ProjectRole ('member' or 'admin')
        project_id_param: Name of the URL parameter or JSON field containing project_id

    Usage:
        @manager.route("/project/<project_id>/docs", methods=["GET"])
        @login_required
        @require_project_role(min_role=ProjectRole.MEMBER)
        async def list_docs(project_id):
            ...
    """
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            user = _get_current_user()
            if not user:
                return get_json_result(
                    data=False,
                    message="Authentication required.",
                    code=RetCode.UNAUTHORIZED
                )

            # Super Admin bypasses all project checks
            if getattr(user, 'is_superuser', False):
                return await current_app.ensure_async(func)(*args, **kwargs)

            # Try to get project_id from URL kwargs first
            project_id = kwargs.get(project_id_param)

            # If not in URL, try query params and JSON body
            if not project_id:
                project_id = await _extract_project_id()

            if not project_id:
                return get_json_result(
                    data=False,
                    message="Project context required. Please specify a project_id.",
                    code=RetCode.FORBIDDEN
                )

            # Check user's role in this project
            user_role = UserProjectService.get_user_role(user.id, project_id)
            if not _role_meets_minimum(user_role, min_role):
                return get_json_result(
                    data=False,
                    message=f"Insufficient permissions. Requires '{min_role}' role or higher.",
                    code=RetCode.FORBIDDEN
                )

            return await current_app.ensure_async(func)(*args, **kwargs)
        return wrapper
    return decorator


def check_resource_project_access(kb_id, user_id, is_superuser=False, min_role=ProjectRole.MEMBER):
    """Check if a user can access a resource through its KB's project.

    This is an inline function (not a decorator) for use within endpoint handlers
    where the KB is already known.

    Args:
        kb_id: Knowledge base ID to check
        user_id: User ID to verify access for
        is_superuser: Whether the user is a Super Admin
        min_role: Minimum required role in the project

    Returns:
        tuple: (has_access: bool, error_message: str or None)
    """
    # Super Admin always has access
    if is_superuser:
        return True, None

    # Get the KB to find its project_id
    ok, kb = KnowledgebaseService.get_by_id(kb_id)
    if not ok or not kb:
        return False, "Knowledge base not found."

    project_id = getattr(kb, 'project_id', None)

    if not project_id:
        # No project assigned — fall back to existing tenant-based access
        # (backward compatibility for KBs created before RBAC)
        return True, None

    # Check user's role in the project
    user_role = UserProjectService.get_user_role(user_id, project_id)
    if not _role_meets_minimum(user_role, min_role):
        return False, "You do not have access to this project's resources."

    return True, None
