/**
 * RBACGuard — Wrapper component for role-gated content.
 *
 * Renders children only if user has the required role.
 * Otherwise shows access denied or redirects.
 *
 * Usage:
 *   <RBACGuard requiredRoles={['super_admin']}>
 *     <AdminOnlyContent />
 *   </RBACGuard>
 */

import { useFetchUserInfo } from '@/hooks/use-user-setting-request';
import { EffectiveRole } from '@/interfaces/database/user-setting';
import { getEffectiveRole, isSuperAdmin } from '@/utils/rbac-util';
import { ShieldAlert } from 'lucide-react';
import type { ReactNode } from 'react';
import { Navigate } from 'react-router';

interface RBACGuardProps {
  /** Required roles to see the content */
  requiredRoles: EffectiveRole[];
  /** What to render when access is denied (defaults to AccessDenied card) */
  fallback?: ReactNode;
  /** If true, redirect to home instead of showing fallback */
  redirect?: boolean;
  /** Children to render when access is granted */
  children: ReactNode;
}

export function RBACGuard({
  requiredRoles,
  fallback,
  redirect = false,
  children,
}: RBACGuardProps) {
  const { data: userInfo } = useFetchUserInfo();

  // Still loading — show nothing
  if (!userInfo) return null;

  // Super admin always has access
  if (isSuperAdmin(userInfo)) return <>{children}</>;

  // Check role
  const effectiveRole = getEffectiveRole(userInfo);
  const hasAccess = effectiveRole && requiredRoles.includes(effectiveRole);

  if (hasAccess) return <>{children}</>;

  // Access denied
  if (redirect) return <Navigate to="/" replace />;
  if (fallback) return <>{fallback}</>;

  return <AccessDenied />;
}

/** Default access denied card */
export function AccessDenied() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="text-center max-w-sm">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#DC3545]/10">
          <ShieldAlert className="size-8 text-[#DC3545]" />
        </div>
        <h2 className="text-xl font-bold text-[#1A202C] mb-2">
          Access Denied
        </h2>
        <p className="text-sm text-[#64748B] leading-relaxed">
          You don't have permission to access this page. Contact your
          administrator if you believe this is an error.
        </p>
      </div>
    </div>
  );
}
