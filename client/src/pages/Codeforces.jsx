import { Trophy } from 'lucide-react';
import PagePlaceholder from '../components/ui/PagePlaceholder';

export default function Codeforces() {
    return (
        <PagePlaceholder
            icon={Trophy}
            title="Codeforces Dashboard"
            description="Rating trajectory, tag mastery, contests, and submissions — all in one place."
            accentColor="var(--codeforces)"
            features={[
                'Rating Trajectory Chart (color-coded by rank tier)',
                'Current Stats Bar (rating, max rating, rank title)',
                'Tag Mastery Radar Chart (top 8 tags)',
                'Recent Contests Table (last 10)',
                'Recent Submissions Feed',
            ]}
        />
    );
}
