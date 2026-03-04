export interface IUserInfo {
  access_token: string;
  avatar?: any;
  color_schema: string;
  create_date: string;
  create_time: number;
  email: string;
  id: string;
  is_active: string;
  is_anonymous: string;
  is_authenticated: string;
  is_superuser: boolean;
  language: string;
  last_login_time: string;
  login_channel: string;
  nickname: string;
  password: string;
  status: string;
  timezone: string;
  update_date: string;
  update_time: number;
  project_roles?: IUserProjectRole[];
}

// ============================================================
// RBAC Types (Emami Document Intelligence)
// ============================================================

export type ProjectRoleType = 'admin' | 'member';
export type EffectiveRole = 'super_admin' | 'project_admin' | 'member' | null;

export interface IProject {
  id: string;
  tenant_id: string;
  name: string;
  description: string;
  created_by: string;
  status: string;
  create_time: number;
  update_time: number;
  user_count?: number;
}

export interface IUserProjectRole {
  project_id: string;
  role: ProjectRoleType;
  project_name: string;
  tenant_id: string;
}

export interface IProjectUser {
  id: string;
  user_id: string;
  project_id: string;
  role: ProjectRoleType;
  assigned_by: string;
  email: string;
  nickname: string;
  avatar?: string;
  is_superuser: boolean;
  is_active: string;
  create_time: number;
  update_time: number;
}

export type TaskExecutorElapsed = Record<string, number[]>;

export interface TaskExecutorHeartbeatItem {
  boot_at: string;
  current: null;
  done: number;
  failed: number;
  lag: number;
  name: string;
  now: string;
  pending: number;
}

export interface ISystemStatus {
  es: Es;
  storage: Storage;
  database: Database;
  redis: Redis;
  task_executor_heartbeat: Record<string, TaskExecutorHeartbeatItem[]>;
}

interface Redis {
  status: string;
  elapsed: number;
  error: string;
  pending: number;
}

export interface Storage {
  status: string;
  elapsed: number;
  error: string;
}

export interface Database {
  status: string;
  elapsed: number;
  error: string;
}

interface Es {
  status: string;
  elapsed: number;
  error: string;
  number_of_nodes: number;
  active_shards: number;
}

export interface ITenantUser {
  id: string;
  avatar: string;
  delta_seconds: number;
  email: string;
  is_active: string;
  is_anonymous: string;
  is_authenticated: string;
  is_superuser: boolean;
  nickname: string;
  role: string;
  status: string;
  update_date: string;
  user_id: string;
}

export interface ITenant {
  avatar: string;
  delta_seconds: number;
  email: string;
  nickname: string;
  role: string;
  tenant_id: string;
  update_date: string;
}
