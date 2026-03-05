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
RBAC Data Migration Script for Emami Document Intelligence.

This script migrates existing RAGFlow data to the new 3-tier RBAC model:
  1. Creates a "Default Project" for each existing Tenant
  2. Assigns all existing KBs to the Default Project
  3. Migrates UserTenant roles to UserProject roles:
     - owner  -> UserProject role = 'admin'
     - normal -> UserProject role = 'member'

Run this script ONCE after deploying the schema changes.

Usage:
    cd ragflow-main
    python -m api.db.migrate_rbac
"""

import logging
import sys
import os

# Ensure the project root is in the Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))

from datetime import datetime
from peewee import CharField
from playhouse.migrate import MySQLMigrator, migrate as pw_migrate
from api.db.db_models import DB, Tenant, UserTenant, Knowledgebase, Dialog, Project, UserProject
from common.constants import StatusEnum
from common.misc_utils import get_uuid
from common.time_utils import current_timestamp, datetime_format

logging.basicConfig(level=logging.INFO, format='%(asctime)s %(levelname)s %(message)s')
logger = logging.getLogger(__name__)


def migrate_rbac_data():
    """Run the full RBAC data migration."""
    logger.info("=" * 60)
    logger.info("Starting RBAC Data Migration")
    logger.info("=" * 60)

    stats = {
        "projects_created": 0,
        "kbs_updated": 0,
        "user_projects_created": 0,
        "skipped_tenants": 0,
        "errors": 0,
    }

    with DB.connection_context():
        # Step 1: Get all existing tenants
        tenants = list(Tenant.select().where(Tenant.status == StatusEnum.VALID.value))
        logger.info(f"Found {len(tenants)} active tenants")

        for tenant in tenants:
            try:
                _migrate_tenant(tenant, stats)
            except Exception as ex:
                logger.error(f"Error migrating tenant {tenant.id}: {ex}")
                stats["errors"] += 1

    logger.info("=" * 60)
    logger.info("RBAC Data Migration Complete")
    logger.info(f"  Projects created:       {stats['projects_created']}")
    logger.info(f"  KBs updated:            {stats['kbs_updated']}")
    logger.info(f"  User-Project links:     {stats['user_projects_created']}")
    logger.info(f"  Tenants skipped:        {stats['skipped_tenants']}")
    logger.info(f"  Errors:                 {stats['errors']}")
    logger.info("=" * 60)


def _migrate_tenant(tenant, stats):
    """Migrate a single tenant to the RBAC project model."""
    tenant_id = tenant.id
    logger.info(f"Processing tenant: {tenant_id}")

    # Check if a Default Project already exists for this tenant
    existing = Project.select().where(
        Project.tenant_id == tenant_id,
        Project.name == "Default Project",
        Project.status == StatusEnum.VALID.value,
    ).first()

    if existing:
        logger.info(f"  Tenant {tenant_id} already has a Default Project ({existing.id}). Skipping project creation.")
        project_id = existing.id
        stats["skipped_tenants"] += 1
    else:
        # Create Default Project
        project_id = get_uuid()
        timestamp = current_timestamp()
        cur_datetime = datetime_format(datetime.now())

        Project.create(
            id=project_id,
            tenant_id=tenant_id,
            name="Default Project",
            description="Auto-created default project for existing data.",
            created_by=tenant_id,
            status=StatusEnum.VALID.value,
            create_time=timestamp,
            create_date=cur_datetime,
            update_time=timestamp,
            update_date=cur_datetime,
        )
        logger.info(f"  Created Default Project: {project_id}")
        stats["projects_created"] += 1

    # Step 2: Assign all KBs in this tenant to the Default Project
    updated = (
        Knowledgebase.update({Knowledgebase.project_id: project_id})
        .where(
            Knowledgebase.tenant_id == tenant_id,
            Knowledgebase.status == StatusEnum.VALID.value,
            (Knowledgebase.project_id.is_null()) | (Knowledgebase.project_id == ""),
        )
        .execute()
    )
    if updated:
        logger.info(f"  Updated {updated} KBs with project_id = {project_id}")
        stats["kbs_updated"] += updated

    # Step 3: Migrate UserTenant roles to UserProject
    user_tenants = list(
        UserTenant.select().where(
            UserTenant.tenant_id == tenant_id,
            UserTenant.status == StatusEnum.VALID.value,
        )
    )
    logger.info(f"  Found {len(user_tenants)} UserTenant records")

    for ut in user_tenants:
        _migrate_user_tenant(ut, project_id, stats)


def _migrate_user_tenant(ut, project_id, stats):
    """Migrate a UserTenant record to a UserProject record."""
    user_id = ut.user_id
    tenant_role = ut.role  # 'owner', 'admin', 'normal', 'invite'

    # Map existing roles to project roles
    if tenant_role in ('owner', 'admin'):
        project_role = 'admin'
    elif tenant_role == 'normal':
        project_role = 'member'
    else:
        # 'invite' or unknown — skip
        logger.info(f"    Skipping user {user_id} with tenant role '{tenant_role}'")
        return

    # Check if UserProject already exists
    existing = UserProject.select().where(
        UserProject.user_id == user_id,
        UserProject.project_id == project_id,
    ).first()

    if existing:
        logger.info(f"    User {user_id} already assigned to project. Skipping.")
        return

    timestamp = current_timestamp()
    cur_datetime = datetime_format(datetime.now())

    UserProject.create(
        id=get_uuid(),
        user_id=user_id,
        project_id=project_id,
        role=project_role,
        assigned_by="migration",
        status=StatusEnum.VALID.value,
        create_time=timestamp,
        create_date=cur_datetime,
        update_time=timestamp,
        update_date=cur_datetime,
    )
    logger.info(f"    Assigned user {user_id} as '{project_role}' in project {project_id}")
    stats["user_projects_created"] += 1


def migrate_dialog_project_id():
    """Add project_id column to dialog table if it doesn't exist."""
    logger.info("Checking if dialog table needs project_id column...")

    with DB.connection_context():
        try:
            # Check if column already exists
            cursor = DB.execute_sql("SHOW COLUMNS FROM dialog LIKE 'project_id'")
            if cursor.fetchone():
                logger.info("  dialog.project_id column already exists. Skipping.")
                return

            migrator = MySQLMigrator(DB)
            pw_migrate(
                migrator.add_column(
                    "dialog", "project_id",
                    CharField(max_length=32, null=True, help_text="project id for RBAC scoping", index=True)
                ),
            )
            logger.info("  Added project_id column to dialog table.")
        except Exception as ex:
            logger.error(f"  Error adding project_id to dialog: {ex}")


if __name__ == "__main__":
    migrate_dialog_project_id()
    migrate_rbac_data()
