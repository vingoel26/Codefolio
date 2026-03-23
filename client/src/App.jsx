import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuthStore } from './stores/authStore';
import { useSocketStore } from './stores/socketStore';
import Layout from './components/layout/Layout';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Login from './pages/Login';
import Signup from './pages/Signup';
import AuthCallback from './pages/AuthCallback';
import Dashboard from './pages/Dashboard';
import LeetCode from './pages/LeetCode';
import CodeChef from './pages/CodeChef';
import GFG from './pages/GFG';
import Snippets from './pages/Snippets';
import Codeforces from './pages/Codeforces';
import Accounts from './pages/Accounts';
import Settings from './pages/Settings';
import Profile from './pages/Profile';
import CompleteProfile from './pages/CompleteProfile';
import Landing from './pages/Landing';
import About from './pages/About';
import Feed from './pages/Feed';
import Blog from './pages/Blog';
import PostEditor from './pages/PostEditor';
import PostView from './pages/PostView';
import PortfolioEngine from './pages/PortfolioEngine';
import Arena from './pages/Arena';
import BattleRoom from './pages/BattleRoom';
import ChatPage from './pages/ChatPage';
import SmartAnalytics from './pages/SmartAnalytics';
import Contests from './pages/Contests';
import ChatPanel from './components/widgets/ChatPanel';

function AppInit({ children }) {
    const initialize = useAuthStore((s) => s.initialize);
    const accessToken = useAuthStore((s) => s.accessToken);
    const connectSocket = useSocketStore((s) => s.connect);
    const disconnectSocket = useSocketStore((s) => s.disconnect);

    useEffect(() => {
        initialize();
    }, [initialize]);

    useEffect(() => {
        if (accessToken) {
            connectSocket(accessToken);
        } else {
            disconnectSocket();
        }
    }, [accessToken, connectSocket, disconnectSocket]);

    return (
        <>
            {children}
            {accessToken && <ChatPanel />}
        </>
    );
}

function App() {
    return (
        <BrowserRouter>
            <AppInit>
                <Routes>
                    {/* Public routes */}
                    <Route path="/" element={<Landing />} />
                    <Route path="/about" element={<About />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/signup" element={<Signup />} />
                    <Route path="/auth/callback/:provider" element={<AuthCallback />} />
                    <Route path="/u/:username" element={<Profile standalone />} />
                    <Route path="/portfolio/:username" element={<PortfolioEngine />} />

                    {/* Protected route WITHOUT Layout (full screen like Login) */}
                    <Route
                        path="/complete-profile"
                        element={
                            <ProtectedRoute>
                                <CompleteProfile />
                            </ProtectedRoute>
                        }
                    />

                    {/* Protected routes WITH Layout (Dashboard) */}
                    <Route
                        element={
                            <ProtectedRoute>
                                <Layout />
                            </ProtectedRoute>
                        }
                    >
                        <Route path="/dashboard" element={<Dashboard />} />
                        <Route path="/feed" element={<Feed />} />
                        <Route path="/codeforces" element={<Codeforces />} />
                        <Route path="/leetcode" element={<LeetCode />} />
                        <Route path="/codechef" element={<CodeChef />} />
                        <Route path="/gfg" element={<GFG />} />
                        <Route path="/snippets" element={<Snippets />} />
                        <Route path="/accounts" element={<Accounts />} />
                        <Route path="/settings" element={<Settings />} />
                        <Route path="/profile" element={<Profile />} />
                        <Route path="/blog" element={<Blog />} />
                        <Route path="/blog/new" element={<PostEditor />} />
                        <Route path="/blog/edit/:id" element={<PostEditor />} />
                        <Route path="/blog/:slug" element={<PostView />} />
                        <Route path="/chat" element={<ChatPage />} />
                        <Route path="/arena" element={<Arena />} />
                        <Route path="/arena/:id" element={<BattleRoom />} />
                        <Route path="/analytics" element={<SmartAnalytics />} />
                        <Route path="/contests" element={<Contests />} />
                    </Route>
                </Routes>
            </AppInit>
        </BrowserRouter>
    );
}

export default App;
