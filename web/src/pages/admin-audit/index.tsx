/**
 * Admin Audit — Audit logs page (placeholder).
 *
 * Super-admin only. Full implementation in Phase 5.
 * Will include: event filters, searchable audit trail table, CSV export.
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useFetchUserInfo } from '@/hooks/use-user-setting-request';
import { isSuperAdmin } from '@/utils/rbac-util';
import {
  Clock,
  Download,
  FileText,
  Filter,
  LogIn,
  Shield,
  Upload,
  UserPlus,
} from 'lucide-react';
import { Navigate } from 'react-router';

const MOCK_AUDIT_EVENTS = [
  {
    id: 1,
    type: 'Login',
    icon: LogIn,
    color: 'text-[#0078D4]',
    bg: 'bg-[#0078D4]/10',
    user: 'admin@emami.com',
    details: 'Successful login from 192.168.1.100',
    project: '-',
    time: '2 minutes ago',
  },
  {
    id: 2,
    type: 'Upload',
    icon: Upload,
    color: 'text-[#28A745]',
    bg: 'bg-[#28A745]/10',
    user: 'rahul@emami.com',
    details: 'Uploaded product_specs_2025.pdf',
    project: 'Emami Product Catalog',
    time: '15 minutes ago',
  },
  {
    id: 3,
    type: 'User Created',
    icon: UserPlus,
    color: 'text-[#F59E0B]',
    bg: 'bg-[#F59E0B]/10',
    user: 'admin@emami.com',
    details: 'Created user amit@emami.com with role Member',
    project: 'HR Policy Assistant',
    time: '1 hour ago',
  },
  {
    id: 4,
    type: 'Export',
    icon: Download,
    color: 'text-[#6F42C1]',
    bg: 'bg-[#6F42C1]/10',
    user: 'priya@emami.com',
    details: 'Exported 12 documents as PDF',
    project: 'Emami Product Catalog',
    time: '3 hours ago',
  },
];

export default function AdminAuditPage() {
  const { data: userInfo } = useFetchUserInfo();

  // Only super admins can access
  if (userInfo && !isSuperAdmin(userInfo)) {
    return <Navigate to="/" replace />;
  }

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

      {/* Filter bar */}
      <Card className="border border-[#E2E8F0]">
        <CardContent className="p-4 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-[#64748B]">
            <Filter className="size-4" />
            <span>Filters:</span>
          </div>
          <select className="h-9 px-3 rounded-lg border border-[#E2E8F0] bg-white text-sm text-[#1A202C] focus:outline-none focus:ring-2 focus:ring-[#0078D4]/20">
            <option>All Event Types</option>
            <option>Login</option>
            <option>Upload</option>
            <option>Export</option>
            <option>User Created</option>
            <option>Permission Change</option>
          </select>
          <select className="h-9 px-3 rounded-lg border border-[#E2E8F0] bg-white text-sm text-[#1A202C] focus:outline-none focus:ring-2 focus:ring-[#0078D4]/20">
            <option>All Users</option>
            <option>admin@emami.com</option>
            <option>rahul@emami.com</option>
            <option>priya@emami.com</option>
          </select>
          <input
            type="date"
            className="h-9 px-3 rounded-lg border border-[#E2E8F0] bg-white text-sm text-[#1A202C] focus:outline-none focus:ring-2 focus:ring-[#0078D4]/20"
          />
        </CardContent>
      </Card>

      {/* Audit events table */}
      <Card className="border border-[#E2E8F0]">
        <CardHeader className="border-b border-[#E2E8F0] pb-4">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="size-4 text-[#0078D4]" />
            Activity Log
            <span className="text-xs font-normal text-[#64748B] ml-1">
              Showing 1-4 of 4 events
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
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
              {MOCK_AUDIT_EVENTS.map((event) => (
                <tr
                  key={event.id}
                  className="border-b border-[#E2E8F0] last:border-0 hover:bg-[#F8FAFC] transition-colors"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded-lg ${event.bg}`}>
                        <event.icon className={`size-3.5 ${event.color}`} />
                      </div>
                      <span className="text-sm font-medium text-[#1A202C]">
                        {event.type}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-[#1A202C]">
                    {event.user}
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
                      {event.time}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
