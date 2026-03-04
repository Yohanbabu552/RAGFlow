/**
 * Project Detail Page — Shows project settings and user management.
 *
 * Accessible to any project member. Project Admins+ can manage users.
 * Super Admins can change roles.
 */

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useFetchUserInfo } from '@/hooks/use-user-setting-request';
import { IProject, IProjectUser } from '@/interfaces/database/user-setting';
import { Routes } from '@/routes';
import projectService, {
  assignProjectUser,
  listProjectUsers,
  removeProjectUser,
  updateProjectUserRole,
} from '@/services/project-service';
import { isSuperAdmin } from '@/utils/rbac-util';
import {
  ArrowLeft,
  Crown,
  Shield,
  Trash2,
  User,
  UserPlus,
  Users,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';

export default function ProjectDetail() {
  const { id: projectId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: userInfo } = useFetchUserInfo();

  const [project, setProject] = useState<IProject | null>(null);
  const [users, setUsers] = useState<IProjectUser[]>([]);
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Add user form
  const [addUserEmail, setAddUserEmail] = useState('');
  const [addUserRole, setAddUserRole] = useState<'member' | 'admin'>('member');
  const [addingUser, setAddingUser] = useState(false);

  const isAdmin = isSuperAdmin(userInfo);
  const isProjectAdminOrAbove =
    isAdmin || currentUserRole === 'admin';

  // Fetch project detail
  const fetchDetail = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const res = await projectService.getProjectDetail({
        project_id: projectId,
      });
      const data = res?.data;
      if (data?.code === 0) {
        setProject(data.data?.project || null);
        setUsers(data.data?.users || []);
        setCurrentUserRole(data.data?.current_user_role || null);
      }
    } catch {
      // Error handled by request interceptor
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  // Refresh user list only
  const fetchUsers = useCallback(async () => {
    if (!projectId) return;
    try {
      const res = await listProjectUsers(projectId);
      const data = res?.data;
      if (data?.code === 0) {
        setUsers(data.data || []);
      }
    } catch {
      // Error handled by request interceptor
    }
  }, [projectId]);

  // Add user handler
  const handleAddUser = useCallback(async () => {
    if (!projectId || !addUserEmail.trim()) return;
    setAddingUser(true);
    try {
      const res = await assignProjectUser(projectId, {
        user_id: addUserEmail.trim(), // Backend accepts user_id or email
        role: addUserRole,
      });
      const data = res?.data;
      if (data?.code === 0) {
        setAddUserEmail('');
        fetchUsers();
      }
    } catch {
      // Error handled by request interceptor
    } finally {
      setAddingUser(false);
    }
  }, [projectId, addUserEmail, addUserRole, fetchUsers]);

  // Remove user handler
  const handleRemoveUser = useCallback(
    async (userId: string) => {
      if (!projectId) return;
      if (!window.confirm('Remove this user from the project?')) return;
      try {
        const res = await removeProjectUser({ projectId, userId });
        const data = res?.data;
        if (data?.code === 0) {
          fetchUsers();
        }
      } catch {
        // Error handled by request interceptor
      }
    },
    [projectId, fetchUsers],
  );

  // Change role handler
  const handleChangeRole = useCallback(
    async (userId: string, newRole: 'admin' | 'member') => {
      if (!projectId) return;
      try {
        const res = await updateProjectUserRole({
          projectId,
          userId,
          role: newRole,
        });
        const data = res?.data;
        if (data?.code === 0) {
          fetchUsers();
        }
      } catch {
        // Error handled by request interceptor
      }
    },
    [projectId, fetchUsers],
  );

  const getRoleIcon = (role: string, isSuperuser: boolean) => {
    if (isSuperuser) return <Crown className="size-4 text-yellow-500" />;
    if (role === 'admin') return <Shield className="size-4 text-blue-500" />;
    return <User className="size-4 text-muted-foreground" />;
  };

  const getRoleLabel = (role: string, isSuperuser: boolean) => {
    if (isSuperuser) return 'Super Admin';
    if (role === 'admin') return 'Project Admin';
    return 'Member';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-muted-foreground">
        <p className="text-lg">Project not found</p>
        <Button
          variant="link"
          onClick={() => navigate(Routes.Projects)}
          className="mt-2"
        >
          Back to Projects
        </Button>
      </div>
    );
  }

  return (
    <section className="p-8 max-w-4xl mx-auto">
      {/* Back button */}
      <Button
        variant="ghost"
        className="mb-4"
        onClick={() => navigate(Routes.Projects)}
      >
        <ArrowLeft className="size-4 mr-1" />
        Back to Projects
      </Button>

      {/* Project info card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="text-xl">{project.name}</span>
            {currentUserRole && (
              <span className="text-xs bg-muted px-2 py-1 rounded-full font-normal">
                {isAdmin
                  ? 'Super Admin'
                  : currentUserRole === 'admin'
                    ? 'Project Admin'
                    : 'Member'}
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            {project.description || 'No description provided.'}
          </p>
        </CardContent>
      </Card>

      {/* Users section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users className="size-5" />
            Team Members ({users.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Add user form — visible to Project Admin+ */}
          {isProjectAdminOrAbove && (
            <div className="flex items-center gap-2 mb-4 pb-4 border-b">
              <UserPlus className="size-4 text-muted-foreground" />
              <Input
                placeholder="User ID or email"
                value={addUserEmail}
                onChange={(e) => setAddUserEmail(e.target.value)}
                className="max-w-xs"
              />
              <select
                value={addUserRole}
                onChange={(e) =>
                  setAddUserRole(e.target.value as 'member' | 'admin')
                }
                className="h-9 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="member">Member</option>
                {isAdmin && <option value="admin">Project Admin</option>}
              </select>
              <Button
                size="sm"
                onClick={handleAddUser}
                disabled={addingUser || !addUserEmail.trim()}
              >
                {addingUser ? 'Adding...' : 'Add'}
              </Button>
            </div>
          )}

          {/* User list */}
          {users.length === 0 ? (
            <p className="text-muted-foreground text-sm py-4 text-center">
              No users assigned to this project yet.
            </p>
          ) : (
            <div className="space-y-2">
              {users.map((u) => (
                <div
                  key={u.user_id}
                  className="flex items-center justify-between py-2 px-3 rounded-md hover:bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    {getRoleIcon(u.role, u.is_superuser || false)}
                    <div>
                      <p className="text-sm font-medium">
                        {u.nickname || u.email || u.user_id}
                      </p>
                      {u.email && u.nickname && (
                        <p className="text-xs text-muted-foreground">
                          {u.email}
                        </p>
                      )}
                    </div>
                    <span className="text-xs bg-muted px-2 py-0.5 rounded-full">
                      {getRoleLabel(u.role, u.is_superuser || false)}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    {/* Role toggle — Super Admin only */}
                    {isAdmin && !u.is_superuser && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs"
                        onClick={() =>
                          handleChangeRole(
                            u.user_id,
                            u.role === 'admin' ? 'member' : 'admin',
                          )
                        }
                      >
                        {u.role === 'admin'
                          ? 'Demote to Member'
                          : 'Promote to Admin'}
                      </Button>
                    )}

                    {/* Remove — Project Admin+ (can't remove Super Admins) */}
                    {isProjectAdminOrAbove && !u.is_superuser && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7 text-destructive hover:text-destructive"
                        onClick={() => handleRemoveUser(u.user_id)}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
