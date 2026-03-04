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

from api.db import ProjectRole
from common.constants import StatusEnum
from api.db.db_models import DB, Project, UserProject, User
from api.db.services.common_service import CommonService
from common.misc_utils import get_uuid
from common.time_utils import current_timestamp, datetime_format
from datetime import datetime


class ProjectService(CommonService):
    """Service for managing Projects (Emami RBAC)."""
    model = Project

    @classmethod
    @DB.connection_context()
    def get_by_tenant(cls, tenant_id, page_number=1, items_per_page=1000,
                      orderby="create_time", desc=True, keywords=""):
        """List all projects for a given tenant."""
        projects = cls.model.select().where(
            cls.model.tenant_id == tenant_id,
            cls.model.status == StatusEnum.VALID.value
        )
        if keywords:
            projects = projects.where(
                cls.model.name.contains(keywords)
            )

        total = projects.count()

        if desc:
            projects = projects.order_by(cls.model.getter_by(orderby).desc())
        else:
            projects = projects.order_by(cls.model.getter_by(orderby).asc())

        projects = projects.paginate(page_number, items_per_page)
        return list(projects), total

    @classmethod
    @DB.connection_context()
    def get_user_projects(cls, user_id, is_superuser=False, tenant_id=None):
        """Get all projects a user has access to.
        Super Admins see all projects for the tenant.
        Normal users see only projects they are assigned to.
        """
        if is_superuser and tenant_id:
            # Super Admin sees all projects in the tenant
            projects = cls.model.select().where(
                cls.model.tenant_id == tenant_id,
                cls.model.status == StatusEnum.VALID.value
            )
            return list(projects)

        # Normal users: join with UserProject to get assigned projects
        projects = (
            cls.model.select()
            .join(UserProject, on=(cls.model.id == UserProject.project_id))
            .where(
                UserProject.user_id == user_id,
                UserProject.status == StatusEnum.VALID.value,
                cls.model.status == StatusEnum.VALID.value
            )
        )
        return list(projects)

    @classmethod
    @DB.connection_context()
    def accessible(cls, project_id, user_id, is_superuser=False):
        """Check if a user can access a project.
        Super Admins always have access.
        """
        if is_superuser:
            return True

        user_project = UserProject.select().where(
            UserProject.user_id == user_id,
            UserProject.project_id == project_id,
            UserProject.status == StatusEnum.VALID.value
        ).first()
        return user_project is not None

    @classmethod
    @DB.connection_context()
    def get_by_name(cls, name, tenant_id):
        """Get project by name within a tenant (for uniqueness checks)."""
        project = cls.model.select().where(
            cls.model.name == name,
            cls.model.tenant_id == tenant_id,
            cls.model.status == StatusEnum.VALID.value
        ).first()
        if project:
            return True, project
        return False, None

    @classmethod
    @DB.connection_context()
    def create_project(cls, tenant_id, name, created_by, description=""):
        """Create a new project with validation."""
        if not name or not name.strip():
            return False, "Project name cannot be empty."

        # Check for duplicate name
        exists, _ = cls.get_by_name(name.strip(), tenant_id)
        if exists:
            return False, f"Project '{name}' already exists in this tenant."

        project_id = get_uuid()
        timestamp = current_timestamp()
        cur_datetime = datetime_format(datetime.now())

        payload = {
            "id": project_id,
            "tenant_id": tenant_id,
            "name": name.strip(),
            "description": description or "",
            "created_by": created_by,
            "status": StatusEnum.VALID.value,
            "create_time": timestamp,
            "create_date": cur_datetime,
            "update_time": timestamp,
            "update_date": cur_datetime,
        }
        cls.model(**payload).save(force_insert=True)
        return True, payload


