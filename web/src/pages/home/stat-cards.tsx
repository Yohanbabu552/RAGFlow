/**
 * StatCards — 4 summary stat cards for the dashboard.
 */

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

  const fetchProjectCount = useCallback(async () => {
    try {
      const res = await projectService.listProjects();
      const data = res?.data;
      if (data?.code === 0) {
        setProjectCount(data.data?.length || 0);
      }
    } catch {
      // Silent fail
    }
  }, []);

  useEffect(() => {
    fetchProjectCount();
  }, [fetchProjectCount]);

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
      value: '1,247',
      icon: Upload,
      colorClass: 'text-[#28A745]',
      bgClass: 'bg-[#28A745]/10',
    },
    {
      label: 'OCR Processed',
      value: '1,198',
      icon: Search,
      colorClass: 'text-[#6F42C1]',
      bgClass: 'bg-[#6F42C1]/10',
    },
    {
      label: 'Chat Queries Today',
      value: '342',
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
