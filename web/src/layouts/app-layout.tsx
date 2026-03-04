/**
 * AppLayout — Main application layout with sidebar + header + content.
 *
 * Auth guard: If user is not logged in, redirects to /login-next.
 * After login, shows:
 * - Fixed dark blue sidebar (260px) on the left
 * - White header (60px) at the top of content area
 * - Scrollable content area below header
 */

import { SidebarProvider } from '@/components/ui/sidebar';
import authorizationUtil from '@/utils/authorization-util';
import { Navigate, Outlet } from 'react-router';
import { AppHeader } from './components/app-header';
import { AppSidebar } from './components/app-sidebar';

export default function AppLayout() {
  // Auth guard — redirect to login if no token
  const auth = authorizationUtil.getAuthorization();
  if (!auth) {
    return <Navigate to="/login-next" replace />;
  }

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex h-screen w-full bg-[#F4F6F9]">
        {/* Sidebar */}
        <AppSidebar />

        {/* Main content area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Header */}
          <AppHeader />

          {/* Page content */}
          <main className="flex-1 overflow-auto p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
