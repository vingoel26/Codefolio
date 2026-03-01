import { Settings as SettingsIcon } from 'lucide-react';
import PagePlaceholder from '../components/ui/PagePlaceholder';

export default function Settings() {
    return (
        <PagePlaceholder
            icon={SettingsIcon}
            title="Settings"
            description="Manage your profile, display preferences, and account settings."
            accentColor="var(--text-muted)"
            features={[
                'Update display name, avatar, and bio',
                'Theme preference (light / dark / system)',
                'Notification preferences',
                'Data export',
            ]}
        />
    );
}
