import { Card, CardContent } from '@/components/ui/card';
import { useFetchUserInfo } from '@/hooks/use-user-setting-request';
import { getEffectiveRole, isSuperAdmin } from '@/utils/rbac-util';
import { ArrowRight, Crown, FolderKanban, Shield, User, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

function BannerCard() {
  return (
    <Card className="w-auto border-none h-3/4">
      <CardContent className="p-4">
        <span className="inline-block bg-backgroundCoreWeak rounded-sm px-1 text-xs">
          System
        </span>
        <div className="flex mt-1 gap-4">
          <span className="text-lg truncate">Setting up your LLM</span>
          <ArrowRight />
        </div>
      </CardContent>
    </Card>
  );
}

export function Banner() {
  return (
    <section className="bg-[url('@/assets/banner.png')] bg-cover h-28 rounded-2xl  my-8 flex gap-8 justify-between">
      <div className="h-full text-3xl font-bold items-center inline-flex ml-6">
        Welcome to RAGFlow
      </div>
      <div className="flex justify-between items-center gap-4 mr-5">
        <BannerCard></BannerCard>
        <BannerCard></BannerCard>
        <BannerCard></BannerCard>
        <button
          type="button"
          className="relative p-1 hover:bg-white/10 rounded-full transition-colors"
        >
          <X className="w-6 h-6 text-white" />
        </button>
      </div>
    </section>
  );
}

export function NextBanner() {
  const { t } = useTranslation();
  const { data: userInfo } = useFetchUserInfo();
  const isAdmin = isSuperAdmin(userInfo);
  const effectiveRole = getEffectiveRole(userInfo);
  const projectCount = userInfo?.project_roles?.length || 0;

  const getRoleInfo = () => {
    switch (effectiveRole) {
      case 'super_admin':
        return { icon: Crown, label: 'Super Admin', color: 'from-amber-400 to-orange-500' };
      case 'project_admin':
        return { icon: Shield, label: 'Project Admin', color: 'from-blue-400 to-indigo-500' };
      case 'member':
        return { icon: User, label: 'Member', color: 'from-emerald-400 to-teal-500' };
      default:
        return null;
    }
  };

  const roleInfo = getRoleInfo();

  return (
    <section className="pt-10 pb-14 px-10">
      <div className="text-5xl font-bold">
        <span className="text-text-primary">{t('header.welcome')}</span>
        <span className="pl-3 text-transparent bg-clip-text bg-gradient-to-l from-[#40EBE3] to-[#4A51FF]">
          RAGFlow
        </span>
      </div>
      {/* RBAC Quick Status Bar */}
      {roleInfo && (
        <div className="mt-4 flex items-center gap-4">
          <div
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-white bg-gradient-to-r ${roleInfo.color}`}
          >
            <roleInfo.icon className="size-3.5" />
            {roleInfo.label}
          </div>
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <FolderKanban className="size-4" />
            <span>
              {isAdmin
                ? 'Full access to all projects'
                : `${projectCount} project${projectCount !== 1 ? 's' : ''} assigned`}
            </span>
          </div>
        </div>
      )}
    </section>
  );
}
