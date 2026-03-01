import { Code2 } from 'lucide-react';
import PagePlaceholder from '../components/ui/PagePlaceholder';

export default function Snippets() {
    return (
        <PagePlaceholder
            icon={Code2}
            title="Algorithm Snippet Vault"
            description="Your personal code template library — save, search, and reuse algorithm implementations."
            accentColor="var(--accent)"
            features={[
                'Code editor (Monaco / CodeMirror)',
                'Title, language, category, and tags per snippet',
                'Search & filter by language, category, or tag',
                'One-click copy-to-clipboard',
                'Default categories: Segment Tree, DSU, Dijkstra, KMP...',
            ]}
        />
    );
}
