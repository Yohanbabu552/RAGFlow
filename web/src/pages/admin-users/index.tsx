/**
 * Admin Users — Full User Management page connected to backend API.
 *
 * Super-admin only. Features:
 * - Stats grid (Total, Active, Super Admins, Deactivated) — from /api/v1/admin/stats
 * - Filter bar (search + role + status dropdowns)
 * - User table fetched from /api/v1/admin/users (listUsers)
 * - Add User modal calls createUser()
 * - Deactivate/Reactivate calls updateUserStatus()
 */

import { useFetchUserInfo } from '@/hooks/use-user-setting-request';
import {
  createUser,
  getAdminStats,
  listUsers,
  updateUserStatus,
} from '@/services/admin-service';
import { isSuperAdmin } from '@/utils/rbac-util';
import {
  Edit2,
  Eye,
  Loader2,
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
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Navigate } from 'react-router';

// ── Role badge styling ──────────────────────────────────────
const ROLE_BADGE_STYLES: Record<string, string> = {
  'super-admin': 'bg-[#FEF3C7] text-[#92400E]',
  'project-admin': 'bg-[#EBF5FF] text-[#1D4ED8]',
  standard: 'bg-[#F1F5F9] text-[#475569]',
};

const ROLE_LABELS: Record<string, string> = {
  'super-admin': 'Super Admin',
  'project-admin': 'Project Admin',
  standard: 'Standard User',
};

const ROLE_ICONS: Record<string, string> = {
  'super-admin': '\u2B50',
  'project-admin': '\uD83D\uDD27',
  standard: '\uD83D\uDC64',
};

const AVATAR_GRADIENTS = [
  'from-[#0078D4] to-[#00B4D8]',
  'from-[#7C3AED] to-[#A855F7]',
  'from-[#059669] to-[#34D399]',
  'from-[#DC2626] to-[#F87171]',
  'from-[#D97706] to-[#FBBF24]',
  'from-[#0891B2] to-[#22D3EE]',
];

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

interface AdminUser {
  user_id: string;
  email: string;
  nickname: string;
  is_superuser: boolean;
  is_active: string;
  status: string;
  avatar: string;
  create_date: string;
  update_date: string;
  last_login_time: string;
  role: string;
  project_count: number;
  projects: string[];
}

interface AdminStats {
  total_users: number;
  active_users: number;
  super_admins: number;
  deactivated_users: number;
}

