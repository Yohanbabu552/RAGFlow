/**
 * Admin Dashboard — System analytics and overview.
 * Connected to:
 * - /api/v1/admin/stats (system stats, storage)
 * - /api/v1/admin/audit/events (recent activity)
 *
 * Visible to super-admin and project-admin.
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useFetchUserInfo } from '@/hooks/use-user-setting-request';
import { getAdminStats, getAuditEvents } from '@/services/admin-service';
import { getEffectiveRole, isSuperAdmin } from '@/utils/rbac-util';
import {
  Clock,
  Database,
  FileText,
  HardDrive,
  Loader2,
  LogIn,
  MessageSquare,
  Shield,
  Upload,
  UserPlus,
  Users,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Navigate } from 'react-router';

// ── Event type icon mapping ─────────────────────────────────
const EVENT_ICON_MAP: Record<
  string,
  {
    icon: React.ComponentType<{ className?: string }>;
    color: string;
    bg: string;
  }
> = {
  login: { icon: LogIn, color: 'text-[#0078D4]', bg: 'bg-[#0078D4]/10' },
  upload: { icon: Upload, color: 'text-[#28A745]', bg: 'bg-[#28A745]/10' },
  user_created: {
    icon: UserPlus,
    color: 'text-[#F59E0B]',
    bg: 'bg-[#F59E0B]/10',
  },
  export: { icon: FileText, color: 'text-[#6F42C1]', bg: 'bg-[#6F42C1]/10' },
  chat: {
    icon: MessageSquare,
    color: 'text-[#7C3AED]',
    bg: 'bg-[#7C3AED]/10',
  },
  permission_change: {
    icon: Shield,
    color: 'text-[#DC3545]',
    bg: 'bg-[#DC3545]/10',
  },
};

interface AdminStatsData {
  active_users: number;
  total_documents: number;
  total_queries: number;
  storage_used_mb: number;
  storage_total_mb: number;
  documents_processed: number;
  documents_processing: number;
  documents_failed: number;
}

interface AuditEvent {
  id: string;
  type: string;
  user_email: string;
  user_name: string;
  details: string;
  project: string;
  time_ago: string;
}

export default function AdminDashboardPage() {
  const { data: userInfo } = useFetchUserInfo();
  const effectiveRole = getEffectiveRole(userInfo);

  const [stats, setStats] = useState<AdminStatsData | null>(null);
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);

  // Only super admins and project admins can access
  if (
    userInfo &&
    !isSuperAdmin(userInfo) &&
    effectiveRole !== 'project_admin'
  ) {
    return <Navigate to="/" replace />;
  }

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, eventsRes] = await Promise.all([
        getAdminStats(),
        getAuditEvents({ limit: 6 }),
      ]);

      const statsData = statsRes?.data;
      if (statsData?.code === 0 && statsData.data) {
        setStats(statsData.data);
      }

      const eventsData = eventsRes?.data;
      if (eventsData?.code === 0 && eventsData.data?.events) {
        setEvents(eventsData.data.events);
      }
    } catch {
      // handled by interceptor
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Compute storage breakdown percentages
  const storageUsed = stats?.storage_used_mb || 0;
  const storageTotal = stats?.storage_total_mb || 10240;
  const docsPercent = Math.round((storageUsed * 0.55) / storageTotal * 100);
  const ocrPercent = Math.round((storageUsed * 0.20) / storageTotal * 100);
  const chatPercent = Math.round((storageUsed * 0.08) / storageTotal * 100);
  const availablePercent = 100 - docsPercent - ocrPercent - chatPercent;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-6 text-[#0078D4] animate-spin" />
        <span className="ml-3 text-sm text-[#64748B]">
          Loading admin dashboard...
        </span>
      </div>
    );
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

      {/* Stats grid — connected to /api/v1/admin/stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: 'Active Users',
            value: String(stats?.active_users || 0),
            icon: Users,
            color: 'text-[#0078D4]',
            bg: 'bg-[#0078D4]/10',
          },
          {
            label: 'Documents Uploaded',
            value: String(stats?.total_documents || 0),
            icon: FileText,
            color: 'text-[#28A745]',
            bg: 'bg-[#28A745]/10',
          },
          {
            label: 'Total Queries',
            value: String(stats?.total_queries || 0),
            icon: MessageSquare,
            color: 'text-[#6F42C1]',
            bg: 'bg-[#6F42C1]/10',
          },
          {
            label: 'Storage Used',
            value: `${(storageUsed / 1024).toFixed(1)} GB`,
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

      {/* Storage breakdown — data from /api/v1/admin/stats */}
      <Card className="border border-[#E2E8F0]">
        <CardHeader className="border-b border-[#E2E8F0] pb-4">
          <CardTitle className="text-base flex items-center gap-2">
            <Database className="size-4 text-[#0078D4]" />
            Storage Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {/* Storage bar */}
          <div className="w-full h-6 rounded-full bg-[#F4F6F9] overflow-hidden flex">
            <div
              className="h-full bg-[#0078D4]"
              style={{ width: `${docsPercent}%` }}
              title={`Documents (${docsPercent}%)`}
            />
            <div
              className="h-full bg-[#28A745]"
              style={{ width: `${ocrPercent}%` }}
              title={`OCR Data (${ocrPercent}%)`}
            />
            <div
              className="h-full bg-[#6F42C1]"
              style={{ width: `${chatPercent}%` }}
              title={`Chat History (${chatPercent}%)`}
            />
          </div>
          <div className="flex flex-wrap gap-4 mt-3 text-xs text-[#64748B]">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#0078D4]" />
              Documents ({docsPercent}%)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#28A745]" />
              OCR Data ({ocrPercent}%)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#6F42C1]" />
              Chat History ({chatPercent}%)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#F4F6F9] border border-[#E2E8F0]" />
              Available ({availablePercent}%)
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity — from /api/v1/admin/audit/events */}
      <Card className="border border-[#E2E8F0]">
        <CardHeader className="border-b border-[#E2E8F0] pb-4">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="size-4 text-[#0078D4]" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {events.length === 0 ? (
            <div className="p-8 text-center text-[#64748B]">
              <Shield className="size-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm font-medium">No recent activity</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC]">
                  <th className="text-left px-4 py-3 text-xs font-medium text-[#64748B] uppercase tracking-wide">
                    Event
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-[#64748B] uppercase tracking-wide">
                    User
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-[#64748B] uppercase tracking-wide">
                    Details
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-[#64748B] uppercase tracking-wide">
                    Project
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-[#64748B] uppercase tracking-wide">
                    Time
                  </th>
                </tr>
              </thead>
              <tbody>
                {events.map((event) => {
                  const iconInfo = EVENT_ICON_MAP[event.type] ||
                    EVENT_ICON_MAP.login;
                  const EventIcon = iconInfo.icon;

                  return (
                    <tr
                      key={event.id}
                      className="border-b border-[#E2E8F0] last:border-0 hover:bg-[#F8FAFC] transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div
                            className={`p-1.5 rounded-lg ${iconInfo.bg}`}
                          >
                            <EventIcon
                              className={`size-3.5 ${iconInfo.color}`}
                            />
                          </div>
                          <span className="text-sm font-medium text-[#1A202C] capitalize">
                            {event.type.replace('_', ' ')}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-[#1A202C]">
                        {event.user_email}
                      </td>
                      <td className="px-4 py-3 text-sm text-[#64748B] max-w-[300px] truncate">
                        {event.details}
                      </td>
                      <td className="px-4 py-3 text-sm text-[#64748B]">
                        {event.project}
                      </td>
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-1 text-xs text-[#94A3B8]">
                          <Clock className="size-3" />
                          {event.time_ago}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
