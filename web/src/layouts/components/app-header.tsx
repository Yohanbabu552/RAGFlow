/**
 * AppHeader — White top header with page title, breadcrumb, search, notifications.
 *
 * Matches the EMAMI reference design:
 * - 60px height, white background, bottom border
 * - Left: sidebar trigger + page title + breadcrumb
 * - Right: search box + notification bell
 */

import { SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import { Routes } from '@/routes';
import { Bell, Search } from 'lucide-react';
import { useMemo } from 'react';
import { useLocation } from 'react-router';

/** Map route paths to page titles and breadcrumbs */
const pageTitleMap: Record<string, { title: string; breadcrumb?: string }> = {
  [Routes.Root]: { title: 'Dashboard' },
  [Routes.Datasets]: { title: 'Documents', breadcrumb: 'Datasets' },
  [Routes.Chats]: { title: 'AI Chat', breadcrumb: 'Conversations' },
  [Routes.Searches]: { title: 'Search', breadcrumb: 'Searches' },
  [Routes.Agents]: { title: 'Agents', breadcrumb: 'Workflows' },
  [Routes.Memories]: { title: 'Memories' },
  [Routes.Projects]: { title: 'Projects' },
  [Routes.Files]: { title: 'File Manager' },
  '/admin-users': { title: 'User Management', breadcrumb: 'Administration' },
  '/admin-dashboard': { title: 'Admin Dashboard', breadcrumb: 'Administration' },
  '/admin-audit': { title: 'Audit Logs', breadcrumb: 'Administration' },
  '/user-setting': { title: 'Settings' },
  '/user-setting/profile': { title: 'Profile', breadcrumb: 'Settings' },
  '/user-setting/team': { title: 'Team', breadcrumb: 'Settings' },
  '/user-setting/model': { title: 'Model Providers', breadcrumb: 'Settings' },
};

export function AppHeader() {
  const { pathname } = useLocation();

  const pageInfo = useMemo(() => {
    // Try exact match first
    if (pageTitleMap[pathname]) return pageTitleMap[pathname];

    // Try prefix match
    const match = Object.entries(pageTitleMap).find(
      ([path]) => path !== '/' && pathname.startsWith(path),
    );
    if (match) return match[1];

    // Fallback
    return { title: 'Dashboard' };
  }, [pathname]);

  return (
    <header className="h-[60px] shrink-0 flex items-center justify-between px-6 bg-white border-b border-[#E2E8F0] sticky top-0 z-40">
      {/* Left side: Sidebar trigger + title + breadcrumb */}
      <div className="flex items-center gap-3">
        <SidebarTrigger className="text-[#64748B] hover:text-[#1A202C] hover:bg-[#F4F6F9] size-8" />
        <Separator orientation="vertical" className="h-5 bg-[#E2E8F0]" />

        <div className="flex flex-col">
          {pageInfo.breadcrumb && (
            <span className="text-[10px] text-[#94A3B8] uppercase tracking-wide leading-tight">
              {pageInfo.breadcrumb}
            </span>
          )}
          <h1 className="text-base font-semibold text-[#1A202C] leading-tight">
            {pageInfo.title}
          </h1>
        </div>
      </div>

      {/* Right side: Search + Notifications */}
      <div className="flex items-center gap-4">
        {/* Search Box */}
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#94A3B8]" />
          <input
            type="text"
            placeholder="Search documents, projects..."
            className="h-9 w-64 rounded-lg border border-[#E2E8F0] bg-[#F4F6F9] pl-9 pr-4 text-sm text-[#1A202C] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#0078D4]/20 focus:border-[#0078D4] transition-colors"
          />
        </div>

        {/* Notification Bell */}
        <button
          className="relative p-2 rounded-lg text-[#64748B] hover:text-[#1A202C] hover:bg-[#F4F6F9] transition-colors"
          title="Notifications"
        >
          <Bell className="size-[18px]" />
          {/* Notification dot */}
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-[#DC3545] ring-2 ring-white" />
        </button>
      </div>
    </header>
  );
}
