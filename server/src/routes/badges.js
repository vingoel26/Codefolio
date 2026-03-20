import { Router } from 'express';
import prisma from '../lib/prisma.js';

const router = Router();

// ═══════════════════════════════════════════
// Dynamic GitHub Readme Badge — SVG endpoint
// GET /api/badge/:username/:type
// ═══════════════════════════════════════════

const BADGE_TYPES = {
    total: { label: 'Grand Total', icon: '🏆', gradient: ['#6366f1', '#8b5cf6'] },
    leetcode: { label: 'LeetCode', icon: '🟠', gradient: ['#ffa116', '#d97706'] },
    codeforces: { label: 'Codeforces', icon: '🔵', gradient: ['#1a8cff', '#0ea5e9'] },
    codechef: { label: 'CodeChef', icon: '🟤', gradient: ['#5b4638', '#78350f'] },
    gfg: { label: 'GeeksforGeeks', icon: '🟢', gradient: ['#2f8d46', '#16a34a'] },
    streak: { label: 'Master Streak', icon: '🔥', gradient: ['#ef4444', '#f97316'] },
};

function renderBadgeSVG({ label, value, subLabel, gradientFrom, gradientTo, id }) {
    const labelWidth = Math.max(label.length * 7.5 + 20, 100);
    const valueStr = String(value);
    const valueWidth = Math.max(valueStr.length * 9 + 30, 80);
    const totalWidth = labelWidth + valueWidth;

    return `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="32" role="img" aria-label="${label}: ${value}">
  <title>${label}: ${value}</title>
  <defs>
    <linearGradient id="grad-${id}" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="${gradientFrom}"/>
      <stop offset="100%" stop-color="${gradientTo}"/>
    </linearGradient>
    <linearGradient id="bg-${id}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#1e293b"/>
      <stop offset="100%" stop-color="#0f172a"/>
    </linearGradient>
  </defs>
  <rect width="${totalWidth}" height="32" rx="6" fill="url(#bg-${id})"/>
  <rect x="${labelWidth}" width="${valueWidth}" height="32" rx="0" fill="url(#grad-${id})"/>
  <rect x="${labelWidth}" width="4" height="32" fill="url(#grad-${id})"/>
  <rect width="${totalWidth}" height="32" rx="6" fill="none" stroke="#334155" stroke-width="0.5"/>
  <!-- Clip right side to rounded rect -->
  <clipPath id="clip-${id}">
    <rect width="${totalWidth}" height="32" rx="6"/>
  </clipPath>
  <rect x="${labelWidth}" width="${valueWidth}" height="32" fill="url(#grad-${id})" clip-path="url(#clip-${id})"/>
  <g fill="#fff" text-anchor="middle" font-family="'Segoe UI','Helvetica Neue',sans-serif" font-size="12">
    <text x="${labelWidth / 2}" y="20.5" font-weight="600" fill="#e2e8f0">${label}</text>
    <text x="${labelWidth + valueWidth / 2}" y="20.5" font-weight="700">${value}${subLabel ? ' ' + subLabel : ''}</text>
  </g>
</svg>`;
}

router.get('/:username/:type', async (req, res) => {
    try {
        const { username, type } = req.params;
        const badgeConfig = BADGE_TYPES[type];

        if (!badgeConfig) {
            res.setHeader('Content-Type', 'image/svg+xml');
            res.setHeader('Cache-Control', 'public, max-age=300');
            return res.send(renderBadgeSVG({
                label: 'Codefolio',
                value: 'Unknown Badge',
                subLabel: '',
                gradientFrom: '#ef4444',
                gradientTo: '#dc2626',
                id: 'err'
            }));
        }

        const user = await prisma.user.findUnique({
            where: { username },
            select: {
                id: true,
                username: true,
                displayName: true,
                linkedAccounts: {
                    select: {
                        platform: true,
                        handle: true,
                        isPrimary: true,
                        data: true,
                    }
                }
            }
        });

        if (!user) {
            res.setHeader('Content-Type', 'image/svg+xml');
            res.setHeader('Cache-Control', 'public, max-age=300');
            return res.send(renderBadgeSVG({
                label: 'Codefolio',
                value: 'User Not Found',
                subLabel: '',
                gradientFrom: '#ef4444',
                gradientTo: '#dc2626',
                id: 'notfound'
            }));
        }

        // Aggregate stats (same logic as users.js public profile)
        let grandTotalSolved = 0, bestRating = 0, totalContests = 0;
        const perPlatform = {};

        for (const acc of user.linkedAccounts) {
            const d = acc.data;
            if (!d) continue;
            const data = typeof d === 'string' ? JSON.parse(d) : d;

            let solved = 0, rating = 0, contests = 0;

            if (acc.platform === 'leetcode') {
                solved = data.stats?.totalSolved || 0;
                rating = data.contest?.rating || 0;
                contests = data.contest?.contestsAttended || 0;
            } else if (acc.platform === 'codeforces') {
                solved = data.stats?.problemsSolved || 0;
                rating = data.profile?.rating || 0;
                contests = data.stats?.contestsParticipated || 0;
            } else if (acc.platform === 'codechef') {
                solved = data.stats?.totalProblemsSolved || 0;
                rating = data.stats?.currentRating || 0;
            } else if (acc.platform === 'gfg') {
                solved = data.stats?.totalProblemsSolved || 0;
                rating = data.stats?.codingScore || 0;
            }

            grandTotalSolved += solved;
            totalContests += contests;
            if (rating > bestRating) bestRating = rating;

            if (!perPlatform[acc.platform]) {
                perPlatform[acc.platform] = { solved: 0, rating: 0, contests: 0 };
            }
            perPlatform[acc.platform].solved += solved;
            if (rating > perPlatform[acc.platform].rating) perPlatform[acc.platform].rating = rating;
            perPlatform[acc.platform].contests += contests;
        }

        let label, value, subLabel = '';

        switch (type) {
            case 'total':
                label = 'Codefolio Total';
                value = grandTotalSolved.toLocaleString();
                subLabel = 'solved';
                break;
            case 'leetcode':
                label = 'LeetCode';
                value = (perPlatform.leetcode?.solved || 0).toLocaleString();
                subLabel = 'solved';
                break;
            case 'codeforces':
                label = 'Codeforces';
                value = perPlatform.codeforces?.rating || 0;
                subLabel = 'rating';
                break;
            case 'codechef':
                label = 'CodeChef';
                value = perPlatform.codechef?.rating || 0;
                subLabel = 'rating';
                break;
            case 'gfg':
                label = 'GeeksforGeeks';
                value = (perPlatform.gfg?.solved || 0).toLocaleString();
                subLabel = 'solved';
                break;
            case 'streak':
                label = 'Master Streak';
                // Calculate streak days from heatmap data would require more logic
                // For now we show grand total contests as a proxy
                value = totalContests;
                subLabel = 'contests';
                break;
            default:
                label = 'Codefolio';
                value = '?';
        }

        res.setHeader('Content-Type', 'image/svg+xml');
        res.setHeader('Cache-Control', 'public, max-age=3600');
        res.send(renderBadgeSVG({
            label,
            value,
            subLabel,
            gradientFrom: badgeConfig.gradient[0],
            gradientTo: badgeConfig.gradient[1],
            id: type
        }));

    } catch (err) {
        console.error('Badge generation error:', err);
        res.setHeader('Content-Type', 'image/svg+xml');
        res.send(renderBadgeSVG({
            label: 'Codefolio',
            value: 'Error',
            subLabel: '',
            gradientFrom: '#ef4444',
            gradientTo: '#dc2626',
            id: 'error'
        }));
    }
});

export default router;
