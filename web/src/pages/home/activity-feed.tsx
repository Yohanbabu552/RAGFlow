/**
 * ActivityFeed — Recent activity timeline with colored dots.
 * Connected to /api/v1/admin/audit/events (getAuditEvents).
 */

import { getAuditEvents } from '@/services/admin-service';
import { Loader2 } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

interface Activity {
  id: string;
  user: string;
  action: string;
  target: string;
  extra?: string;
  time: string;
  type: string;
}

const DOT_COLORS: Record<string, string> = {
  upload: 'bg-[#0078D4]',
  login: 'bg-[#28A745]',
  chat: 'bg-[#7C3AED]',
  user_created: 'bg-[#F57C00]',
  export: 'bg-[#6F42C1]',
  permission_change: 'bg-[#DC3545]',
};

function formatAuditToActivity(event: {
  id: string;
  type: string;
  user_name: string;
  details: string;
  project: string;
  time_ago: string;
}): Activity {
  let action = event.details;
  let target = event.project !== '-' ? event.project : '';

  // Make the activity text more readable
  if (event.type === 'upload') {
    action = 'uploaded files to';
    target = event.project;
  } else if (event.type === 'login') {
    action = 'logged in';
    target = '';
  } else if (event.type === 'chat') {
    action = 'started a chat session in';
    target = event.project;
  } else if (event.type === 'user_created') {
    action = event.details;
    target = '';
  } else if (event.type === 'export') {
    action = 'exported documents from';
    target = event.project;
  } else if (event.type === 'permission_change') {
    action = event.details;
    target = '';
  }

  return {
    id: event.id,
    user: event.user_name,
    action,
    target,
    time: event.time_ago,
    type: event.type,
  };
}

export function ActivityFeed() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchActivities = useCallback(async () => {
    try {
      const res = await getAuditEvents({ limit: 5 });
      const data = res?.data;
      if (data?.code === 0 && data.data?.events) {
        setActivities(data.data.events.map(formatAuditToActivity));
      }
    } catch {
      // Silent fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  return (
    <div className="bg-white rounded-xl border border-[#E2E8F0]">
      <div className="px-5 py-4 border-b border-[#E2E8F0]">
        <h3 className="text-sm font-semibold text-[#1A202C]">
          Recent Activity
        </h3>
      </div>
      <div className="px-5 py-2">
        {loading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="size-4 text-[#0078D4] animate-spin" />
            <span className="ml-2 text-xs text-[#64748B]">Loading...</span>
          </div>
        ) : activities.length === 0 ? (
          <div className="py-6 text-center text-xs text-[#64748B]">
            No recent activity.
          </div>
        ) : (
          activities.map((act) => (
            <div
              key={act.id}
              className="flex gap-3 py-3 border-b border-[#F1F5F9] last:border-0"
            >
              <div
                className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${DOT_COLORS[act.type] || 'bg-[#94A3B8]'}`}
              />
              <div>
                <div className="text-[13px] text-[#1A202C]">
                  {act.user && (
                    <span className="font-semibold">{act.user} </span>
                  )}
                  {act.action}{' '}
                  {act.target && (
                    <span className="font-semibold">{act.target}</span>
                  )}
                  {act.extra && ` ${act.extra}`}
                </div>
                <div className="text-[11px] text-[#94A3B8] mt-0.5">
                  {act.time}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
