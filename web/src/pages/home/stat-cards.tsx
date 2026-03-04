/**
 * StatCards — 4 summary stat cards for the dashboard.
 * Connected to:
 * - /v1/project/list (project count)
 * - /api/v1/admin/stats (documents, OCR, chat queries)
 */

import { getAdminStats } from '@/services/admin-service';
import projectService from '@/services/project-service';
import {
  FolderPlus,
  MessageSquare,
  Search,
  Upload,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

interface Stat {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string; size?: number }>;
  colorClass: string;
  bgClass: string;
}

export function StatCards() {
  const [projectCount, setProjectCount] = useState(0);
  const [docsUploaded, setDocsUploaded] = useState(0);
  const [ocrProcessed, setOcrProcessed] = useState(0);
  const [chatQueries, setChatQueries] = useState(0);

  const fetchData = useCallback(async () => {
    try {
      // Fetch project count (available to all roles)
      const projRes = await projectService.listProjects();
      const projData = projRes?.data;
      if (projData?.code === 0) {
        setProjectCount(projData.data?.length || 0);
      }

      // Only call admin stats for super_admin role — other roles don't have access
      const role = localStorage.getItem('selectedRole');
      if (role === 'super_admin') {
        const statsRes = await getAdminStats();
        const statsData = statsRes?.data;
        if (statsData?.code === 0 && statsData.data) {
          setDocsUploaded(statsData.data.total_documents || 0);
          setOcrProcessed(statsData.data.documents_processed || 0);
          setChatQueries(statsData.data.total_queries || 0);
        }
      }
    } catch {
      // Silent fail
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const stats: Stat[] = [
    {
      label: 'Active Projects',
      value: String(projectCount),
      icon: FolderPlus,
      colorClass: 'text-[#0078D4]',
      bgClass: 'bg-[#0078D4]/10',
    },
    {
      label: 'Documents Uploaded',
      value: String(docsUploaded),
      icon: Upload,
      colorClass: 'text-[#28A745]',
      bgClass: 'bg-[#28A745]/10',
    },
    {
      label: 'OCR Processed',
      value: String(ocrProcessed),
      icon: Search,
      colorClass: 'text-[#6F42C1]',
      bgClass: 'bg-[#6F42C1]/10',
    },
    {
      label: 'Chat Queries Today',
      value: String(chatQueries),
      icon: MessageSquare,
      colorClass: 'text-[#F59E0B]',
      bgClass: 'bg-[#F59E0B]/10',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-7">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <div
            key={stat.label}
            className="bg-white rounded-xl border border-[#E2E8F0] p-5 flex items-center gap-4"
          >
            <div className={`p-3 rounded-xl ${stat.bgClass}`}>
              <Icon className={`size-5 ${stat.colorClass}`} />
            </div>
            <div>
              <div className="text-2xl font-bold text-[#1A202C]">
                {stat.value}
              </div>
              <div className="text-xs text-[#64748B]">{stat.label}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
