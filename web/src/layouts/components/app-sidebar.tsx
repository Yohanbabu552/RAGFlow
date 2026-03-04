/**
 * AppSidebar — Dark blue sidebar with role-based navigation.
 *
 * Matches the EMAMI Document Intelligence reference design:
 * - 260px fixed sidebar, dark blue bg (#0F1F3A)
 * - Logo + branding at top
 * - MAIN section: Dashboard, Projects, Documents, AI Chat (all roles)
 * - ADMINISTRATION section: User Management (super-admin), Admin Dashboard, Audit Logs
 * - Footer: User avatar + name + logout
 */

import { RAGFlowAvatar } from '@/components/ragflow-avatar';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from '@/components/ui/sidebar';
import { useFetchUserInfo } from '@/hooks/use-user-setting-request';
import { Routes } from '@/routes';
import { isSuperAdmin, getEffectiveRole } from '@/utils/rbac-util';
import {
  FileText,
  FolderKanban,
  LayoutDashboard,
  Library,
  LogOut,
  MessageSquareText,
  Settings,
  Shield,
  UserCog,
  Users,
} from 'lucide-react';
import { useCallback } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router';

/** Navigation item definition */
interface NavItem {
  path: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  /** Which roles can see this item. null = all roles */
  roles: ('super_admin' | 'project_admin' | 'member')[] | null;
}

/** Main navigation items (visible to all authenticated users) */
const mainNavItems: NavItem[] = [
  {
    path: Routes.Root,
    label: 'Dashboard',
    icon: LayoutDashboard,
    roles: null,
  },
  {
    path: Routes.Projects,
    label: 'Projects',
    icon: FolderKanban,
    roles: null,
  },
  {
    path: Routes.Datasets,
    label: 'Documents',
    icon: Library,
    roles: null,
  },
  {
    path: Routes.Chats,
    label: 'AI Chat',
    icon: MessageSquareText,
    roles: null,
  },
];

/** Administration items (role-gated) */
const adminNavItems: NavItem[] = [
  {
    path: Routes.AdminUsersPage,
    label: 'User Management',
    icon: UserCog,
    roles: ['super_admin'],
  },
  {
    path: Routes.AdminDashboardPage,
    label: 'Admin Dashboard',
    icon: Shield,
    roles: ['super_admin', 'project_admin'],
  },
  {
    path: Routes.AdminAuditPage,
    label: 'Audit Logs',
    icon: FileText,
    roles: ['super_admin'],
  },
];

export function AppSidebar() {
  const { data: userInfo } = useFetchUserInfo();
  const { nickname, avatar, email } = userInfo || {};
  const isAdmin = isSuperAdmin(userInfo);
  const effectiveRole = getEffectiveRole(userInfo);
  const location = useLocation();
  const navigate = useNavigate();

  /** Check if user can see a nav item */
  const canSee = useCallback(
    (item: NavItem) => {
      if (!item.roles) return true;
      if (isAdmin) return true;
      if (!effectiveRole) return false;
      return item.roles.includes(effectiveRole);
    },
    [isAdmin, effectiveRole],
  );

  /** Check if a nav item is active */
  const isActive = useCallback(
    (path: string) => {
      if (path === Routes.Root) return location.pathname === '/';
      return location.pathname.startsWith(path);
    },
    [location.pathname],
  );

  /** Filter visible admin items */
  const visibleAdminItems = adminNavItems.filter(canSee);

  const handleLogout = useCallback(() => {
    navigate(Routes.Login);
  }, [navigate]);

  return (
    <Sidebar
      className="border-r-0"
      style={{
        '--sidebar-width': '260px',
        '--sidebar-width-icon': '48px',
      } as React.CSSProperties}
    >
      {/* ── Logo & Branding ─────────────────────── */}
      <SidebarHeader className="bg-[#0F1F3A] px-5 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-[#0078D4] to-[#40EBE3]">
            <span className="text-lg font-bold text-white">E</span>
          </div>
          <div className="flex flex-col group-data-[collapsible=icon]:hidden">
            <span className="text-sm font-semibold text-white leading-tight">
              Emami Document
            </span>
            <span className="text-[10px] text-white/60 leading-tight">
              Intelligence Platform
            </span>
          </div>
        </div>
      </SidebarHeader>

      {/* ── Navigation ──────────────────────────── */}
      <SidebarContent className="bg-[#0F1F3A] px-3">
        {/* Main Section */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] font-semibold uppercase tracking-widest text-white/40 px-3 mb-1">
            Main
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.filter(canSee).map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);

                return (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton
                      asChild
                      isActive={active}
                      className={`h-10 rounded-lg transition-all ${
                        active
                          ? 'bg-[#0078D4]/20 text-white font-medium border-l-2 border-[#0078D4]'
                          : 'text-white/70 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      <NavLink to={item.path} end={item.path === Routes.Root}>
                        <Icon
                          className={`size-[18px] ${active ? 'text-[#0078D4]' : 'text-white/60'}`}
                        />
                        <span>{item.label}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Administration Section (visible to admins only) */}
        {visibleAdminItems.length > 0 && (
          <>
            <SidebarSeparator className="bg-white/10 mx-3" />
            <SidebarGroup>
              <SidebarGroupLabel className="text-[10px] font-semibold uppercase tracking-widest text-white/40 px-3 mb-1">
                Administration
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {visibleAdminItems.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.path);

                    return (
                      <SidebarMenuItem key={item.path}>
                        <SidebarMenuButton
                          asChild
                          isActive={active}
                          className={`h-10 rounded-lg transition-all ${
                            active
                              ? 'bg-[#0078D4]/20 text-white font-medium border-l-2 border-[#0078D4]'
                              : 'text-white/70 hover:bg-white/10 hover:text-white'
                          }`}
                        >
                          <NavLink to={item.path}>
                            <Icon
                              className={`size-[18px] ${active ? 'text-[#0078D4]' : 'text-white/60'}`}
                            />
                            <span>{item.label}</span>
                          </NavLink>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        )}
      </SidebarContent>

      {/* ── Footer: User + Logout ───────────────── */}
      <SidebarFooter className="bg-[#0F1F3A] px-4 py-3 border-t border-white/10">
        <div className="flex items-center justify-between">
          <div
            className="flex items-center gap-2.5 cursor-pointer group-data-[collapsible=icon]:justify-center"
            onClick={() => navigate('/user-setting/profile')}
          >
            <RAGFlowAvatar
              name={nickname}
              avatar={avatar}
              isPerson
              className="size-8 shrink-0"
            />
            <div className="flex flex-col group-data-[collapsible=icon]:hidden min-w-0">
              <span className="text-xs font-medium text-white truncate max-w-[140px]">
                {nickname || 'User'}
              </span>
              <span className="text-[10px] text-white/50 truncate max-w-[140px]">
                {email}
              </span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="p-1.5 rounded-md hover:bg-white/10 transition-colors text-white/50 hover:text-white group-data-[collapsible=icon]:hidden"
            title="Sign Out"
          >
            <LogOut className="size-4" />
          </button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
