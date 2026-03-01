import { BarChart3 } from 'lucide-react';
import PagePlaceholder from '../components/ui/PagePlaceholder';

export default function CodeChef() {
    return (
        <PagePlaceholder
            icon={BarChart3}
            title="CodeChef Dashboard"
            description="Your rating, division, contest history, and total problems at a glance."
            accentColor="var(--codechef)"
            features={[
                'Rating Card (star ranking 1★ to 7★)',
                'Division (Div 1/2/3) & Global Rank',
                'Contest History with Rating Delta Chart',
                'Total Problems Solved (difficulty breakdown)',
            ]}
        />
    );
}
