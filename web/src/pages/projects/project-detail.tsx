/**
 * Project Detail Page — Tabbed view with Overview, Documents, and Team.
 *
 * Accessible to any project member. Project Admins+ can manage users.
 * Super Admins can change roles.
 */

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useFetchUserInfo } from '@/hooks/use-user-setting-request';
import { IProject, IProjectUser } from '@/interfaces/database/user-setting';
import { Routes } from '@/routes';
import projectService, {
  assignProjectUser,
  listProjectKBs,
  listProjectUsers,
  removeProjectUser,
  updateProjectUserRole,
} from '@/services/project-service';
import { isSuperAdmin } from '@/utils/rbac-util';
import {
  ArrowLeft,
  Crown,
  FileText,
  FolderKanban,
  Library,
  Shield,
  Trash2,
  User,
  UserPlus,
  Users,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';

interface ProjectKB {
  id: string;
  name: string;
  doc_num: number;
  chunk_num: number;
  create_time: string;
  update_time: string;
  parser_id?: string;
}

export default function ProjectDetail() {
  const { id: projectId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: userInfo } = useFetchUserInfo();

  const [project, setProject] = useState<IProject | null>(null);
  const [users, setUsers] = useState<IProjectUser[]>([]);
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Documents tab state
  const [kbs, setKbs] = useState<ProjectKB[]>([]);
  const [kbsLoading, setKbsLoading] = useState(false);

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

  // Fetch KBs for this project
  const fetchKbs = useCallback(async () => {
    if (!projectId) return;
    setKbsLoading(true);
    try {
      const res = await listProjectKBs(projectId);
      const data = res?.data;
      if (data?.code === 0) {
        setKbs(data.data?.kbs || []);
      }
    } catch {
      // Silent fail
    } finally {
      setKbsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchKbs();
  }, [fetchKbs]);

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

      {/* Project header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <FolderKanban className="size-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold">{project.name}</h1>
          <p className="text-sm text-muted-foreground">
            {project.description || 'No description provided.'}
          </p>
        </div>
        {currentUserRole && (
          <span className="text-xs bg-muted px-2 py-1 rounded-full font-medium ml-auto">
            {isAdmin
              ? 'Super Admin'
              : currentUserRole === 'admin'
                ? 'Project Admin'
                : 'Member'}
          </span>
        )}
      </div>

      {/* Tabbed content */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="overview" className="gap-1.5">
            <FolderKanban className="size-3.5" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="documents" className="gap-1.5">
            <Library className="size-3.5" />
            Documents
          </TabsTrigger>
          <TabsTrigger value="team" className="gap-1.5">
            <Users className="size-3.5" />
            Team
          </TabsTrigger>
        </TabsList>

        {/* ── Overview Tab ──────────────────────────── */}
        <TabsContent value="overview">
          <div className="grid grid-cols-3 gap-4 mb-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                    <Library className="size-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{kbs.length}</p>
                    <p className="text-xs text-muted-foreground">
                      Knowledge Bases
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
                    <FileText className="size-5 text-green-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">
                      {kbs.reduce((sum, kb) => sum + (kb.doc_num || 0), 0)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Total Documents
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10">
                    <Users className="size-5 text-purple-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{users.length}</p>
                    <p className="text-xs text-muted-foreground">
                      Team Members
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Project Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Project ID</span>
                <code className="text-xs bg-muted px-2 py-0.5 rounded">
                  {projectId}
                </code>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${
                    project.status === 'active'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {project.status || 'active'}
                </span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Documents Tab ─────────────────────────── */}
        <TabsContent value="documents">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Library className="size-5" />
                Knowledge Bases ({kbs.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {kbsLoading ? (
                <div className="flex justify-center py-8">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                </div>
              ) : kbs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Library className="size-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">
                    No knowledge bases in this project yet.
                  </p>
                  <p className="text-xs mt-1">
                    Create a new dataset and assign it to this project.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {kbs.map((kb) => (
                    <div
                      key={kb.id}
                      className="flex items-center justify-between py-3 px-4 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() => navigate(`/dataset/${kb.id}/document`)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10">
                          <Library className="size-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{kb.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {kb.doc_num || 0} documents
                            {kb.chunk_num
                              ? ` · ${kb.chunk_num} chunks`
                              : ''}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {kb.parser_id || 'general'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Team Tab ──────────────────────────────── */}
        <TabsContent value="team">
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
        </TabsContent>
      </Tabs>
    </section>
  );
}
