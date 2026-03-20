import express from 'express';
import fetch from 'node-fetch'; // assuming fetch is global in Node 22, but we can just use native fetch

const router = express.Router();

/**
 * Normalizes all contests into a uniform { id, platform, name, url, startTime, durationSeconds } format
 */
router.get('/', async (req, res) => {
    try {
        const contests = [];

        // 1. Fetch Codeforces Contests
        try {
            const cfRes = await fetch('https://codeforces.com/api/contest.list?gym=false');
            if (cfRes.ok) {
                const cfData = await cfRes.json();
                if (cfData.status === 'OK') {
                    // Filter for upcoming contests (phase === 'BEFORE')
                    const upcomingCF = cfData.result.filter(c => c.phase === 'BEFORE');
                    upcomingCF.forEach(c => {
                        contests.push({
                            id: `cf-${c.id}`,
                            platform: 'codeforces',
                            name: c.name,
                            url: `https://codeforces.com/contests/${c.id}`,
                            startTime: new Date(c.startTimeSeconds * 1000).toISOString(),
                            durationSeconds: c.durationSeconds
                        });
                    });
                }
            }
        } catch (e) {
            console.error('Failed to fetch Codeforces contests:', e);
        }

        // 2. Fetch LeetCode Contests via GraphQL
        try {
            const lcRes = await fetch('https://leetcode.com/graphql', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'User-Agent': 'Mozilla/5.0' },
                body: JSON.stringify({
                    query: `
                        query {
                            allContests {
                                title
                                titleSlug
                                startTime
                                duration
                            }
                        }
                    `
                })
            });
            if (lcRes.ok) {
                const lcData = await lcRes.json();
                if (lcData.data && lcData.data.allContests) {
                    const now = Date.now() / 1000;
                    // Filter for upcoming contests
                    const upcomingLC = lcData.data.allContests.filter(c => c.startTime > now);
                    upcomingLC.forEach(c => {
                        contests.push({
                            id: `lc-${c.titleSlug}`,
                            platform: 'leetcode',
                            name: c.title,
                            url: `https://leetcode.com/contest/${c.titleSlug}`,
                            startTime: new Date(c.startTime * 1000).toISOString(),
                            durationSeconds: c.duration
                        });
                    });
                }
            }
        } catch (e) {
            console.error('Failed to fetch LeetCode contests:', e);
        }

        // Sort chronologically (closest first)
        contests.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));

        res.json({ contests });
    } catch (error) {
        console.error('Contest Aggregation Error:', error);
        res.status(500).json({ error: 'Failed to aggregate contests' });
    }
});

export default router;
