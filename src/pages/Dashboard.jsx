import { LayoutDashboard } from 'lucide-react';
import PagePlaceholder from '../components/ui/PagePlaceholder';

export default function Dashboard() {
    return (
        <PagePlaceholder
            icon={LayoutDashboard}
            title="Master Dashboard"
            description="Your aggregated command center — all platforms, all accounts, one view."
            accentColor="var(--accent)"
            features={[
                'Grand Total Counter across all platforms',
                'Master Streak Heatmap (GitHub-style)',
                'Platform Summary Cards with current ratings',
                'Unified Activity Feed',
                'Weekly Report Widget',
            ]}
        />
    );
}
