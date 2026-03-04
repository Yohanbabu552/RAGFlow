/**
 * ActivityFeed — Recent activity timeline with colored dots.
 */

interface Activity {
  user: string | null;
  action: string;
  target: string;
  extra?: string;
  time: string;
  type: 'upload' | 'ocr' | 'chat' | 'user';
}

const MOCK_ACTIVITIES: Activity[] = [
  {
    user: 'Rahul S.',
    action: 'uploaded 5 files to',
    target: 'Rice Products',
    time: '10 minutes ago',
    type: 'upload',
  },
  {
    user: null,
    action: 'OCR completed for',
    target: 'Fair_And_Handsome_Label_v3.png',
    time: '25 minutes ago',
    type: 'ocr',
  },
  {
    user: 'Priya M.',
    action: 'started a chat session in',
    target: 'Personal Care',
    time: '1 hour ago',
    type: 'chat',
  },
  {
    user: null,
    action: 'New user',
    target: 'Amit K.',
    extra: 'added to Healthcare project',
    time: '2 hours ago',
    type: 'user',
  },
];

const DOT_COLORS: Record<string, string> = {
  upload: 'bg-[#0078D4]',
  ocr: 'bg-[#28A745]',
  chat: 'bg-[#7C3AED]',
  user: 'bg-[#F57C00]',
};

export function ActivityFeed() {
  return (
    <div className="bg-white rounded-xl border border-[#E2E8F0]">
      <div className="px-5 py-4 border-b border-[#E2E8F0]">
        <h3 className="text-sm font-semibold text-[#1A202C]">
          Recent Activity
        </h3>
      </div>
      <div className="px-5 py-2">
        {MOCK_ACTIVITIES.map((act, i) => (
          <div
            key={i}
            className="flex gap-3 py-3 border-b border-[#F1F5F9] last:border-0"
          >
            <div
              className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${DOT_COLORS[act.type]}`}
            />
            <div>
              <div className="text-[13px] text-[#1A202C]">
                {act.user && (
                  <span className="font-semibold">{act.user} </span>
                )}
                {act.action}{' '}
                <span className="font-semibold">{act.target}</span>
                {act.extra && ` ${act.extra}`}
              </div>
              <div className="text-[11px] text-[#94A3B8] mt-0.5">
                {act.time}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
