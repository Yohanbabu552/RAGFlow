/**
 * Dashboard — Main home page matching EMAMI reference design.
 *
 * Layout:
 * - Welcome banner (gradient with greeting + CTAs)
 * - 4 stat cards (projects, docs, OCR, chat)
 * - Two-column: left (recent docs, 2/3) + right (quick actions + activity, 1/3)
 */

import { ActivityFeed } from './activity-feed';
import { QuickActions } from './quick-actions';
import { RecentDocuments } from './recent-documents';
import { StatCards } from './stat-cards';
import { WelcomeBanner } from './welcome-banner';

const Home = () => {
  return (
    <div>
      <WelcomeBanner />
      <StatCards />

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6">
        {/* Left: Recent Documents */}
        <RecentDocuments />

        {/* Right: Quick Actions + Activity Feed */}
        <div className="flex flex-col gap-6">
          <QuickActions />
          <ActivityFeed />
        </div>
      </div>
    </div>
  );
};

export default Home;
