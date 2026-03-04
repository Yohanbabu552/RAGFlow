/**
 * QuickActions — 2x2 grid of quick action cards.
 * "Add User" only visible to super_admin role.
 */

import { Routes } from '@/routes';
import { FolderPlus, MessageSquare, Upload, UserPlus } from 'lucide-react';
import { useNavigate } from 'react-router';

interface QuickAction {
  label: string;
  icon: typeof Upload;
  path: string;
  /** If set, only visible when selectedRole matches */
  roles?: string[];
}

const actions: QuickAction[] = [
  {
    label: 'Upload Files',
    icon: Upload,
    path: Routes.Datasets,
  },
  {
    label: 'AI Chat',
    icon: MessageSquare,
    path: Routes.Chats,
  },
  {
    label: 'New Project',
    icon: FolderPlus,
    path: Routes.Projects,
  },
  {
    label: 'Add User',
    icon: UserPlus,
    path: Routes.AdminUsersPage,
    roles: ['super_admin'],
  },
];

export function QuickActions() {
  const navigate = useNavigate();
  const selectedRole = localStorage.getItem('selectedRole') || 'user';

  const visibleActions = actions.filter(
    (a) => !a.roles || a.roles.includes(selectedRole),
  );

  return (
    <div className="bg-white rounded-xl border border-[#E2E8F0]">
      <div className="px-5 py-4 border-b border-[#E2E8F0]">
        <h3 className="text-sm font-semibold text-[#1A202C]">Quick Actions</h3>
      </div>
      <div className="p-5 grid grid-cols-2 gap-3">
        {visibleActions.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.label}
              onClick={() => navigate(action.path)}
              className="flex flex-col items-center p-4 rounded-lg border border-[#E2E8F0] hover:border-[#0078D4] hover:bg-[#F8FAFF] hover:shadow-sm transition-all text-center"
            >
              <Icon className="size-6 text-[#0078D4] mb-2" />
              <span className="text-xs font-semibold text-[#1A202C]">
                {action.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
