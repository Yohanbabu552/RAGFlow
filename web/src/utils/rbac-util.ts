/**
 * RBAC Utilities for Emami Document Intelligence
 *
 * Three-tier role system:
 *   - Super Admin:   Full access to everything (is_superuser === true)
 *   - Project Admin: Manage users, docs, folders within assigned projects
 *   - Standard User: View/upload/chat within assigned projects
 */

import { EffectiveRole, IUserInfo, IUserProjectRole } from '@/interfaces/database/user-setting';

/**
 * Get the effective role for the current user, optionally scoped to a project.
 */
export function getEffectiveRole(
  user: IUserInfo | null | undefined,
  projectId?: string,
): EffectiveRole {
  if (!user) return null;

  // Super Admin bypasses everything
  if (user.is_superuser) return 'super_admin';

  // If project context is given, check project role
  if (projectId && user.project_roles) {
    const projectRole = user.project_roles.find(
      (r: IUserProjectRole) => r.project_id === projectId,
    );
    if (projectRole?.role === 'admin') return 'project_admin';
    if (projectRole?.role === 'member') return 'member';
  }

  return null;
}

/**
 * Check if a role meets the minimum required level.
 *
 * Hierarchy: member < project_admin < super_admin
 */
export function canAccess(
  userRole: EffectiveRole,
  requiredRole: EffectiveRole,
): boolean {
  const hierarchy: Record<string, number> = {
    member: 1,
    project_admin: 2,
    super_admin: 3,
  };

  if (!userRole || !requiredRole) return false;

  return (hierarchy[userRole] ?? 0) >= (hierarchy[requiredRole] ?? 0);
}

/**
 * Check if the user is a Super Admin.
 */
export function isSuperAdmin(user: IUserInfo | null | undefined): boolean {
  return !!user?.is_superuser;
}

/**
 * Check if the user is a Project Admin for a specific project.
 */
export function isProjectAdmin(
  user: IUserInfo | null | undefined,
  projectId: string,
): boolean {
  if (!user) return false;
  if (user.is_superuser) return true; // Super Admin is always admin
  return user.project_roles?.some(
    (r: IUserProjectRole) => r.project_id === projectId && r.role === 'admin',
  ) ?? false;
}

/**
 * Check if the user has any access to a project (member or admin).
 */
export function hasProjectAccess(
  user: IUserInfo | null | undefined,
  projectId: string,
): boolean {
  if (!user) return false;
  if (user.is_superuser) return true; // Super Admin has access to all
  return user.project_roles?.some(
    (r: IUserProjectRole) => r.project_id === projectId,
  ) ?? false;
}

/**
 * Get the list of project IDs the user has access to.
 */
export function getAccessibleProjectIds(
  user: IUserInfo | null | undefined,
): string[] {
  if (!user?.project_roles) return [];
  return user.project_roles.map((r: IUserProjectRole) => r.project_id);
}
