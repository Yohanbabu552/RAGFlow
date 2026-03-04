import { IconFontFill } from '@/components/icon-font';
import { RAGFlowAvatar } from '@/components/ragflow-avatar';
import { useTheme } from '@/components/theme-provider';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Segmented, SegmentedValue } from '@/components/ui/segmented';
import { LanguageList, LanguageMap, ThemeEnum } from '@/constants/common';
import { useChangeLanguage } from '@/hooks/logic-hooks';
import { useNavigatePage } from '@/hooks/logic-hooks/navigate-hooks';
import { useNavigateWithFromState } from '@/hooks/route-hook';
import { useFetchUserInfo } from '@/hooks/use-user-setting-request';
import { Routes } from '@/routes';
import { getEffectiveRole, isSuperAdmin } from '@/utils/rbac-util';
import { camelCase } from 'lodash';
import {
  ChevronDown,
  CircleHelp,
  Cpu,
  Crown,
  File,
  FolderKanban,
  House,
  Library,
  LogOut,
  MessageSquareText,
  Moon,
  Search,
  Settings,
  Shield,
  Sun,
  User,
} from 'lucide-react';
import React, { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router';
import { BellButton } from './bell-button';

const handleDocHelpCLick = () => {
  window.open('https://ragflow.io/docs/dev/category/guides', 'target');
};

const PathMap = {
  [Routes.Datasets]: [Routes.Datasets],
  [Routes.Chats]: [Routes.Chats],
  [Routes.Searches]: [Routes.Searches],
  [Routes.Agents]: [Routes.Agents],
  [Routes.Memories]: [Routes.Memories, Routes.Memory, Routes.MemoryMessage],
  [Routes.Projects]: [Routes.Projects, Routes.ProjectDetail],
  [Routes.Files]: [Routes.Files],
} as const;

/** Role badge styling by role level */
function getRoleBadgeConfig(role: ReturnType<typeof getEffectiveRole>) {
  switch (role) {
    case 'super_admin':
      return {
        label: 'Super Admin',
        icon: Crown,
        className:
          'bg-gradient-to-r from-amber-500 to-orange-500 text-white',
      };
    case 'project_admin':
      return {
        label: 'Project Admin',
        icon: Shield,
        className:
          'bg-gradient-to-r from-blue-500 to-indigo-500 text-white',
      };
    case 'member':
      return {
        label: 'Member',
        icon: User,
        className: 'bg-muted text-muted-foreground',
      };
    default:
      return null;
  }
}

export function Header() {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const navigate = useNavigateWithFromState();
  const { navigateToOldProfile } = useNavigatePage();

  const changeLanguage = useChangeLanguage();
  const { setTheme, theme } = useTheme();

  const {
    data: userInfo,
  } = useFetchUserInfo();

  const { language = 'English', avatar, nickname } = userInfo || {};

  // Compute current user's role for RBAC gating
  const isAdmin = isSuperAdmin(userInfo);
  const effectiveRole = getEffectiveRole(userInfo);
  const roleBadge = getRoleBadgeConfig(effectiveRole);

  const handleItemClick = (key: string) => () => {
    changeLanguage(key);
  };

  const items = LanguageList.map((x) => ({
    key: x,
    label: <span>{LanguageMap[x as keyof typeof LanguageMap]}</span>,
  }));

  const onThemeClick = React.useCallback(() => {
    setTheme(theme === ThemeEnum.Dark ? ThemeEnum.Light : ThemeEnum.Dark);
  }, [setTheme, theme]);

  const tagsData = useMemo(() => {
    const allTabs = [
      { path: Routes.Root, name: t('header.Root'), icon: House, minRole: null },
      { path: Routes.Datasets, name: t('header.dataset'), icon: Library, minRole: null },
      { path: Routes.Chats, name: t('header.chat'), icon: MessageSquareText, minRole: null },
      { path: Routes.Searches, name: t('header.search'), icon: Search, minRole: null },
      { path: Routes.Agents, name: t('header.flow'), icon: Cpu, minRole: null },
      { path: Routes.Memories, name: t('header.memories'), icon: Cpu, minRole: null },
      { path: Routes.Projects, name: 'Projects', icon: FolderKanban, minRole: null },
      // File Manager is visible to admins only
      { path: Routes.Files, name: t('header.fileManager'), icon: File, minRole: 'project_admin' as const },
    ];

    // Filter tabs based on role
    return allTabs.filter((tab) => {
      if (!tab.minRole) return true;
      if (isAdmin) return true;
      if (tab.minRole === 'project_admin' && effectiveRole === 'project_admin') return true;
      return false;
    });
  }, [t, isAdmin, effectiveRole]);

  const options = useMemo(() => {
    return tagsData.map((tag) => {
      const HeaderIcon = tag.icon;

      return {
        label:
          tag.path === Routes.Root ? (
            <HeaderIcon className="size-6"></HeaderIcon>
          ) : (
            <span>{tag.name}</span>
          ),
        value: tag.path,
      };
    });
  }, [tagsData]);

  const handleChange = (path: SegmentedValue) => {
    navigate(path as Routes);
  };

  const handleLogoClick = useCallback(() => {
    navigate(Routes.Root);
  }, [navigate]);

  const activePathName = useMemo(() => {
    const name = Object.keys(PathMap).find((x: string) => {
      const pathList = PathMap[x as keyof typeof PathMap];
      return pathList.some((y: string) => pathname.indexOf(y) > -1);
    });
    if (name) {
      return name;
    } else {
      return pathname;
    }
  }, [pathname]);

  // Count projects the user has access to
  const projectCount = userInfo?.project_roles?.length || 0;

  return (
    <section className="py-5 px-10 flex justify-between items-center ">
      <div className="flex items-center gap-4">
        <img
          src={'/logo.svg'}
          alt="logo"
          className="size-10 mr-[12] cursor-pointer"
          onClick={handleLogoClick}
        />
      </div>
      <Segmented
        rounded="xxxl"
        sizeType="xl"
        buttonSize="xl"
        options={options}
        value={activePathName}
        onChange={handleChange}
        activeClassName="text-bg-base bg-metallic-gradient border-b-[#00BEB4] border-b-2"
      ></Segmented>
      <div className="flex items-center gap-5 text-text-badge">
        <a
          target="_blank"
          href="https://discord.com/invite/NjYzJD3GM3"
          rel="noreferrer"
        >
          <IconFontFill name="a-DiscordIconSVGVectorIcon"></IconFontFill>
        </a>
        <a
          target="_blank"
          href="https://github.com/infiniflow/ragflow"
          rel="noreferrer"
        >
          <IconFontFill name="GitHub"></IconFontFill>
        </a>
        <DropdownMenu>
          <DropdownMenuTrigger>
            <div className="flex items-center gap-1">
              {t(`common.${camelCase(language)}`)}
              <ChevronDown className="size-4" />
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {items.map((x) => (
              <DropdownMenuItem key={x.key} onClick={handleItemClick(x.key)}>
                {x.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <Button variant={'ghost'} onClick={handleDocHelpCLick}>
          <CircleHelp />
        </Button>
        <Button variant={'ghost'} onClick={onThemeClick}>
          {theme === 'light' ? <Sun /> : <Moon />}
        </Button>
        <BellButton></BellButton>

        {/* User avatar with role badge and dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div className="relative cursor-pointer flex items-center gap-2">
              <RAGFlowAvatar
                name={nickname}
                avatar={avatar}
                isPerson
                className="size-8"
              ></RAGFlowAvatar>
              {/* Role Badge */}
              {roleBadge && (
                <span
                  className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full ${roleBadge.className}`}
                >
                  <roleBadge.icon className="size-3" />
                  {roleBadge.label}
                </span>
              )}
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            {/* User info header */}
            <div className="px-3 py-2">
              <p className="text-sm font-medium">{nickname || 'User'}</p>
              <p className="text-xs text-muted-foreground">{userInfo?.email}</p>
              {roleBadge && (
                <div className="mt-1.5 flex items-center gap-1.5">
                  <roleBadge.icon className="size-3.5" />
                  <span className="text-xs font-medium">{roleBadge.label}</span>
                </div>
              )}
            </div>
            <DropdownMenuSeparator />

            {/* Project count */}
            <div className="px-3 py-1.5">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <FolderKanban className="size-3.5" />
                <span>
                  {isAdmin
                    ? 'Access to all projects'
                    : `${projectCount} project${projectCount !== 1 ? 's' : ''}`}
                </span>
              </div>
            </div>
            <DropdownMenuSeparator />

            {/* Actions */}
            <DropdownMenuItem onClick={navigateToOldProfile}>
              <Settings className="size-4 mr-2" />
              Profile Settings
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate(Routes.Projects)}>
              <FolderKanban className="size-4 mr-2" />
              My Projects
            </DropdownMenuItem>
            {isAdmin && (
              <DropdownMenuItem onClick={() => navigate(Routes.Admin)}>
                <Crown className="size-4 mr-2" />
                Admin Console
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => navigate(Routes.Login)}
              className="text-destructive"
            >
              <LogOut className="size-4 mr-2" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </section>
  );
}
