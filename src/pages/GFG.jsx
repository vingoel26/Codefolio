import { BookOpen } from 'lucide-react';
import PagePlaceholder from '../components/ui/PagePlaceholder';

export default function GFG() {
    return (
        <PagePlaceholder
            icon={BookOpen}
            title="GeeksforGeeks Dashboard"
            description="Coding score, monthly activity, and problem breakdown by difficulty."
            accentColor="var(--gfg)"
            features={[
                'Coding Score (GfG primary metric)',
                'Problems Solved: School / Basic / Easy / Medium / Hard',
                'Monthly Activity Score & Ranking',
            ]}
        />
    );
}
