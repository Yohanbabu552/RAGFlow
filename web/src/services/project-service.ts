/**
 * Project Service — API client for RBAC project endpoints.
 *
 * Follows the existing RAGFlow service pattern using registerServer + custom methods.
 */

import api from '@/utils/api';
import registerServer from '@/utils/register-server';
import request, { post } from '@/utils/request';

const {
  project_create,
  project_list,
  project_detail,
  project_update,
  project_rm,
} = api;

const methods = {
  createProject: {
    url: project_create,
    method: 'post',
  },
  listProjects: {
    url: project_list,
    method: 'get',
  },
  getProjectDetail: {
    url: project_detail,
    method: 'get',
  },
  updateProject: {
    url: project_update,
    method: 'put',
  },
  deleteProject: {
    url: project_rm,
    method: 'delete',
  },
} as const;

const projectService = registerServer<keyof typeof methods>(methods, request);

// --- Custom methods for project-user management ---

/** List all users in a project (Project Admin+) */
export const listProjectUsers = (projectId: string) =>
  request.get(api.project_users(projectId));

/** Assign a user to a project with a role */
export const assignProjectUser = (
  projectId: string,
  data: { user_id: string; role: 'admin' | 'member' },
) => post(api.project_assign_user(projectId), data);

/** Remove a user from a project */
export const removeProjectUser = ({
  projectId,
  userId,
}: {
  projectId: string;
  userId: string;
}) => request.delete(api.project_remove_user(projectId, userId));

/** Change a user's role in a project (Super Admin only) */
export const updateProjectUserRole = ({
  projectId,
  userId,
  role,
}: {
  projectId: string;
  userId: string;
  role: 'admin' | 'member';
}) => request.put(api.project_update_user_role(projectId, userId), { data: { role } });

export default projectService;
