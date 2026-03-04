/**
 * Admin Audit — Audit logs page connected to backend.
 * Connected to /api/v1/admin/audit/events (getAuditEvents).
 *
 * Super-admin only.
 * Features: event filters, searchable audit trail table, CSV export stub.
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useFetchUserInfo } from '@/hooks/use-user-setting-request';
import { getAuditEvents } from '@/services/admin-service';
import { isSuperAdmin } from '@/utils/rbac-util';
import {
  Clock,
  Download,
  FileText,
  Filter,
  Loader2,
  LogIn,
  MessageSquare,
  Shield,
  Upload,
  UserPlus,
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
    label: string;
  }
> = {
  login: {
    icon: LogIn,
    color: 'text-[#0078D4]',
    bg: 'bg-[#0078D4]/10',
    label: 'Login',
  },
  upload: {
    icon: Upload,
    color: 'text-[#28A745]',
    bg: 'bg-[#28A745]/10',
    label: 'Upload',
  },
  user_created: {
    icon: UserPlus,
    color: 'text-[#F59E0B]',
    bg: 'bg-[#F59E0B]/10',
    label: 'User Created',
  },
  export: {
    icon: Download,
    color: 'text-[#6F42C1]',
    bg: 'bg-[#6F42C1]/10',
    label: 'Export',
  },
  chat: {
    icon: MessageSquare,
    color: 'text-[#7C3AED]',
    bg: 'bg-[#7C3AED]/10',
    label: 'Chat Query',
  },
  permission_change: {
    icon: Shield,
    color: 'text-[#DC3545]',
    bg: 'bg-[#DC3545]/10',
    label: 'Permission Change',
  },
};

interface AuditEvent {
  id: string;
  type: string;
  user_email: string;
  user_name: string;
  details: string;
  project: string;
  time_ago: string;
}

export default function AdminAuditPage() {
  const { data: userInfo } = useFetchUserInfo();

  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  // Filters
  const [eventTypeFilter, setEventTypeFilter] = useState('');
  const [userFilter, setUserFilter] = useState('');

  // Only super admins can access
  if (userInfo && !isSuperAdmin(userInfo)) {
    return <Navigate to="/" replace />;
  }

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const filters: { event_type?: string; user_email?: string; limit?: number } = {
        limit: 50,
      };
      if (eventTypeFilter) filters.event_type = eventTypeFilter;
      if (userFilter) filters.user_email = userFilter;

      const res = await getAuditEvents(filters);
      const data = res?.data;
      if (data?.code === 0 && data.data) {
        setEvents(data.data.events || []);
        setTotal(data.data.total || 0);
      }
    } catch {
      // handled by interceptor
    } finally {
      setLoading(false);
    }
  }, [eventTypeFilter, userFilter]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Get unique users from events for the user filter dropdown
  const uniqueUsers = Array.from(
    new Set(events.map((e) => e.user_email)),
  ).sort();

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1A202C]">Audit Logs</h1>
          <p className="text-sm text-[#64748B] mt-1">
            Track all system activities and user actions
          </p>
        </div>
        <button className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-[#E2E8F0] text-sm font-medium text-[#1A202C] hover:bg-[#F4F6F9] transition-colors">
          <Download className="size-4" />
          Export CSV
        </button>
      </div>

      {/* Filter bar — connected to API query params */}
      <Card className="border border-[#E2E8F0]">
        <CardContent className="p-4 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-[#64748B]">
            <Filter className="size-4" />
            <span>Filters:</span>
          </div>
          <select
            value={eventTypeFilter}
            onChange={(e) => setEventTypeFilter(e.target.value)}
            className="h-9 px-3 rounded-lg border border-[#E2E8F0] bg-white text-sm text-[#1A202C] focus:outline-none focus:ring-2 focus:ring-[#0078D4]/20"
          >
            <option value="">All Event Types</option>
            <option value="login">Login</option>
            <option value="upload">Upload</option>
            <option value="export">Export</option>
            <option value="user_created">User Created</option>
            <option value="permission_change">Permission Change</option>
            <option value="chat">Chat Query</option>
          </select>
          <select
            value={userFilter}
            onChange={(e) => setUserFilter(e.target.value)}
            className="h-9 px-3 rounded-lg border border-[#E2E8F0] bg-white text-sm text-[#1A202C] focus:outline-none focus:ring-2 focus:ring-[#0078D4]/20"
          >
            <option value="">All Users</option>
            {uniqueUsers.map((email) => (
              <option key={email} value={email}>
                {email}
              </option>
            ))}
          </select>
          <input
            type="date"
            className="h-9 px-3 rounded-lg border border-[#E2E8F0] bg-white text-sm text-[#1A202C] focus:outline-none focus:ring-2 focus:ring-[#0078D4]/20"
          />
        </CardContent>
      </Card>

      {/* Audit events table — data from /api/v1/admin/audit/events */}
      <Card className="border border-[#E2E8F0]">
        <CardHeader className="border-b border-[#E2E8F0] pb-4">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="size-4 text-[#0078D4]" />
            Activity Log
            <span className="text-xs font-normal text-[#64748B] ml-1">
              Showing 1-{events.length} of {total} events
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="size-6 text-[#0078D4] animate-spin" />
              <span className="ml-2 text-sm text-[#64748B]">
                Loading audit events...
              </span>
            </div>
          ) : events.length === 0 ? (
            <div className="p-8 text-center text-[#64748B]">
              <Shield className="size-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm font-medium">No events found</p>
              <p className="text-xs mt-1">
                Try adjusting your filters to see more events
              </p>
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
                  const iconInfo =
                    EVENT_ICON_MAP[event.type] || EVENT_ICON_MAP.login;
                  const EventIcon = iconInfo.icon;

                  return (
                    <tr
                      key={event.id}
                      className="border-b border-[#E2E8F0] last:border-0 hover:bg-[#F8FAFC] transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className={`p-1.5 rounded-lg ${iconInfo.bg}`}>
                            <EventIcon
                              className={`size-3.5 ${iconInfo.color}`}
                            />
                          </div>
                          <span className="text-sm font-medium text-[#1A202C]">
                            {iconInfo.label}
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
