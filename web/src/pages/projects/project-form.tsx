/**
 * Project Create/Edit Dialog — Form for creating or editing a project.
 *
 * Only Super Admins can create projects.
 */

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import projectService from '@/services/project-service';
import { useCallback, useState } from 'react';

interface ProjectFormDialogProps {
  hideModal: () => void;
  onSuccess: () => void;
  initialValues?: { id?: string; name?: string; description?: string };
}

export function ProjectFormDialog({
  hideModal,
  onSuccess,
  initialValues,
}: ProjectFormDialogProps) {
  const isEditing = !!initialValues?.id;
  const [name, setName] = useState(initialValues?.name || '');
  const [description, setDescription] = useState(
    initialValues?.description || '',
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = useCallback(async () => {
    if (!name.trim()) {
      setError('Project name is required.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      let res;
      if (isEditing) {
        res = await projectService.updateProject({
          project_id: initialValues!.id,
          name: name.trim(),
          description: description.trim(),
        });
      } else {
        res = await projectService.createProject({
          name: name.trim(),
          description: description.trim(),
        });
      }
      const data = res?.data;
      if (data?.code === 0) {
        onSuccess();
      } else {
        setError(data?.message || 'Failed to save project.');
      }
    } catch {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [name, description, isEditing, initialValues, onSuccess]);

  return (
    <Dialog open onOpenChange={(open) => !open && hideModal()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Project' : 'Create Project'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="project-name">Name *</Label>
            <Input
              id="project-name"
              placeholder="Enter project name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={100}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="project-desc">Description</Label>
            <Textarea
              id="project-desc"
              placeholder="Enter a brief description (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              maxLength={500}
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={hideModal} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading || !name.trim()}>
            {loading
              ? 'Saving...'
              : isEditing
                ? 'Save Changes'
                : 'Create Project'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
