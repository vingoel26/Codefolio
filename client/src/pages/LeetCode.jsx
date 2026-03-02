import { Code2 } from 'lucide-react';
import PagePlaceholder from '../components/ui/PagePlaceholder';

export default function LeetCode() {
    return (
        <PagePlaceholder
            icon={Code2}
            title="LeetCode Dashboard"
            description="Track your difficulty breakdown, streaks, contest performance, and topic progress."
            accentColor="var(--leetcode)"
            features={[
                'Difficulty Donut Chart (Easy / Medium / Hard)',
                'Global Percentile & Contest Rating',
                'Topic Progress Grid (DSA categories)',
                'Daily Streak Counter (current + longest)',
            ]}
        />
    );
}
