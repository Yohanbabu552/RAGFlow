/**
 * Admin Users — Full User Management page matching EMAMI reference.
 *
 * Super-admin only. Features:
 * - Stats grid (Total, Active, Super Admins, Deactivated)
 * - Filter bar (search + role + status dropdowns)
 * - User table with avatar, role badges, project assignments, actions
 * - Add User modal with form fields
 */

import { useFetchUserInfo } from '@/hooks/use-user-setting-request';
import { isSuperAdmin } from '@/utils/rbac-util';
import {
  Edit2,
  Eye,
  Pause,
  Play,
  Search,
  Shield,
  UserCheck,
  UserPlus,
  Users,
  UserX,
  X,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { Navigate } from 'react-router';

// ── Mock user data ──────────────────────────────────────────
interface MockUser {
  initials: string;
  name: string;
  email: string;
  role: 'super-admin' | 'project-admin' | 'standard';
  roleLabel: string;
  projects: string;
  status: 'active' | 'deactivated';
  lastActive: string;
  avatarGradient: string;
}

const USERS_DATA: MockUser[] = [
  { initials: 'RK', name: 'Rajesh Kumar', email: 'rajesh.kumar@emami.com', role: 'super-admin', roleLabel: 'Super Admin', projects: 'All Projects', status: 'active', lastActive: '2 min ago', avatarGradient: 'from-[#0078D4] to-[#00B4D8]' },
  { initials: 'PM', name: 'Priya Mehta', email: 'priya.mehta@emami.com', role: 'project-admin', roleLabel: 'Project Admin', projects: 'Rice Products, Personal Care', status: 'active', lastActive: '15 min ago', avatarGradient: 'from-[#7C3AED] to-[#A855F7]' },
  { initials: 'RS', name: 'Rahul Sharma', email: 'rahul.sharma@emami.com', role: 'standard', roleLabel: 'Standard User', projects: 'Rice Products', status: 'active', lastActive: '1 hour ago', avatarGradient: 'from-[#059669] to-[#34D399]' },
  { initials: 'AK', name: 'Amit Kapoor', email: 'amit.kapoor@emami.com', role: 'project-admin', roleLabel: 'Project Admin', projects: 'Healthcare', status: 'active', lastActive: '3 hours ago', avatarGradient: 'from-[#DC2626] to-[#F87171]' },
  { initials: 'SG', name: 'Sneha Gupta', email: 'sneha.gupta@emami.com', role: 'standard', roleLabel: 'Standard User', projects: 'Personal Care', status: 'deactivated', lastActive: '2 weeks ago', avatarGradient: 'from-[#D97706] to-[#FBBF24]' },
  { initials: 'VN', name: 'Vikram Nair', email: 'vikram.nair@emami.com', role: 'standard', roleLabel: 'Standard User', projects: 'Rice Products, Healthcare', status: 'active', lastActive: '30 min ago', avatarGradient: 'from-[#0891B2] to-[#22D3EE]' },
];

const ROLE_BADGE_STYLES: Record<string, string> = {
  'super-admin': 'bg-[#FEF3C7] text-[#92400E]',
  'project-admin': 'bg-[#EBF5FF] text-[#1D4ED8]',
  standard: 'bg-[#F1F5F9] text-[#475569]',
};

const ROLE_ICONS: Record<string, string> = {
  'super-admin': '⭐',
  'project-admin': '🔧',
  standard: '👤',
};

export default function AdminUsersPage() {
  const { data: userInfo } = useFetchUserInfo();
  const [showModal, setShowModal] = useState(false);
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Only super admins can access this page
  if (userInfo && !isSuperAdmin(userInfo)) {
    return <Navigate to="/" replace />;
  }

  const filtered = useMemo(() => {
    return USERS_DATA.filter((u) => {
      if (roleFilter !== 'all' && u.role !== roleFilter) return false;
      if (statusFilter !== 'all' && u.status !== statusFilter) return false;
      if (
        searchQuery &&
        !u.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !u.email.toLowerCase().includes(searchQuery.toLowerCase())
      )
        return false;
      return true;
    });
  }, [roleFilter, statusFilter, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1A202C]">
            User Management
          </h1>
          <p className="text-sm text-[#64748B] mt-1">
            Manage users, roles, and access permissions
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#0078D4] text-white text-sm font-semibold hover:bg-[#0078D4]/90 transition-colors"
        >
          <UserPlus className="size-4" />
          Add User
        </button>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Users', value: '24', icon: Users, color: 'text-[#0078D4]', bg: 'bg-[#0078D4]/10' },
          { label: 'Active Users', value: '18', icon: UserCheck, color: 'text-[#28A745]', bg: 'bg-[#28A745]/10' },
          { label: 'Super Admins', value: '2', icon: Shield, color: 'text-[#F59E0B]', bg: 'bg-[#F59E0B]/10' },
          { label: 'Deactivated', value: '6', icon: UserX, color: 'text-[#DC3545]', bg: 'bg-[#DC3545]/10' },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl border border-[#E2E8F0] p-4 flex items-center gap-4">
            <div className={`p-3 rounded-xl ${stat.bg}`}>
              <stat.icon className={`size-5 ${stat.color}`} />
            </div>
            <div>
              <p className="text-2xl font-bold text-[#1A202C]">{stat.value}</p>
              <p className="text-xs text-[#64748B]">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Users table card */}
      <div className="bg-white rounded-xl border border-[#E2E8F0]">
        {/* Card header with filters */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-[#E2E8F0]">
          <h3 className="text-sm font-semibold text-[#1A202C]">All Users</h3>
          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-[#94A3B8]" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9 w-52 rounded-lg border border-[#E2E8F0] bg-white pl-9 pr-3 text-sm text-[#1A202C] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#0078D4]/20 focus:border-[#0078D4]"
              />
            </div>
            {/* Role filter */}
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="h-9 px-3 rounded-lg border border-[#E2E8F0] bg-white text-sm text-[#1A202C] focus:outline-none focus:ring-2 focus:ring-[#0078D4]/20"
            >
              <option value="all">All Roles</option>
              <option value="super-admin">Super Admin</option>
              <option value="project-admin">Project Admin</option>
              <option value="standard">Standard User</option>
            </select>
            {/* Status filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-9 px-3 rounded-lg border border-[#E2E8F0] bg-white text-sm text-[#1A202C] focus:outline-none focus:ring-2 focus:ring-[#0078D4]/20"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="deactivated">Deactivated</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC]">
                <th className="text-left px-5 py-3 text-xs font-medium text-[#64748B] uppercase tracking-wide">User</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-[#64748B] uppercase tracking-wide">Role</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-[#64748B] uppercase tracking-wide">Projects</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-[#64748B] uppercase tracking-wide">Status</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-[#64748B] uppercase tracking-wide">Last Active</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-[#64748B] uppercase tracking-wide w-[100px]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((user, i) => (
                <tr key={i} className="border-b border-[#F1F5F9] last:border-0 hover:bg-[#F8FAFC] transition-colors">
                  {/* User info */}
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-[34px] h-[34px] rounded-full bg-gradient-to-br ${user.avatarGradient} flex items-center justify-center text-white text-xs font-semibold shrink-0`}>
                        {user.initials}
                      </div>
                      <div>
                        <div className="text-[13px] font-semibold text-[#1A202C]">{user.name}</div>
                        <div className="text-xs text-[#94A3B8]">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  {/* Role badge */}
                  <td className="px-5 py-3">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold ${ROLE_BADGE_STYLES[user.role]}`}>
                      {ROLE_ICONS[user.role]} {user.roleLabel}
                    </span>
                  </td>
                  {/* Projects */}
                  <td className="px-5 py-3 text-sm text-[#1A202C]">{user.projects}</td>
                  {/* Status */}
                  <td className="px-5 py-3">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-medium ${
                      user.status === 'active'
                        ? 'bg-[#E6F9ED] text-[#28A745] border border-[#A7F3D0]'
                        : 'bg-[#FEF2F2] text-[#DC3545] border border-[#FECACA]'
                    }`}>
                      {user.status === 'active' ? 'Active' : 'Deactivated'}
                    </span>
                  </td>
                  {/* Last Active */}
                  <td className="px-5 py-3 text-xs text-[#64748B]">{user.lastActive}</td>
                  {/* Actions */}
                  <td className="px-5 py-3">
                    <div className="flex gap-1.5">
                      <button className="w-[30px] h-[30px] rounded-md border border-[#E2E8F0] bg-white flex items-center justify-center text-[#64748B] hover:bg-[#F1F5F9] transition-colors" title="Edit">
                        <Edit2 className="size-3.5" />
                      </button>
                      {user.status === 'active' ? (
                        <>
                          <button className="w-[30px] h-[30px] rounded-md border border-[#E2E8F0] bg-white flex items-center justify-center text-[#64748B] hover:bg-[#F1F5F9] transition-colors" title="View">
                            <Eye className="size-3.5" />
                          </button>
                          {user.role !== 'super-admin' && (
                            <button className="w-[30px] h-[30px] rounded-md border border-[#E2E8F0] bg-white flex items-center justify-center text-[#64748B] hover:bg-[#FEF2F2] hover:border-[#FECACA] hover:text-[#DC3545] transition-colors" title="Deactivate">
                              <Pause className="size-3.5" />
                            </button>
                          )}
                        </>
                      ) : (
                        <button className="w-[30px] h-[30px] rounded-md border border-[#E2E8F0] bg-white flex items-center justify-center text-[#28A745] hover:bg-[#E6F9ED] transition-colors" title="Reactivate">
                          <Play className="size-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-[#E2E8F0]">
          <span className="text-xs text-[#64748B]">
            Showing 1&ndash;{filtered.length} of 24 users
          </span>
          <div className="flex gap-1.5">
            <button className="h-8 px-3 rounded-md border border-[#E2E8F0] bg-white text-xs text-[#64748B] hover:bg-[#F1F5F9] transition-colors disabled:opacity-50" disabled>
              &larr; Prev
            </button>
            <button className="h-8 w-8 rounded-md bg-[#0078D4] text-white text-xs font-semibold">1</button>
            <button className="h-8 w-8 rounded-md border border-[#E2E8F0] bg-white text-xs text-[#1A202C] hover:bg-[#F1F5F9]">2</button>
            <button className="h-8 w-8 rounded-md border border-[#E2E8F0] bg-white text-xs text-[#1A202C] hover:bg-[#F1F5F9]">3</button>
            <button className="h-8 w-8 rounded-md border border-[#E2E8F0] bg-white text-xs text-[#1A202C] hover:bg-[#F1F5F9]">4</button>
            <button className="h-8 px-3 rounded-md border border-[#E2E8F0] bg-white text-xs text-[#64748B] hover:bg-[#F1F5F9] transition-colors">
              Next &rarr;
            </button>
          </div>
        </div>
      </div>

      {/* ── Add User Modal ──────────────────────────── */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => setShowModal(false)}
        >
          <div
            className="w-full max-w-[520px] bg-white rounded-xl shadow-xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#E2E8F0]">
              <h3 className="text-base font-semibold text-[#1A202C]">
                Add New User
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 rounded-md text-[#64748B] hover:bg-[#F1F5F9] transition-colors"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Modal body */}
            <div className="px-6 py-5 space-y-4">
              {/* Name row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[13px] font-semibold text-[#1A202C] mb-2">
                    First Name
                  </label>
                  <input
                    type="text"
                    placeholder="Enter first name"
                    className="w-full h-10 px-3 rounded-lg border border-[#E2E8F0] text-sm text-[#1A202C] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#0078D4]/20 focus:border-[#0078D4]"
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-semibold text-[#1A202C] mb-2">
                    Last Name
                  </label>
                  <input
                    type="text"
                    placeholder="Enter last name"
                    className="w-full h-10 px-3 rounded-lg border border-[#E2E8F0] text-sm text-[#1A202C] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#0078D4]/20 focus:border-[#0078D4]"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-[13px] font-semibold text-[#1A202C] mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  placeholder="user@emami.com"
                  className="w-full h-10 px-3 rounded-lg border border-[#E2E8F0] text-sm text-[#1A202C] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#0078D4]/20 focus:border-[#0078D4]"
                />
              </div>

              {/* Role + Project row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[13px] font-semibold text-[#1A202C] mb-2">
                    Role
                  </label>
                  <select className="w-full h-10 px-3 rounded-lg border border-[#E2E8F0] text-sm text-[#1A202C] focus:outline-none focus:ring-2 focus:ring-[#0078D4]/20 focus:border-[#0078D4]" defaultValue="standard">
                    <option value="">Select role...</option>
                    <option value="super-admin">Super Admin</option>
                    <option value="project-admin">Project Admin</option>
                    <option value="standard">Standard User</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[13px] font-semibold text-[#1A202C] mb-2">
                    Assign to Project
                  </label>
                  <select className="w-full h-10 px-3 rounded-lg border border-[#E2E8F0] text-sm text-[#1A202C] focus:outline-none focus:ring-2 focus:ring-[#0078D4]/20 focus:border-[#0078D4]">
                    <option value="">Select project...</option>
                    <option>Rice Products</option>
                    <option>Personal Care</option>
                    <option>Healthcare</option>
                  </select>
                </div>
              </div>

              {/* Temporary password */}
              <div>
                <label className="block text-[13px] font-semibold text-[#1A202C] mb-2">
                  Temporary Password
                </label>
                <input
                  type="text"
                  defaultValue="Temp@2026!xK9m"
                  className="w-full h-10 px-3 rounded-lg border border-[#E2E8F0] text-sm text-[#1A202C] font-mono focus:outline-none focus:ring-2 focus:ring-[#0078D4]/20 focus:border-[#0078D4]"
                />
                <p className="text-[11px] text-[#94A3B8] mt-1">
                  User will be prompted to change password on first login
                </p>
              </div>
            </div>

            {/* Modal footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#E2E8F0] bg-[#F8FAFC]">
              <button
                onClick={() => setShowModal(false)}
                className="h-10 px-4 rounded-lg border border-[#E2E8F0] bg-white text-sm font-medium text-[#1A202C] hover:bg-[#F1F5F9] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => setShowModal(false)}
                className="h-10 px-4 rounded-lg bg-[#0078D4] text-white text-sm font-semibold hover:bg-[#0078D4]/90 transition-colors"
              >
                Create User
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