export default function AdminUsersPage() {
  const { data: userInfo } = useFetchUserInfo();
  const [showModal, setShowModal] = useState(false);
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // ── API State ──
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [stats, setStats] = useState<AdminStats>({
    total_users: 0,
    active_users: 0,
    super_admins: 0,
    deactivated_users: 0,
  });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // ── Modal form state ──
  const [formFirstName, setFormFirstName] = useState('');
  const [formLastName, setFormLastName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formRole, setFormRole] = useState('standard');
  const [formPassword, setFormPassword] = useState('Temp@2026!xK9m');
  const [createLoading, setCreateLoading] = useState(false);

  // Only super admins can access this page
  if (userInfo && !isSuperAdmin(userInfo)) {
    return <Navigate to="/" replace />;
  }

  // ── Fetch users and stats from API ──
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [usersRes, statsRes] = await Promise.all([
        listUsers(),
        getAdminStats(),
      ]);

      const usersData = usersRes?.data;
      if (usersData?.code === 0 && Array.isArray(usersData.data)) {
        setUsers(usersData.data);
      }

      const statsData = statsRes?.data;
      if (statsData?.code === 0 && statsData.data) {
        setStats({
          total_users: statsData.data.total_users,
          active_users: statsData.data.active_users,
          super_admins: statsData.data.super_admins,
          deactivated_users: statsData.data.deactivated_users,
        });
      }
    } catch {
      // Error handled by admin-service interceptors
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ── Filtered users ──
  const filtered = useMemo(() => {
    return users.filter((u) => {
      if (roleFilter !== 'all' && u.role !== roleFilter) return false;
      const isActive = u.is_active === '1';
      if (statusFilter === 'active' && !isActive) return false;
      if (statusFilter === 'deactivated' && isActive) return false;
      if (
        searchQuery &&
        !u.nickname.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !u.email.toLowerCase().includes(searchQuery.toLowerCase())
      )
        return false;
      return true;
    });
  }, [users, roleFilter, statusFilter, searchQuery]);

  // ── Deactivate / Reactivate ──
  const handleToggleStatus = async (
    email: string,
    newStatus: 'on' | 'off',
  ) => {
    setActionLoading(email);
    try {
      const res = await updateUserStatus(email, newStatus);
      if (res?.data?.code === 0) {
        await fetchData(); // Refresh the list
      }
    } catch {
      // handled by interceptor
    } finally {
      setActionLoading(null);
    }
  };

  // ── Create User ──
  const handleCreateUser = async () => {
    if (!formEmail) return;
    setCreateLoading(true);
    try {
      const res = await createUser(formEmail, formPassword);
      if (res?.data?.code === 0) {
        setShowModal(false);
        setFormFirstName('');
        setFormLastName('');
        setFormEmail('');
        setFormRole('standard');
        setFormPassword('Temp@2026!xK9m');
        await fetchData();
      }
    } catch {
      // handled by interceptor
    } finally {
      setCreateLoading(false);
    }
  };

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

      {/* Stats grid — connected to /api/v1/admin/stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: 'Total Users',
            value: String(stats.total_users),
            icon: Users,
            color: 'text-[#0078D4]',
            bg: 'bg-[#0078D4]/10',
          },
          {
            label: 'Active Users',
            value: String(stats.active_users),
            icon: UserCheck,
            color: 'text-[#28A745]',
            bg: 'bg-[#28A745]/10',
          },
          {
            label: 'Super Admins',
            value: String(stats.super_admins),
            icon: Shield,
            color: 'text-[#F59E0B]',
            bg: 'bg-[#F59E0B]/10',
          },
          {
            label: 'Deactivated',
            value: String(stats.deactivated_users),
            icon: UserX,
            color: 'text-[#DC3545]',
            bg: 'bg-[#DC3545]/10',
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-white rounded-xl border border-[#E2E8F0] p-4 flex items-center gap-4"
          >
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
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="size-6 text-[#0078D4] animate-spin" />
            <span className="ml-2 text-sm text-[#64748B]">
              Loading users...
            </span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC]">
                  <th className="text-left px-5 py-3 text-xs font-medium text-[#64748B] uppercase tracking-wide">
                    User
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-[#64748B] uppercase tracking-wide">
                    Role
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-[#64748B] uppercase tracking-wide">
                    Projects
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-[#64748B] uppercase tracking-wide">
                    Status
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-[#64748B] uppercase tracking-wide">
                    Last Active
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-[#64748B] uppercase tracking-wide w-[100px]">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-5 py-10 text-center text-sm text-[#64748B]"
                    >
                      No users found matching your filters.
                    </td>
                  </tr>
                ) : (
                  filtered.map((user, i) => {
                    const initials = getInitials(user.nickname);
                    const gradient =
                      AVATAR_GRADIENTS[i % AVATAR_GRADIENTS.length];
                    const roleLabel =
                      ROLE_LABELS[user.role] || user.role;
                    const roleBadgeStyle =
                      ROLE_BADGE_STYLES[user.role] || ROLE_BADGE_STYLES.standard;
                    const roleIcon =
                      ROLE_ICONS[user.role] || ROLE_ICONS.standard;
                    const isActive = user.is_active === '1';
                    const isLoading = actionLoading === user.email;

                    return (
                      <tr
                        key={user.user_id}
                        className="border-b border-[#F1F5F9] last:border-0 hover:bg-[#F8FAFC] transition-colors"
                      >
                        {/* User info */}
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-[34px] h-[34px] rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center text-white text-xs font-semibold shrink-0`}
                            >
                              {initials}
                            </div>
                            <div>
                              <div className="text-[13px] font-semibold text-[#1A202C]">
                                {user.nickname}
                              </div>
                              <div className="text-xs text-[#94A3B8]">
                                {user.email}
                              </div>
                            </div>
                          </div>
                        </td>
                        {/* Role badge */}
                        <td className="px-5 py-3">
                          <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold ${roleBadgeStyle}`}
                          >
                            {roleIcon} {roleLabel}
                          </span>
                        </td>
                        {/* Projects */}
                        <td className="px-5 py-3 text-sm text-[#1A202C]">
                          {user.projects?.join(', ') || '-'}
                        </td>
                        {/* Status */}
                        <td className="px-5 py-3">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-medium ${
                              isActive
                                ? 'bg-[#E6F9ED] text-[#28A745] border border-[#A7F3D0]'
                                : 'bg-[#FEF2F2] text-[#DC3545] border border-[#FECACA]'
                            }`}
                          >
                            {isActive ? 'Active' : 'Deactivated'}
                          </span>
                        </td>
                        {/* Last Active */}
                        <td className="px-5 py-3 text-xs text-[#64748B]">
                          {user.last_login_time}
                        </td>
                        {/* Actions */}
                        <td className="px-5 py-3">
                          <div className="flex gap-1.5">
                            <button
                              className="w-[30px] h-[30px] rounded-md border border-[#E2E8F0] bg-white flex items-center justify-center text-[#64748B] hover:bg-[#F1F5F9] transition-colors"
                              title="Edit"
                            >
                              <Edit2 className="size-3.5" />
                            </button>
                            {isActive ? (
                              <>
                                <button
                                  className="w-[30px] h-[30px] rounded-md border border-[#E2E8F0] bg-white flex items-center justify-center text-[#64748B] hover:bg-[#F1F5F9] transition-colors"
                                  title="View"
                                >
                                  <Eye className="size-3.5" />
                                </button>
                                {user.role !== 'super-admin' && (
                                  <button
                                    onClick={() =>
                                      handleToggleStatus(user.email, 'off')
                                    }
                                    disabled={isLoading}
                                    className="w-[30px] h-[30px] rounded-md border border-[#E2E8F0] bg-white flex items-center justify-center text-[#64748B] hover:bg-[#FEF2F2] hover:border-[#FECACA] hover:text-[#DC3545] transition-colors disabled:opacity-50"
                                    title="Deactivate"
                                  >
                                    {isLoading ? (
                                      <Loader2 className="size-3.5 animate-spin" />
                                    ) : (
                                      <Pause className="size-3.5" />
                                    )}
                                  </button>
                                )}
                              </>
                            ) : (
                              <button
                                onClick={() =>
                                  handleToggleStatus(user.email, 'on')
                                }
                                disabled={isLoading}
                                className="w-[30px] h-[30px] rounded-md border border-[#E2E8F0] bg-white flex items-center justify-center text-[#28A745] hover:bg-[#E6F9ED] transition-colors disabled:opacity-50"
                                title="Reactivate"
                              >
                                {isLoading ? (
                                  <Loader2 className="size-3.5 animate-spin" />
                                ) : (
                                  <Play className="size-3.5" />
                                )}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-[#E2E8F0]">
          <span className="text-xs text-[#64748B]">
            Showing 1&ndash;{filtered.length} of {stats.total_users} users
          </span>
          <div className="flex gap-1.5">
            <button
              className="h-8 px-3 rounded-md border border-[#E2E8F0] bg-white text-xs text-[#64748B] hover:bg-[#F1F5F9] transition-colors disabled:opacity-50"
              disabled
            >
              &larr; Prev
            </button>
            <button className="h-8 w-8 rounded-md bg-[#0078D4] text-white text-xs font-semibold">
              1
            </button>
            <button className="h-8 px-3 rounded-md border border-[#E2E8F0] bg-white text-xs text-[#64748B] hover:bg-[#F1F5F9] transition-colors disabled:opacity-50" disabled>
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
                    value={formFirstName}
                    onChange={(e) => setFormFirstName(e.target.value)}
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
                    value={formLastName}
                    onChange={(e) => setFormLastName(e.target.value)}
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
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-[#E2E8F0] text-sm text-[#1A202C] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#0078D4]/20 focus:border-[#0078D4]"
                />
              </div>

              {/* Role + Project row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[13px] font-semibold text-[#1A202C] mb-2">
                    Role
                  </label>
                  <select
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg border border-[#E2E8F0] text-sm text-[#1A202C] focus:outline-none focus:ring-2 focus:ring-[#0078D4]/20 focus:border-[#0078D4]"
                  >
                    <option value="standard">Standard User</option>
                    <option value="project-admin">Project Admin</option>
                    <option value="super-admin">Super Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[13px] font-semibold text-[#1A202C] mb-2">
                    Assign to Project
                  </label>
                  <select className="w-full h-10 px-3 rounded-lg border border-[#E2E8F0] text-sm text-[#1A202C] focus:outline-none focus:ring-2 focus:ring-[#0078D4]/20 focus:border-[#0078D4]">
                    <option value="">Select project...</option>
                    <option>Emami Product Catalog</option>
                    <option>HR Policy Assistant</option>
                    <option>R&D Research Papers</option>
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
                  value={formPassword}
                  onChange={(e) => setFormPassword(e.target.value)}
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
                onClick={handleCreateUser}
                disabled={createLoading || !formEmail}
                className="h-10 px-4 rounded-lg bg-[#0078D4] text-white text-sm font-semibold hover:bg-[#0078D4]/90 transition-colors disabled:opacity-50 inline-flex items-center gap-2"
              >
                {createLoading && (
                  <Loader2 className="size-4 animate-spin" />
                )}
                Create User
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
