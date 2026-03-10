import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuthStore } from './stores/authStore';
import Layout from './components/layout/Layout';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Login from './pages/Login';
import Signup from './pages/Signup';
import AuthCallback from './pages/AuthCallback';
import Dashboard from './pages/Dashboard';
import Codeforces from './pages/Codeforces';
import LeetCode from './pages/LeetCode';
import CodeChef from './pages/CodeChef';
import GFG from './pages/GFG';
import Snippets from './pages/Snippets';
import Accounts from './pages/Accounts';
import Settings from './pages/Settings';
import Profile from './pages/Profile';

function AppInit({ children }) {
    const initialize = useAuthStore((s) => s.initialize);

    useEffect(() => {
        initialize();
    }, [initialize]);

    return children;
}

function App() {
    return (
        <BrowserRouter>
            <AppInit>
                <Routes>
                    {/* Public routes */}
                    <Route path="/login" element={<Login />} />
                    <Route path="/signup" element={<Signup />} />
                    <Route path="/auth/callback/:provider" element={<AuthCallback />} />
                    <Route path="/u/:username" element={<Profile standalone />} />

                    {/* Protected routes (require auth) */}
                    <Route
                        element={
                            <ProtectedRoute>
                                <Layout />
                            </ProtectedRoute>
                        }
                    >
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/codeforces" element={<Codeforces />} />
                        <Route path="/leetcode" element={<LeetCode />} />
                        <Route path="/codechef" element={<CodeChef />} />
                        <Route path="/gfg" element={<GFG />} />
                        <Route path="/snippets" element={<Snippets />} />
                        <Route path="/accounts" element={<Accounts />} />
                        <Route path="/settings" element={<Settings />} />
                        <Route path="/profile" element={<Profile />} />
                    </Route>
                </Routes>
            </AppInit>
        </BrowserRouter>
    );
}

export default App;
