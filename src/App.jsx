import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import Codeforces from './pages/Codeforces';
import LeetCode from './pages/LeetCode';
import CodeChef from './pages/CodeChef';
import GFG from './pages/GFG';
import Snippets from './pages/Snippets';
import Accounts from './pages/Accounts';
import Settings from './pages/Settings';

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route element={<Layout />}>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/codeforces" element={<Codeforces />} />
                    <Route path="/leetcode" element={<LeetCode />} />
                    <Route path="/codechef" element={<CodeChef />} />
                    <Route path="/gfg" element={<GFG />} />
                    <Route path="/snippets" element={<Snippets />} />
                    <Route path="/accounts" element={<Accounts />} />
                    <Route path="/settings" element={<Settings />} />
                </Route>
            </Routes>
        </BrowserRouter>
    );
}

export default App;
