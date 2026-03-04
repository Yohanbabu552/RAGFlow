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


from api.db import TenantPermission
from api.db.db_models import File, Knowledgebase
from api.db.services.file_service import FileService
from api.db.services.knowledgebase_service import KnowledgebaseService
from api.db.services.project_service import UserProjectService
from api.db.services.user_service import TenantService


def check_kb_team_permission(kb: dict | Knowledgebase, other: str, is_superuser: bool = False) -> bool:
    """Check if a user ('other') can access a knowledge base.

    Enhanced with RBAC project-level checks:
    1. Super Admin always has access
    2. If KB has a project_id, check UserProject membership
    3. Fall back to existing tenant-based permission check
    """
    kb = kb.to_dict() if isinstance(kb, Knowledgebase) else kb

    # Super Admin bypasses all checks
    if is_superuser:
        return True

    kb_tenant_id = kb["tenant_id"]

    # Owner always has access
    if kb_tenant_id == other:
        return True

    # RBAC: Check project-level access if KB belongs to a project
    project_id = kb.get("project_id")
    if project_id:
        role = UserProjectService.get_user_role(other, project_id)
        if role is not None:
            return True
        # If user has no project role and KB has a project, deny access
        # (even if they are in the same tenant, project-level RBAC takes precedence)
        return False

    # Fall back to existing tenant-based permission check
    if kb["permission"] != TenantPermission.TEAM:
        return False

    joined_tenants = TenantService.get_joined_tenants_by_user_id(other)
    return any(tenant["tenant_id"] == kb_tenant_id for tenant in joined_tenants)


def check_file_team_permission(file: dict | File, other: str, is_superuser: bool = False) -> bool:
    """Check if a user ('other') can access a file.

    Enhanced with RBAC: delegates to check_kb_team_permission which
    now includes project-level checks.
    """
    file = file.to_dict() if isinstance(file, File) else file

    # Super Admin bypasses all checks
    if is_superuser:
        return True

    file_tenant_id = file["tenant_id"]
    if file_tenant_id == other:
        return True

    file_id = file["id"]

    kb_ids = [kb_info["kb_id"] for kb_info in FileService.get_kb_id_by_file_id(file_id)]

    for kb_id in kb_ids:
        ok, kb = KnowledgebaseService.get_by_id(kb_id)
        if not ok:
            continue

        if check_kb_team_permission(kb, other, is_superuser=is_superuser):
            return True

    return False
