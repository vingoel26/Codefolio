/**
 * CodeChef Data Service
 * Uses a two-step approach: first get a session cookie, then fetch the profile.
 * CodeChef blocks requests without a valid Drupal session cookie.
 */

const BROWSER_UA = 'Mozilla/5.0 (X11; Linux x86_64; rv:120.0) Gecko/20100101 Firefox/120.0';

/**
 * Fetch CodeChef data for a handle.
 * @param {string} handle
 * @returns {Promise<object>}
 */
export async function fetchCodeChefData(handle) {
    // Step 1: Get a session cookie from the CodeChef homepage
    const cookie = await getCodeChefCookie();

    // Step 2: Fetch profile page with the cookie
    const headers = {
        'User-Agent': BROWSER_UA,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'identity',
        'Connection': 'keep-alive',
        'Referer': 'https://www.codechef.com/',
        ...(cookie ? { 'Cookie': cookie } : {}),
    };

    const res = await fetch(`https://www.codechef.com/users/${handle}`, {
        headers,
        redirect: 'follow',
    });

    if (!res.ok) {
        throw new Error(`CodeChef HTTP ${res.status}`);
    }

    const html = await res.text();

    if (!html || html.length < 1000 || !html.includes('rating')) {
        throw new Error('CodeChef returned incomplete page. The site may be blocking requests.');
    }

    // Extract data from HTML
    const rating = extractMatch(html, /rating-number">\s*(\d+)/);
    const highestRating = extractMatch(html, /Highest Rating.*?<small>\((\d+)\)/s);
    const starsMatch = html.match(/<div class="rating-star">([\s\S]*?)<\/div>/);
    const stars = starsMatch ? (starsMatch[1].match(/&#9733;|★/g) || []).length : extractMatch(html, /(\d+)\s*★/) || 0;
    const globalRank = extractMatch(html, /Global Rank.*?<strong>(\d+)/s);
    const countryRank = extractMatch(html, /Country Rank.*?<strong>(\d+)/s);
    const division = extractMatch(html, /rated in\s*Div(?:ision)?\s*(\d)/i);
    const name = extractMatch(html, /class="h2-style">\s*([^<]+)/);

    // Problems solved — multiple patterns
    const totalSolved = extractMatch(html, /Total Problems Solved:\s*<\/dt>\s*<dd>(\d+)/s)
        || extractMatch(html, /Total Problems Solved:\s*(\d+)/is)
        || extractMatch(html, /problems-solved.*?<h5>.*?(\d+)/s)
        || extractMatch(html, /Fully Solved[^<]*<\/h5>\s*<h5>(\d+)/s)
        || extractMatch(html, /fully-solved.*?<h5>(\d+)/s);

    // Rating data from embedded JavaScript
    let ratingHistory = [];
    const ratingDataMatch = html.match(/var\s+all_rating\s*=\s*(\[.*?\]);/s);
    if (ratingDataMatch) {
        try {
            const parsed = JSON.parse(ratingDataMatch[1]);
            ratingHistory = parsed.map((r) => ({
                code: r.code || '',
                name: r.name || r.code || '',
                rating: parseInt(r.rating) || 0,
                rank: parseInt(r.rank) || 0,
                date: r.end_date || '',
            }));
        } catch { /* ignore parse errors */ }
    }

    // Heatmap data
    let submissionHeatmap = {};
    const heatmapMatch = html.match(/var\s+date_rating\s*=\s*({.*?});/s);
    if (heatmapMatch) {
        try {
            submissionHeatmap = JSON.parse(heatmapMatch[1]);
        } catch { /* ignore */ }
    }

    return {
        profile: {
            handle,
            name: name || handle,
            stars: parseInt(stars) || 0,
            rating: parseInt(rating) || 0,
            highestRating: parseInt(highestRating) || parseInt(rating) || 0,
            globalRank: parseInt(globalRank) || 0,
            countryRank: parseInt(countryRank) || 0,
            division: parseInt(division) || 0,
        },
        stats: {
            currentRating: parseInt(rating) || 0,
            highestRating: parseInt(highestRating) || parseInt(rating) || 0,
            totalProblemsSolved: parseInt(totalSolved) || 0,
            contestsParticipated: ratingHistory.length,
        },
        ratingHistory,
        submissionHeatmap,
        fetchedAt: new Date().toISOString(),
    };
}

/**
 * Get a session cookie from CodeChef by visiting the homepage.
 * @returns {Promise<string|null>}
 */
async function getCodeChefCookie() {
    try {
        const res = await fetch('https://www.codechef.com/', {
            headers: {
                'User-Agent': BROWSER_UA,
                'Accept': 'text/html',
            },
            redirect: 'manual',  // Don't follow redirects, just get cookies
        });

        // Extract Set-Cookie headers
        const cookies = [];
        const setCookie = res.headers.getSetCookie?.() || [];
        for (const c of setCookie) {
            const name = c.split(';')[0];
            if (name) cookies.push(name);
        }

        // If headers.getSetCookie doesn't work, try raw
        if (cookies.length === 0) {
            const raw = res.headers.get('set-cookie');
            if (raw) {
                for (const part of raw.split(/,\s*(?=[A-Z])/)) {
                    const name = part.split(';')[0];
                    if (name) cookies.push(name);
                }
            }
        }

        return cookies.join('; ') || null;
    } catch {
        return null;
    }
}

/**
 * Extract first capture group from regex match.
 */
function extractMatch(text, regex) {
    const match = text.match(regex);
    return match ? match[1].trim() : null;
}
