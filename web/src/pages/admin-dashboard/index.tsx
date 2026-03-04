/**
 * Admin Dashboard — System analytics and overview (placeholder).
 *
 * Visible to super-admin and project-admin. Full implementation in Phase 5.
 * Will include: system stats, storage chart, tabs (Overview | Audit Logs).
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useFetchUserInfo } from '@/hooks/use-user-setting-request';
import { getEffectiveRole, isSuperAdmin } from '@/utils/rbac-util';
import {
  BarChart3,
  Database,
  FileText,
  HardDrive,
  MessageSquare,
  Shield,
  Users,
} from 'lucide-react';
import { Navigate } from 'react-router';

export default function AdminDashboardPage() {
  const { data: userInfo } = useFetchUserInfo();
  const effectiveRole = getEffectiveRole(userInfo);

  // Only super admins and project admins can access
  if (
    userInfo &&
    !isSuperAdmin(userInfo) &&
    effectiveRole !== 'project_admin'
  ) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-[#1A202C]">Admin Dashboard</h1>
        <p className="text-sm text-[#64748B] mt-1">
          System overview and analytics
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: 'Active Users',
            value: '5',
            icon: Users,
            color: 'text-[#0078D4]',
            bg: 'bg-[#0078D4]/10',
          },
          {
            label: 'Documents Uploaded',
            value: '48',
            icon: FileText,
            color: 'text-[#28A745]',
            bg: 'bg-[#28A745]/10',
          },
          {
            label: 'Total Queries',
            value: '256',
            icon: MessageSquare,
            color: 'text-[#6F42C1]',
            bg: 'bg-[#6F42C1]/10',
          },
          {
            label: 'Storage Used',
            value: '2.4 GB',
            icon: HardDrive,
            color: 'text-[#F59E0B]',
            bg: 'bg-[#F59E0B]/10',
          },
        ].map((stat) => (
          <Card key={stat.label} className="border border-[#E2E8F0]">
            <CardContent className="p-4 flex items-center gap-4">
              <div className={`p-3 rounded-xl ${stat.bg}`}>
                <stat.icon className={`size-5 ${stat.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-[#1A202C]">
                  {stat.value}
                </p>
                <p className="text-xs text-[#64748B]">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Storage breakdown placeholder */}
      <Card className="border border-[#E2E8F0]">
        <CardHeader className="border-b border-[#E2E8F0] pb-4">
          <CardTitle className="text-base flex items-center gap-2">
            <Database className="size-4 text-[#0078D4]" />
            Storage Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {/* Simple storage bar */}
          <div className="w-full h-6 rounded-full bg-[#F4F6F9] overflow-hidden flex">
            <div
              className="h-full bg-[#0078D4]"
              style={{ width: '55%' }}
              title="Documents (55%)"
            />
            <div
              className="h-full bg-[#28A745]"
              style={{ width: '20%' }}
              title="OCR Data (20%)"
            />
            <div
              className="h-full bg-[#6F42C1]"
              style={{ width: '8%' }}
              title="Chat History (8%)"
            />
          </div>
          <div className="flex flex-wrap gap-4 mt-3 text-xs text-[#64748B]">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#0078D4]" />
              Documents (55%)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#28A745]" />
              OCR Data (20%)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#6F42C1]" />
              Chat History (8%)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#F4F6F9] border border-[#E2E8F0]" />
              Available (17%)
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Audit logs placeholder */}
      <Card className="border border-[#E2E8F0]">
        <CardHeader className="border-b border-[#E2E8F0] pb-4">
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart3 className="size-4 text-[#0078D4]" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent className="p-8">
          <div className="text-center text-[#64748B]">
            <Shield className="size-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm font-medium">
              Analytics dashboard coming in Phase 5
            </p>
            <p className="text-xs mt-1">
              Will include audit logs, usage charts, and system health metrics
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
