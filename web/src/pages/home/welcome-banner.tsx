/**
 * WelcomeBanner — Gradient hero banner with greeting and CTAs.
 * Connected to:
 * - /v1/user/info (user name)
 * - /api/v1/admin/stats (document counts for summary text)
 */

import { useFetchUserInfo } from '@/hooks/use-user-setting-request';
import { Routes } from '@/routes';
import { getAdminStats } from '@/services/admin-service';
import { MessageSquare, Upload } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router';

export function WelcomeBanner() {
  const { data: userInfo } = useFetchUserInfo();
  const navigate = useNavigate();
  const nickname = userInfo?.nickname || 'User';

  const [docsProcessed, setDocsProcessed] = useState(0);
  const [docsPending, setDocsPending] = useState(0);

  const fetchStats = useCallback(async () => {
    try {
      const res = await getAdminStats();
      const data = res?.data;
      if (data?.code === 0 && data.data) {
        setDocsProcessed(data.data.documents_processed || 0);
        setDocsPending(data.data.documents_processing || 0);
      }
    } catch {
      // Silent fail
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Simple time-based greeting
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[#1F3864] to-[#0078D4] p-7 text-white mb-7">
      {/* Decorative circle */}
      <div className="absolute -right-10 -top-10 h-[200px] w-[200px] rounded-full bg-white/[0.05] pointer-events-none" />

      <h2 className="text-[22px] font-bold mb-1.5">
        {greeting}, {nickname}
      </h2>
      <p className="text-sm text-white/80">
        You have {docsProcessed} documents processed and {docsPending} pending
        reviews today.
      </p>

      <div className="flex gap-3 mt-4">
        <button
          onClick={() => navigate(Routes.Datasets)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white text-[#1F3864] text-sm font-semibold hover:bg-white/90 transition-colors"
        >
          <Upload className="size-3.5" />
          Upload Documents
        </button>
        <button
          onClick={() => navigate(Routes.Chats)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white/15 text-white border border-white/25 text-sm font-semibold backdrop-blur-[10px] hover:bg-white/25 transition-colors"
        >
          <MessageSquare className="size-3.5" />
          Start AI Chat
        </button>
      </div>
    </div>
  );
}
