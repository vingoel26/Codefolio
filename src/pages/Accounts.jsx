import { Link2 } from 'lucide-react';
import PagePlaceholder from '../components/ui/PagePlaceholder';

export default function Accounts() {
    return (
        <PagePlaceholder
            icon={Link2}
            title="Connected Accounts"
            description="Link your competitive programming handles to start tracking stats."
            accentColor="var(--info)"
            features={[
                'Add multiple accounts per platform',
                'Custom labels (Main, Practice, Work)',
                'Primary account toggle',
                'Last synced timestamp & manual refresh',
                'Auto-fetch stats on link',
            ]}
        />
    );
}
