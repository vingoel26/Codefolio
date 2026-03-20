/**
 * Utility to map raw platform tags (e.g. Codeforces problem tags)
 * into high-level macro categories for radar chart skill analysis.
 */

// Define the 5 core macro-categories
export const MACRO_CATEGORIES = [
    'Graph Theory & Trees',
    'Dynamic Programming',
    'Math & Number Theory',
    'Data Structures',
    'Greedy & Constructive'
];

/**
 * Maps a given tag to one or more macro-categories.
 */
export function getMacroCategoriesForTag(tag) {
    const t = tag.toLowerCase().trim();
    const mapping = {
        // Graph Theory & Trees
        'graphs': 'Graph Theory & Trees',
        'trees': 'Graph Theory & Trees',
        'dfs and similar': 'Graph Theory & Trees',
        'shortest paths': 'Graph Theory & Trees',
        'dsu': 'Graph Theory & Trees',
        'graph matchings': 'Graph Theory & Trees',
        '2-sat': 'Graph Theory & Trees',

        // Dynamic Programming
        'dp': 'Dynamic Programming',
        'bitmasks': 'Dynamic Programming',
        'probabilities': 'Dynamic Programming',

        // Math & Number Theory
        'math': 'Math & Number Theory',
        'number theory': 'Math & Number Theory',
        'combinatorics': 'Math & Number Theory',
        'matrices': 'Math & Number Theory',
        'geometry': 'Math & Number Theory',
        'chinese theorem': 'Math & Number Theory',
        'fft': 'Math & Number Theory',

        // Data Structures
        'data structures': 'Data Structures',
        'segment tree': 'Data Structures',
        'strings': 'Data Structures',
        'trees': 'Data Structures',
        'string suffix structures': 'Data Structures',

        // Greedy & Constructive
        'greedy': 'Greedy & Constructive',
        'constructive algorithms': 'Greedy & Constructive',
        'sortings': 'Greedy & Constructive',
        'two pointers': 'Greedy & Constructive',
        'binary search': 'Greedy & Constructive',
        'brute force': 'Greedy & Constructive'
    };

    return mapping[t] ? [mapping[t]] : [];
}

/**
 * Aggregates a raw tag distribution object into normalized macro-category scores.
 * @param {Object} rawDistribution e.g. { dp: 50, math: 20, graphs: 10 }
 * @returns {Array} Formatting suitable for Recharts RadarChart
 */
export function aggregateToMacroCategories(rawDistribution) {
    if (!rawDistribution) return [];

    const scores = {
        'Graph Theory & Trees': 0,
        'Dynamic Programming': 0,
        'Math & Number Theory': 0,
        'Data Structures': 0,
        'Greedy & Constructive': 0
    };

    // Sum up the solves into the buckets
    let totalSolves = 0;

    Object.entries(rawDistribution).forEach(([tag, count]) => {
        const macros = getMacroCategoriesForTag(tag);
        if (macros.length > 0) {
            macros.forEach(macro => {
                scores[macro] += count;
            });
            totalSolves += count;
        }
    });

    if (totalSolves === 0) return []; // No meaningful data

    // Normalize to 0-100 scale for Radar Chart plotting based on the highest category
    const maxScore = Math.max(...Object.values(scores)) || 1;

    return MACRO_CATEGORIES.map(category => ({
        subject: category.replace(' Theory', '').replace(' Programming', '').replace('Algorithms', 'Algo'),
        fullSubject: category,
        rawSolves: scores[category],
        // The radar value is an exaggerated normalized curve so differences look prominent
        normalized: Math.round(Math.pow(scores[category] / maxScore, 0.6) * 100)
    }));
}