class UserProjectService(CommonService):
    """Service for managing User-Project assignments (RBAC)."""
    model = UserProject

    @classmethod
    @DB.connection_context()
    def get_by_project(cls, project_id):
        """List all users in a project with their user details."""
        users = (
            cls.model.select(
                cls.model.id,
                cls.model.user_id,
                cls.model.project_id,
                cls.model.role,
                cls.model.assigned_by,
                cls.model.status,
                cls.model.create_time,
                cls.model.update_time,
                User.email,
                User.nickname,
                User.avatar,
                User.is_superuser,
                User.is_active,
            )
            .join(User, on=(cls.model.user_id == User.id))
            .where(
                cls.model.project_id == project_id,
                cls.model.status == StatusEnum.VALID.value
            )
        )
        result = []
        for u in users:
            result.append({
                "id": u.id,
                "user_id": u.user_id,
                "project_id": u.project_id,
                "role": u.role,
                "assigned_by": u.assigned_by,
                "email": u.user.email,
                "nickname": u.user.nickname,
                "avatar": u.user.avatar,
                "is_superuser": u.user.is_superuser,
                "is_active": u.user.is_active,
                "create_time": u.create_time,
                "update_time": u.update_time,
            })
        return result

    @classmethod
    @DB.connection_context()
    def get_user_role(cls, user_id, project_id):
        """Get a user's role in a specific project. Returns role string or None."""
        record = cls.model.select().where(
            cls.model.user_id == user_id,
            cls.model.project_id == project_id,
            cls.model.status == StatusEnum.VALID.value
        ).first()
        if record:
            return record.role
        return None

    @classmethod
    @DB.connection_context()
    def get_user_project_roles(cls, user_id):
        """Get all project roles for a user (for /info endpoint)."""
        records = (
            cls.model.select(
                cls.model.project_id,
                cls.model.role,
                Project.name,
                Project.tenant_id,
            )
            .join(Project, on=(cls.model.project_id == Project.id))
            .where(
                cls.model.user_id == user_id,
                cls.model.status == StatusEnum.VALID.value,
                Project.status == StatusEnum.VALID.value
            )
        )
        result = []
        for r in records:
            result.append({
                "project_id": r.project_id,
                "role": r.role,
                "project_name": r.project.name,
                "tenant_id": r.project.tenant_id,
            })
        return result

    @classmethod
    @DB.connection_context()
    def assign_user(cls, user_id, project_id, role, assigned_by):
        """Assign a user to a project with a role."""
        # Check if assignment already exists
        existing = cls.model.select().where(
            cls.model.user_id == user_id,
            cls.model.project_id == project_id,
        ).first()

        timestamp = current_timestamp()
        cur_datetime = datetime_format(datetime.now())

        if existing:
            # Reactivate if soft-deleted, or update role
            cls.model.update({
                cls.model.role: role,
                cls.model.assigned_by: assigned_by,
                cls.model.status: StatusEnum.VALID.value,
                cls.model.update_time: timestamp,
                cls.model.update_date: cur_datetime,
            }).where(cls.model.id == existing.id).execute()
            return True, "User assignment updated."

        # Create new assignment
        payload = {
            "id": get_uuid(),
            "user_id": user_id,
            "project_id": project_id,
            "role": role,
            "assigned_by": assigned_by,
            "status": StatusEnum.VALID.value,
            "create_time": timestamp,
            "create_date": cur_datetime,
            "update_time": timestamp,
            "update_date": cur_datetime,
        }
        cls.model(**payload).save(force_insert=True)
        return True, "User assigned to project."

    @classmethod
    @DB.connection_context()
    def remove_user(cls, user_id, project_id):
        """Soft-delete a user's project assignment."""
        num = cls.model.update({
            cls.model.status: StatusEnum.INVALID.value,
            cls.model.update_time: current_timestamp(),
            cls.model.update_date: datetime_format(datetime.now()),
        }).where(
            cls.model.user_id == user_id,
            cls.model.project_id == project_id,
        ).execute()
        return num > 0

    @classmethod
    @DB.connection_context()
    def update_role(cls, user_id, project_id, new_role):
        """Change a user's role in a project."""
        num = cls.model.update({
            cls.model.role: new_role,
            cls.model.update_time: current_timestamp(),
            cls.model.update_date: datetime_format(datetime.now()),
        }).where(
            cls.model.user_id == user_id,
            cls.model.project_id == project_id,
            cls.model.status == StatusEnum.VALID.value,
        ).execute()
        return num > 0
