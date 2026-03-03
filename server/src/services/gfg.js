/**
 * GeeksforGeeks Data Service
 * Uses GFG's internal API endpoint for profile data.
 */

const GFG_API = 'https://www.geeksforgeeks.org/api/profilePage/';

/**
 * Fetch GFG data for a handle.
 * @param {string} handle
 * @returns {Promise<object>}
 */
export async function fetchGFGData(handle) {
    // GFG has an internal API for profile pages
    const res = await fetch(`${GFG_API}${handle}/`, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36',
            'Accept': 'application/json',
        },
    });

    if (!res.ok) {
        // Fallback: try scraping the profile page
        return await fetchGFGFromProfilePage(handle);
    }

    let data;
    try {
        data = await res.json();
    } catch {
        return await fetchGFGFromProfilePage(handle);
    }

    if (data.error || (!data.userName && !data.name)) {
        return await fetchGFGFromProfilePage(handle);
    }

    // Parse solved stats
    const solvedStats = data.solvedStats || {};

    return {
        profile: {
            handle: handle,
            name: data.name || data.userName || handle,
            institute: data.institute || '',
            rank: data.instituteRank || '',
            streak: data.currentStreak || '0',
            maxStreak: data.maxStreak || '0',
            avatar: data.profilePicture || '',
        },
        stats: {
            codingScore: parseInt(data.codingScore) || 0,
            totalProblemsSolved: parseInt(data.totalProblemsSolved) || 0,
            monthlyCodingScore: parseInt(data.monthlyCodingScore) || 0,
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
            'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36',
            'Accept': 'text/html',
        },
    });

    if (!res.ok) {
        throw new Error(`GFG user "${handle}" not found (${res.status})`);
    }

    const html = await res.text();

    // Extract data from HTML/embedded JSON
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
            avatar: '',
        },
        stats: {
            codingScore: codingScore || 0,
            totalProblemsSolved: totalSolved || 0,
            monthlyCodingScore: 0,
        },
        difficultyDistribution: {
            school: 0,
            basic: 0,
            easy: 0,
            medium: 0,
            hard: 0,
        },
        fetchedAt: new Date().toISOString(),
    };
}

function extractNum(text, regex) {
    const match = text.match(regex);
    return match ? parseInt(match[1]) : null;
}
