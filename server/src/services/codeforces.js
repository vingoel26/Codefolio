/**
 * Codeforces API Service
 * https://codeforces.com/apiHelp
 */

const CF_API = 'https://codeforces.com/api';

/**
 * Fetch comprehensive Codeforces data for a handle.
 * @param {string} handle — e.g. "tourist"
 * @returns {Promise<object>}
 */
export async function fetchCodeforcesData(handle) {
    const [userInfo, ratingHistory, submissions] = await Promise.all([
        cfFetch(`/user.info?handles=${handle}`),
        cfFetch(`/user.rating?handle=${handle}`).catch(() => []), // may 404 if no contests
        cfFetch(`/user.status?handle=${handle}&from=1&count=10000`).catch(() => []),
    ]);

    const user = Array.isArray(userInfo) ? userInfo[0] : userInfo;

    // Process submissions for stats
    const problemsSolved = new Set();
    const tagCount = {};
    const difficultyCount = {};
    const verdictCount = {};
    const languageCount = {};
    const submissionsByDate = {};

    for (const sub of submissions) {
        // Verdict distribution
        verdictCount[sub.verdict] = (verdictCount[sub.verdict] || 0) + 1;

        // Language distribution
        languageCount[sub.programmingLanguage] = (languageCount[sub.programmingLanguage] || 0) + 1;

        // Only count accepted for solved
        if (sub.verdict === 'OK' && sub.problem) {
            const key = `${sub.problem.contestId}-${sub.problem.index}`;
            if (!problemsSolved.has(key)) {
                problemsSolved.add(key);

                // Tag distribution
                for (const tag of sub.problem.tags || []) {
                    tagCount[tag] = (tagCount[tag] || 0) + 1;
                }

                // Difficulty distribution
                if (sub.problem.rating) {
                    const bucket = `${Math.floor(sub.problem.rating / 400) * 400}-${Math.floor(sub.problem.rating / 400) * 400 + 399}`;
                    difficultyCount[bucket] = (difficultyCount[bucket] || 0) + 1;
                }
            }
        }

        // Submissions by date (for heatmap)
        const date = new Date(sub.creationTimeSeconds * 1000).toISOString().split('T')[0];
        submissionsByDate[date] = (submissionsByDate[date] || 0) + 1;
    }

    // Rating history
    const ratingData = (ratingHistory || []).map((r) => ({
        contestId: r.contestId,
        contestName: r.contestName,
        rank: r.rank,
        oldRating: r.oldRating,
        newRating: r.newRating,
        date: new Date(r.ratingUpdateTimeSeconds * 1000).toISOString(),
    }));

    return {
        profile: {
            handle: user.handle,
            rating: user.rating || 0,
            maxRating: user.maxRating || 0,
            rank: user.rank || 'unrated',
            maxRank: user.maxRank || 'unrated',
            contribution: user.contribution || 0,
            friendOfCount: user.friendOfCount || 0,
            avatar: user.titlePhoto,
            registrationTime: user.registrationTimeSeconds
                ? new Date(user.registrationTimeSeconds * 1000).toISOString()
                : null,
        },
        stats: {
            totalSubmissions: submissions.length,
            problemsSolved: problemsSolved.size,
            contestsParticipated: ratingData.length,
            currentRating: user.rating || 0,
            maxRating: user.maxRating || 0,
        },
        ratingHistory: ratingData,
        tagDistribution: tagCount,
        difficultyDistribution: difficultyCount,
        verdictDistribution: verdictCount,
        languageDistribution: languageCount,
        submissionHeatmap: submissionsByDate,
        fetchedAt: new Date().toISOString(),
    };
}

/**
 * Make a request to the Codeforces API.
 */
async function cfFetch(path) {
    const res = await fetch(`${CF_API}${path}`);
    if (!res.ok) {
        throw new Error(`Codeforces API error: ${res.status}`);
    }
    const data = await res.json();
    if (data.status !== 'OK') {
        throw new Error(`Codeforces API error: ${data.comment || 'Unknown'}`);
    }
    return data.result;
}
