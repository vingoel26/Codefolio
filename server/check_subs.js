import axios from 'axios';
async function test() {
    try {
        const response = await axios.get(`https://codeforces.com/api/user.status?handle=frvingw009&from=1&count=20`);
        const submissions = response.data.result;
        console.log(`Submissions for frvingw009:`, submissions.map(s => `${s.id}: ${s.problem.contestId}-${s.problem.index} (${s.verdict}) @ ${new Date(s.creationTimeSeconds * 1000).toISOString()}`));
    } catch (e) {
        console.log("Error:", e.message);
    }
}
test();
