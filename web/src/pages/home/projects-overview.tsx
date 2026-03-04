/**
 * Projects Overview — Shows a quick project summary on the home page.
 *
 * Displays the user's assigned projects with role badges.
 * Super Admins see all projects.
 */

import { Card, CardContent } from '@/components/ui/card';
import { useFetchUserInfo } from '@/hooks/use-user-setting-request';
import { IProject } from '@/interfaces/database/user-setting';
import { Routes } from '@/routes';
import projectService from '@/services/project-service';
import { isSuperAdmin } from '@/utils/rbac-util';
import {
  ArrowRight,
  Crown,
  FolderKanban,
  Plus,
  Shield,
  User,
  Users,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router';

export function ProjectsOverview() {
  const navigate = useNavigate();
  const { data: userInfo } = useFetchUserInfo();
  const [projects, setProjects] = useState<IProject[]>([]);
  const [loading, setLoading] = useState(true);
  const isAdmin = isSuperAdmin(userInfo);

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    try {
      const res = await projectService.listProjects();
      const data = res?.data;
      if (data?.code === 0) {
        setProjects(data.data || []);
      }
    } catch {
      // Silent fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const getUserRoleForProject = (projectId: string) => {
    if (isAdmin) return 'super_admin';
    const role = userInfo?.project_roles?.find(
      (r) => r.project_id === projectId,
    );
    return role?.role || null;
  };

  const getRoleDisplay = (role: string | null) => {
    switch (role) {
      case 'super_admin':
        return { icon: Crown, label: 'Super Admin', color: 'text-amber-500' };
      case 'admin':
        return { icon: Shield, label: 'Admin', color: 'text-blue-500' };
      case 'member':
        return { icon: User, label: 'Member', color: 'text-emerald-500' };
      default:
        return { icon: User, label: 'Viewer', color: 'text-muted-foreground' };
    }
  };

  if (loading) return null;

  return (
    <section className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-semibold flex gap-2.5 items-center">
          <FolderKanban className="size-7" />
          Your Projects
        </h2>
        <button
          onClick={() => navigate(Routes.Projects)}
          className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
        >
          View all
          <ArrowRight className="size-4" />
        </button>
      </div>

      {projects.length === 0 ? (
        <Card
          className="border-dashed cursor-pointer hover:border-primary/50 transition-colors"
          onClick={() => navigate(Routes.Projects)}
        >
          <CardContent className="py-8 flex flex-col items-center justify-center text-muted-foreground">
            <FolderKanban className="size-10 mb-2 opacity-30" />
            <p className="text-sm">No projects yet</p>
            {isAdmin && (
              <p className="text-xs mt-1 flex items-center gap-1">
                <Plus className="size-3" />
                Create your first project
              </p>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {projects.slice(0, 4).map((project) => {
            const role = getUserRoleForProject(project.id);
            const roleDisplay = getRoleDisplay(role);
            const RoleIcon = roleDisplay.icon;

            return (
              <Card
                key={project.id}
                className="cursor-pointer hover:shadow-md transition-all hover:border-primary/30"
                onClick={() =>
                  navigate(`${Routes.ProjectDetail}/${project.id}`)
                }
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <FolderKanban className="size-4 text-primary shrink-0" />
                      <h3 className="font-medium text-sm truncate">
                        {project.name}
                      </h3>
                    </div>
                    <span
                      className={`inline-flex items-center gap-1 text-[10px] font-medium shrink-0 ${roleDisplay.color}`}
                    >
                      <RoleIcon className="size-3" />
                      {roleDisplay.label}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-1 mb-2">
                    {project.description || 'No description'}
                  </p>
                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    <Users className="size-3" />
                    <span>Team project</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {/* Show "See All" card if more than 4 projects */}
          {projects.length > 4 && (
            <Card
              className="cursor-pointer hover:shadow-md transition-all border-dashed hover:border-primary/30"
              onClick={() => navigate(Routes.Projects)}
            >
              <CardContent className="p-4 flex items-center justify-center h-full">
                <div className="text-center text-muted-foreground">
                  <p className="text-sm font-medium">
                    +{projects.length - 4} more
                  </p>
                  <p className="text-xs flex items-center gap-1 mt-1">
                    See all projects
                    <ArrowRight className="size-3" />
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </section>
  );
}
