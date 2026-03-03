/**
 * LeetCode GraphQL API Service — Enhanced
 * Fetches maximum available data using separate queries.
 */

const LC_API = 'https://leetcode.com/graphql';

export async function fetchLeetCodeData(username) {
  const [profileData, contestData, calendarData, recentData, badgeData, contestHistoryData, streakData] = await Promise.all([
    lcQuery(profileQuery, { username }),
    lcQuery(contestQuery, { username }).catch(() => null),
    lcQuery(calendarQuery, { username }).catch(() => null),
    lcQuery(recentQuery, { username, limit: 20 }).catch(() => null),
    lcQuery(badgeQuery, { username }).catch(() => null),
    lcQuery(contestHistoryQuery, { username }).catch(() => null),
    lcQuery(streakQuery, { username }).catch(() => null),
  ]);

  const user = profileData?.matchedUser;
  if (!user) throw new Error(`LeetCode user "${username}" not found`);

  const submitStats = user.submitStatsGlobal?.acSubmissionNum || [];
  const totalSubmissions = user.submitStatsGlobal?.totalSubmissionNum || [];
  const totalSolved = submitStats.find((s) => s.difficulty === 'All')?.count || 0;
  const easySolved = submitStats.find((s) => s.difficulty === 'Easy')?.count || 0;
  const mediumSolved = submitStats.find((s) => s.difficulty === 'Medium')?.count || 0;
  const hardSolved = submitStats.find((s) => s.difficulty === 'Hard')?.count || 0;

  // Acceptance rate
  const totalAcSubmissions = totalSubmissions.find((s) => s.difficulty === 'All')?.submissions || 0;
  const totalAllSubmissions = submitStats.find((s) => s.difficulty === 'All')?.submissions || 0;

  // Submission calendar (heatmap)
  let submissionHeatmap = {};
  const calUser = calendarData?.matchedUser;
  try {
    const calendar = JSON.parse(calUser?.submissionCalendar || '{}');
    for (const [timestamp, count] of Object.entries(calendar)) {
      const date = new Date(parseInt(timestamp) * 1000).toISOString().split('T')[0];
      submissionHeatmap[date] = count;
    }
  } catch { /* ignore */ }

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

  // Contest history
  const contestHistory = (contestHistoryData?.userContestRankingHistory || []).map((c) => ({
    title: c.contest?.title || '',
    startTime: c.contest?.startTime,
    ranking: c.ranking,
    rating: Math.round(c.rating || 0),
    solved: c.problemsSolved || 0,
    totalProblems: c.totalProblems || 0,
  }));

  // Badges
  const badges = (badgeData?.matchedUser?.badges || []).map((b) => ({
    name: b.displayName || b.name,
    icon: b.icon,
    createdAt: b.creationDate,
  }));
  const activeBadge = badgeData?.matchedUser?.activeBadge;

  // Streak
  const streakInfo = streakData?.matchedUser?.userCalendar;

  // Languages from profile
  const languageDistribution = {};
  for (const lang of user.languageProblemCount || []) {
    languageDistribution[lang.languageName] = lang.problemsSolved;
  }

  return {
    profile: {
      username: user.username,
      realName: user.profile?.realName,
      avatar: user.profile?.userAvatar,
      ranking: user.profile?.ranking || 0,
      reputation: user.profile?.reputation || 0,
      company: user.profile?.company || '',
      school: user.profile?.school || '',
      aboutMe: user.profile?.aboutMe || '',
      websites: user.profile?.websites || [],
      countryName: user.profile?.countryName || '',
      skillTags: user.profile?.skillTags || [],
    },
    stats: {
      totalSolved,
      easySolved,
      mediumSolved,
      hardSolved,
      totalSubmissions: totalAcSubmissions,
      activeDays: Object.keys(submissionHeatmap).length,
      streak: parseInt(streakInfo?.streak) || 0,
      totalActiveDays: parseInt(streakInfo?.totalActiveDays) || Object.keys(submissionHeatmap).length,
    },
    contest: contestRanking ? {
      rating: Math.round(contestRanking.rating || 0),
      globalRanking: contestRanking.globalRanking || 0,
      contestsAttended: contestRanking.attendedContestsCount || 0,
      topPercentage: contestRanking.topPercentage ? parseFloat(contestRanking.topPercentage).toFixed(1) : null,
    } : null,
    contestHistory,
    badges,
    activeBadge: activeBadge ? { name: activeBadge.displayName || activeBadge.name, icon: activeBadge.icon } : null,
    tagDistribution,
    languageDistribution,
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
    profile { realName userAvatar ranking reputation company school aboutMe websites countryName skillTags }
    submitStatsGlobal {
      acSubmissionNum { difficulty count submissions }
      totalSubmissionNum { difficulty count submissions }
    }
    tagProblemCounts {
      advanced { tagName problemsSolved }
      intermediate { tagName problemsSolved }
      fundamental { tagName problemsSolved }
    }
    languageProblemCount { languageName problemsSolved }
  }
}`;

const contestQuery = `query userContestRankingInfo($username: String!) {
  userContestRanking(username: $username) {
    attendedContestsCount rating globalRanking topPercentage
  }
}`;

const contestHistoryQuery = `query userContestHistory($username: String!) {
  userContestRankingHistory(username: $username) {
    contest { title startTime }
    ranking rating problemsSolved totalProblems
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

const badgeQuery = `query userBadges($username: String!) {
  matchedUser(username: $username) {
    badges { displayName icon creationDate }
    activeBadge { displayName icon }
  }
}`;

const streakQuery = `query userCalendar($username: String!) {
  matchedUser(username: $username) {
    userCalendar { streak totalActiveDays }
  }
}`;

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
  if (!res.ok) throw new Error(`LeetCode API error: ${res.status}`);
  const data = await res.json();
  if (data.errors) throw new Error(`LeetCode API: ${data.errors[0]?.message || 'Unknown error'}`);
  return data.data;
}
