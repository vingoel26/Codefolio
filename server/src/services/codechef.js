/**
 * CodeChef Data Service
 * Scrapes the public profile page since community APIs are unreliable.
 */

/**
 * Fetch CodeChef data for a handle by scraping the profile page.
 * @param {string} handle
 * @returns {Promise<object>}
 */
export async function fetchCodeChefData(handle) {
    const res = await fetch(`https://www.codechef.com/users/${handle}`, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36',
            'Accept': 'text/html',
        },
    });

    if (!res.ok) {
        throw new Error(`CodeChef profile fetch error: ${res.status}`);
    }

    const html = await res.text();

    // Extract data from HTML
    const rating = extractMatch(html, /rating-number">\s*(\d+)/);
    const highestRating = extractMatch(html, /Highest Rating.*?<small>\((\d+)\)/s);
    const stars = (html.match(/rating-star/g) || []).length || extractMatch(html, /(\d+)\s*★/);
    const globalRank = extractMatch(html, /Global Rank.*?<strong>(\d+)/s);
    const countryRank = extractMatch(html, /Country Rank.*?<strong>(\d+)/s);

    // Problems solved
    const totalSolved = extractMatch(html, /Total Problems Solved:\s*<\/dt>\s*<dd>(\d+)/s)
        || extractMatch(html, /problems-solved.*?<h5>.*?(\d+)/s);

    // Name
    const name = extractMatch(html, /class="h2-style">\s*([^<]+)/);

    // Rating data from embedded JSON
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
        } catch {
            // ignore parse errors
        }
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
        },
        stats: {
            currentRating: parseInt(rating) || 0,
            highestRating: parseInt(highestRating) || parseInt(rating) || 0,
            totalProblemsSolved: parseInt(totalSolved) || 0,
            contestsParticipated: ratingHistory.length,
        },
        ratingHistory,
        fetchedAt: new Date().toISOString(),
    };
}

/**
 * Extract first capture group from regex match.
 */
function extractMatch(text, regex) {
    const match = text.match(regex);
    return match ? match[1].trim() : null;
}
