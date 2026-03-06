/**
 * GeeksforGeeks Data Service
 * Uses GFG's auth API endpoint (authapi.geeksforgeeks.org) + profile page API.
 */

/**
 * Fetch GFG data for a handle.
 * @param {string} handle
 * @returns {Promise<object>}
 */
export async function fetchGFGData(handle) {
    const browserHeaders = {
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64; rv:120.0) Gecko/20100101 Firefox/120.0',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'identity',
        'Referer': `https://www.geeksforgeeks.org/user/${handle}/`,
        'Origin': 'https://www.geeksforgeeks.org',
        'Connection': 'keep-alive',
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'same-site',
    };

    // Try authapi (most reliable from browser subagent testing)
    let data = null;
    try {
        const res = await fetch(
            `https://authapi.geeksforgeeks.org/api-get/user-profile-info/?handle=${handle}`,
            { headers: browserHeaders }
        );
        if (res.ok) {
            const json = await res.json();
            if (json.data) data = json.data;
        }
    } catch { /* try next */ }

    // Fallback: internal profilePage API
    if (!data) {
        try {
            const res = await fetch(
                `https://www.geeksforgeeks.org/api/profilePage/${handle}/`,
                { headers: { ...browserHeaders, 'Sec-Fetch-Site': 'same-origin' } }
            );
            if (res.ok) {
                const json = await res.json();
                if (json && !json.error) data = json;
            }
        } catch { /* try next */ }
    }

    // Fallback: scrape profile page
    if (!data) {
        return await fetchGFGFromProfilePage(handle);
    }

    // Parse the data (field names differ between APIs)
    const codingScore = parseInt(data.score || data.codingScore) || 0;
    const totalSolved = parseInt(data.total_problems_solved || data.totalProblemsSolved) || 0;
    const monthlyScore = parseInt(data.monthly_score || data.monthlyCodingScore) || 0;
    const currentStreak = String(data.pod_solved_current_streak || data.currentStreak || '0');
    const maxStreak = String(data.pod_solved_longest_streak || data.maxStreak || '0');
    const globalLongestStreak = parseInt(data.pod_solved_global_longest_streak) || 0;

    // Solved stats if available
    const solvedStats = data.solvedStats || {};

    return {
        profile: {
            handle,
            name: data.name || data.userName || handle,
            institute: data.institute_name || data.organization_name || data.institute || '',
            rank: data.institute_rank || data.instituteRank || '',
            streak: currentStreak,
            maxStreak: maxStreak,
            globalLongestStreak,
            avatar: data.profile_image_url || data.profilePicture || '',
        },
        stats: {
            codingScore,
            totalProblemsSolved: totalSolved,
            monthlyCodingScore: monthlyScore,
        },
        difficultyDistribution: {
            school: parseInt(solvedStats.SCHOOL?.count) || 0,
            basic: parseInt(solvedStats.BASIC?.count) || 0,
            easy: parseInt(solvedStats.EASY?.count) || 0,
            medium: parseInt(solvedStats.MEDIUM?.count) || 0,
            hard: parseInt(solvedStats.HARD?.count) || 0,
        },
        fetchedAt: new Date().toISOString(),
    };
}

/**
 * Fallback: scrape the GFG profile page.
 */
async function fetchGFGFromProfilePage(handle) {
    const res = await fetch(`https://www.geeksforgeeks.org/user/${handle}/`, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64; rv:120.0) Gecko/20100101 Firefox/120.0',
            'Accept': 'text/html,application/xhtml+xml',
            'Accept-Encoding': 'identity',
        },
    });

    if (!res.ok) {
        throw new Error(`GFG user "${handle}" not found (${res.status})`);
    }

    const html = await res.text();

    // Try to find embedded JSON data (Next.js __NEXT_DATA__)
    const nextDataMatch = html.match(/<script id="__NEXT_DATA__"[^>]*>(.*?)<\/script>/s);
    if (nextDataMatch) {
        try {
            const nextData = JSON.parse(nextDataMatch[1]);
            const userData = nextData?.props?.pageProps?.userProfile || nextData?.props?.pageProps?.userInfo || {};
            if (userData.codingScore || userData.total_problems_solved) {
                return {
                    profile: {
                        handle,
                        name: userData.name || handle,
                        institute: userData.institute_name || '',
                        rank: userData.institute_rank || '',
                        streak: String(userData.pod_solved_current_streak || '0'),
                        maxStreak: String(userData.pod_solved_longest_streak || '0'),
                        globalLongestStreak: 0,
                        avatar: userData.profile_image_url || '',
                    },
                    stats: {
                        codingScore: parseInt(userData.codingScore || userData.score) || 0,
                        totalProblemsSolved: parseInt(userData.total_problems_solved || userData.totalProblemsSolved) || 0,
                        monthlyCodingScore: parseInt(userData.monthly_score || userData.monthlyCodingScore) || 0,
                    },
                    difficultyDistribution: {
                        school: 0, basic: 0, easy: 0, medium: 0, hard: 0,
                    },
                    fetchedAt: new Date().toISOString(),
                };
            }
        } catch { /* ignore */ }
    }

    // Regex extraction from HTML
    const codingScore = extractNum(html, /Coding Score[^<]*<\/span>\s*<span[^>]*>(\d+)/s) ||
        extractNum(html, /codingScore.*?(\d+)/);
    const totalSolved = extractNum(html, /Total Problems Solved[^<]*<\/span>\s*<span[^>]*>(\d+)/s) ||
        extractNum(html, /totalProblemsSolved.*?(\d+)/);
    const streak = extractNum(html, /Current Streak[^<]*<\/span>\s*<span[^>]*>(\d+)/s) ||
        extractNum(html, /currentStreak.*?(\d+)/);

    return {
        profile: {
            handle,
            name: handle,
            institute: '',
            rank: '',
            streak: String(streak || 0),
            maxStreak: '0',
            globalLongestStreak: 0,
            avatar: '',
        },
        stats: {
            codingScore: codingScore || 0,
            totalProblemsSolved: totalSolved || 0,
            monthlyCodingScore: 0,
        },
        difficultyDistribution: {
            school: 0, basic: 0, easy: 0, medium: 0, hard: 0,
        },
        fetchedAt: new Date().toISOString(),
    };
}

function extractNum(text, regex) {
    const match = text.match(regex);
    return match ? parseInt(match[1]) : null;
}
