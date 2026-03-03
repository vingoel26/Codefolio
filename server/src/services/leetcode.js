/**
 * LeetCode GraphQL API Service
 * Uses separate queries to avoid 400 errors from combined queries.
 */

const LC_API = 'https://leetcode.com/graphql';

/**
 * Fetch comprehensive LeetCode data for a username.
 * @param {string} username
 * @returns {Promise<object>}
 */
export async function fetchLeetCodeData(username) {
    // Use separate smaller queries — LeetCode rejects large combined ones
    const [profileData, contestData, calendarData, recentData] = await Promise.all([
        lcQuery(profileQuery, { username }),
        lcQuery(contestQuery, { username }).catch(() => null),
        lcQuery(calendarQuery, { username }).catch(() => null),
        lcQuery(recentQuery, { username, limit: 20 }).catch(() => null),
    ]);

    const user = profileData?.matchedUser;
    if (!user) throw new Error(`LeetCode user "${username}" not found`);

    const submitStats = user.submitStatsGlobal?.acSubmissionNum || [];
    const totalSolved = submitStats.find((s) => s.difficulty === 'All')?.count || 0;
    const easySolved = submitStats.find((s) => s.difficulty === 'Easy')?.count || 0;
    const mediumSolved = submitStats.find((s) => s.difficulty === 'Medium')?.count || 0;
    const hardSolved = submitStats.find((s) => s.difficulty === 'Hard')?.count || 0;

    // Submission calendar (heatmap)
    let submissionHeatmap = {};
    const calUser = calendarData?.matchedUser;
    try {
        const calendar = JSON.parse(calUser?.submissionCalendar || '{}');
        for (const [timestamp, count] of Object.entries(calendar)) {
            const date = new Date(parseInt(timestamp) * 1000).toISOString().split('T')[0];
            submissionHeatmap[date] = count;
        }
    } catch {
        // ignore parse errors
    }

    // Problem tags
    const tagDistribution = {};
    const tagCounts = user.tagProblemCounts;
    if (tagCounts) {
        for (const group of ['advanced', 'intermediate', 'fundamental']) {
            for (const tag of tagCounts[group] || []) {
                tagDistribution[tag.tagName] = tag.problemsSolved;
            }
        }
    }

    // Contest data
    const contestRanking = contestData?.userContestRanking;

    return {
        profile: {
            username: user.username,
            realName: user.profile?.realName,
            avatar: user.profile?.userAvatar,
            ranking: user.profile?.ranking || 0,
            reputation: user.profile?.reputation || 0,
        },
        stats: {
            totalSolved,
            easySolved,
            mediumSolved,
            hardSolved,
            acceptanceRate: '0',
            activeDays: Object.keys(submissionHeatmap).length,
        },
        contest: contestRanking
            ? {
                rating: Math.round(contestRanking.rating || 0),
                globalRanking: contestRanking.globalRanking || 0,
                contestsAttended: contestRanking.attendedContestsCount || 0,
                topPercentage: contestRanking.topPercentage
                    ? parseFloat(contestRanking.topPercentage).toFixed(1)
                    : null,
            }
            : null,
        tagDistribution,
        difficultyDistribution: { Easy: easySolved, Medium: mediumSolved, Hard: hardSolved },
        submissionHeatmap,
        recentSubmissions: (recentData?.recentAcSubmissionList || []).map((s) => ({
            title: s.title,
            titleSlug: s.titleSlug,
            timestamp: s.timestamp,
        })),
        fetchedAt: new Date().toISOString(),
    };
}

// ── Separate small GraphQL queries ──

const profileQuery = `query getUserProfile($username: String!) {
  matchedUser(username: $username) {
    username
    profile { realName userAvatar ranking reputation }
    submitStatsGlobal {
      acSubmissionNum { difficulty count }
    }
    tagProblemCounts {
      advanced { tagName problemsSolved }
      intermediate { tagName problemsSolved }
      fundamental { tagName problemsSolved }
    }
  }
}`;

const contestQuery = `query userContestRankingInfo($username: String!) {
  userContestRanking(username: $username) {
    attendedContestsCount rating globalRanking topPercentage
  }
}`;

const calendarQuery = `query userSubmissionCalendar($username: String!) {
  matchedUser(username: $username) {
    submissionCalendar
  }
}`;

const recentQuery = `query recentAcSubmissions($username: String!, $limit: Int!) {
  recentAcSubmissionList(username: $username, limit: $limit) {
    title titleSlug timestamp
  }
}`;

/**
 * Execute a LeetCode GraphQL query.
 */
async function lcQuery(query, variables) {
    const res = await fetch(LC_API, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Referer': 'https://leetcode.com',
            'Origin': 'https://leetcode.com',
        },
        body: JSON.stringify({ query, variables }),
    });

    if (!res.ok) {
        throw new Error(`LeetCode API error: ${res.status}`);
    }

    const data = await res.json();
    if (data.errors) {
        throw new Error(`LeetCode API: ${data.errors[0]?.message || 'Unknown error'}`);
    }

    return data.data;
}
