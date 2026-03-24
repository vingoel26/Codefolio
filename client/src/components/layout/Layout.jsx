import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import FocusTimerWidget from '../widgets/FocusTimerWidget';
import ChatPanel from '../widgets/ChatPanel';

/**
 * Main application layout with sidebar + navbar + content area.
 * The <Outlet /> renders the matched child route.
 */
export default function Layout() {
    const location = useLocation();
    const isFullBleed = ['/chat', '/analytics', '/coach', '/contests'].includes(location.pathname);

    return (
        <div className="app-layout">
            <Sidebar />
            <div className="app-main">
                <Navbar />
                <main className={`app-content ${isFullBleed ? 'no-padding' : ''}`}>
                    <Outlet />
                </main>
            </div>
            
            {/* Global Widgets: Survives page navigation */}
            <FocusTimerWidget />

            <style>{`
                .app-layout {
                    display: flex;
                    min-height: 100vh;
                    background: var(--bg-primary);
                }

                .app-main {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    min-width: 0;
                    overflow: hidden;
                }

                .app-content {
                    flex: 1;
                    padding: 24px 32px;
                    overflow-y: auto;
                }

                .app-content.no-padding {
                    padding: 0;
                    overflow: hidden;
                }
            `}</style>
        </div>
    );
}
