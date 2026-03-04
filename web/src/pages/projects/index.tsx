/**
 * Projects List Page — Lists all projects the user has access to.
 *
 * Super Admins see all projects + can create new ones.
 * Project Admins see only assigned projects.
 * Standard Users see only assigned projects.
 */

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useFetchUserInfo } from '@/hooks/use-user-setting-request';
import { IProject } from '@/interfaces/database/user-setting';
import { Routes } from '@/routes';
import projectService from '@/services/project-service';
import { isSuperAdmin } from '@/utils/rbac-util';
import {
  FolderKanban,
  Plus,
  Settings,
  Trash2,
  Users,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { ProjectFormDialog } from './project-form';

export default function Projects() {
  const navigate = useNavigate();
  const { data: userInfo } = useFetchUserInfo();
  const [projects, setProjects] = useState<IProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [formVisible, setFormVisible] = useState(false);

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
      // Error handled by request interceptor
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleDelete = useCallback(
    async (projectId: string, e: React.MouseEvent) => {
      e.stopPropagation();
      if (!window.confirm('Are you sure you want to delete this project?')) {
        return;
      }
      try {
        const res = await projectService.deleteProject({ project_id: projectId });
        const data = res?.data;
        if (data?.code === 0) {
          fetchProjects();
        }
      } catch {
        // Error handled by request interceptor
      }
    },
    [fetchProjects],
  );

  const handleCardClick = useCallback(
    (projectId: string) => {
      navigate(`${Routes.ProjectDetail}/${projectId}`);
    },
    [navigate],
  );

  return (
    <section className="py-4 flex-1 flex flex-col px-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <FolderKanban className="size-6" />
          <h1 className="text-2xl font-semibold">Projects</h1>
          <span className="text-muted-foreground text-sm ml-2">
            ({projects.length})
          </span>
        </div>
        {isAdmin && (
          <Button onClick={() => setFormVisible(true)}>
            <Plus className="h-4 w-4 mr-1" />
            New Project
          </Button>
        )}
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex items-center justify-center h-64">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      )}

      {/* Empty state */}
      {!loading && projects.length === 0 && (
        <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
          <FolderKanban className="size-16 mb-4 opacity-30" />
          <p className="text-lg">No projects yet</p>
          {isAdmin && (
            <p className="text-sm mt-2">
              Create a project to organize your datasets and team.
            </p>
          )}
        </div>
      )}

      {/* Project cards grid */}
      {!loading && projects.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 max-h-[calc(100dvh-280px)] overflow-auto">
          {projects.map((project) => (
            <Card
              key={project.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => handleCardClick(project.id)}
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <FolderKanban className="size-5 text-primary" />
                    <h3 className="font-medium text-base truncate max-w-[180px]">
                      {project.name}
                    </h3>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCardClick(project.id);
                      }}
                    >
                      <Settings className="size-3.5" />
                    </Button>
                    {isAdmin && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7 text-destructive hover:text-destructive"
                        onClick={(e) => handleDelete(project.id, e)}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2 mb-3 min-h-[40px]">
                  {project.description || 'No description'}
                </p>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Users className="size-3.5" />
                  <span>Team project</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create project dialog */}
      {formVisible && (
        <ProjectFormDialog
          hideModal={() => setFormVisible(false)}
          onSuccess={() => {
            setFormVisible(false);
            fetchProjects();
          }}
        />
      )}
    </section>
  );
}
