import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  useFetchUserInfo,
  useListTenantUser,
} from '@/hooks/use-user-setting-request';
import { useTranslation } from 'react-i18next';

import Spotlight from '@/components/spotlight';
import { SearchInput } from '@/components/ui/input';
import { Routes } from '@/routes';
import { getEffectiveRole, isSuperAdmin } from '@/utils/rbac-util';
import {
  Crown,
  FolderKanban,
  Shield,
  User,
  UserPlus,
} from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  ProfileSettingWrapperCard,
  UserSettingHeader,
} from '../components/user-setting-header';
import AddingUserModal from './add-user-modal';
import { useAddUser } from './hooks';
import TenantTable from './tenant-table';
import UserTable from './user-table';

const UserSettingTeam = () => {
  const { data: userInfo } = useFetchUserInfo();
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchUser, setSearchUser] = useState('');
  const navigate = useNavigate();
  useListTenantUser();
  const {
    addingTenantModalVisible,
    hideAddingTenantModal,
    showAddingTenantModal,
    handleAddUserOk,
  } = useAddUser();

  const isAdmin = isSuperAdmin(userInfo);
  const effectiveRole = getEffectiveRole(userInfo);
  const projectRoles = userInfo?.project_roles || [];

  const getRoleIcon = (role: string) => {
    if (role === 'super_admin') return <Crown className="size-4 text-amber-500" />;
    if (role === 'admin') return <Shield className="size-4 text-blue-500" />;
    return <User className="size-4 text-muted-foreground" />;
  };

  const getRoleLabel = (role: string) => {
    if (role === 'super_admin') return 'Super Admin';
    if (role === 'admin') return 'Project Admin';
    return 'Member';
  };

  const getRoleBadgeStyle = (role: string) => {
    if (role === 'super_admin') return 'bg-gradient-to-r from-amber-500 to-orange-500 text-white';
    if (role === 'admin') return 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white';
    return 'bg-muted text-muted-foreground';
  };

  return (
    <ProfileSettingWrapperCard
      header={
        <UserSettingHeader
          name={userInfo?.nickname + ' ' + t('setting.workspace')}
        />
      }
    >
      <Spotlight />

      {/* RBAC Role Summary Card */}
      <Card className="bg-transparent border-none mb-4">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="size-4 text-primary" />
            My Role & Access
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-2">
          {/* Global role */}
          <div className="flex items-center gap-3 mb-4 p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2">
              {effectiveRole === 'super_admin' ? (
                <Crown className="size-5 text-amber-500" />
              ) : (
                <User className="size-5 text-muted-foreground" />
              )}
              <div>
                <p className="text-sm font-medium">
                  {effectiveRole === 'super_admin' ? 'Super Admin' : 'Standard User'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {effectiveRole === 'super_admin'
                    ? 'Full access to all projects and settings'
                    : 'Access limited to assigned projects'}
                </p>
              </div>
            </div>
          </div>

          {/* Project roles */}
          {projectRoles.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                Project Assignments ({projectRoles.length})
              </p>
              <div className="space-y-1.5">
                {projectRoles.map((pr) => (
                  <div
                    key={pr.project_id}
                    className="flex items-center justify-between py-2 px-3 rounded-md hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() =>
                      navigate(`${Routes.ProjectDetail}/${pr.project_id}`)
                    }
                  >
                    <div className="flex items-center gap-2">
                      <FolderKanban className="size-4 text-primary" />
                      <span className="text-sm">{pr.project_name}</span>
                    </div>
                    <span
                      className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full ${getRoleBadgeStyle(pr.role)}`}
                    >
                      {getRoleIcon(pr.role)}
                      {getRoleLabel(pr.role)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {projectRoles.length === 0 && !isAdmin && (
            <p className="text-sm text-muted-foreground text-center py-4">
              You haven't been assigned to any projects yet. Contact your admin
              for access.
            </p>
          )}

          {isAdmin && projectRoles.length === 0 && (
            <div className="text-center py-3">
              <p className="text-sm text-muted-foreground mb-2">
                As a Super Admin, you have access to all projects.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(Routes.Projects)}
              >
                <FolderKanban className="size-4 mr-1" />
                Manage Projects
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-transparent border-none">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 pb-4">
          <CardTitle className="text-base">
            {t('setting.teamMembers')}
          </CardTitle>
          <section className="flex gap-4 items-center">
            <SearchInput
              className="bg-bg-input border-border-default w-32"
              placeholder={t('common.search')}
              value={searchUser}
              onChange={(e) => setSearchUser(e.target.value)}
            />
            {(isAdmin || effectiveRole === 'project_admin') && (
              <Button onClick={showAddingTenantModal}>
                <UserPlus className=" h-4 w-4" />
                {t('setting.invite')}
              </Button>
            )}
          </section>
        </CardHeader>
        <CardContent className="p-4">
          <UserTable searchUser={searchUser}></UserTable>
        </CardContent>
      </Card>

      <Card className="bg-transparent border-none mt-8">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 pb-4">
          <CardTitle className="text-base w-fit">
            {t('setting.joinedTeams')}
          </CardTitle>
          <SearchInput
            className="bg-bg-input border-border-default w-32"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t('common.search')}
          />
        </CardHeader>
        <CardContent className="p-4">
          <TenantTable searchTerm={searchTerm}></TenantTable>
        </CardContent>
      </Card>

      {addingTenantModalVisible && (
        <AddingUserModal
          visible
          hideModal={hideAddingTenantModal}
          onOk={handleAddUserOk}
        ></AddingUserModal>
      )}
    </ProfileSettingWrapperCard>
  );
};

export default UserSettingTeam;
