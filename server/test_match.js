import { PrismaClient } from '@prisma/client';
import axios from 'axios';

const prisma = new PrismaClient();

async function test() {
    const match = await prisma.battleMatch.findFirst({
        where: { status: 'IN_PROGRESS' },
        include: { players: { include: { user: { include: { linkedAccounts: { where: { platform: 'codeforces' } } } } } } }
    });

    if (!match) {
        console.log("No match IN_PROGRESS");
        return;
    }

    console.log("Match config:", match.problemId, match.problemName);

    const handles = match.players.map(p => {
        const cfAcc = p.user.linkedAccounts[0];
        return { userId: p.userId, handle: cfAcc ? cfAcc.handle : null };
    }).filter(h => h.handle);

    console.log("Handles:", handles);

    const targetProblemIndex = match.problemId.split('-')[1];
    const targetContestId = parseInt(match.problemId.split('-')[0], 10);

    console.log("Matching:", targetContestId, targetProblemIndex);

    for (const h of handles) {
        try {
            const response = await axios.get(`https://codeforces.com/api/user.status?handle=${h.handle}&from=1&count=5`);
            const submissions = response.data.result;
            console.log(`Submissions for ${h.handle}:`, submissions.map(s => `${s.problem.contestId}-${s.problem.index} (${s.verdict})`));

            const targetSubs = submissions.filter(sub =>
                sub.problem.contestId === targetContestId &&
                sub.problem.index === targetProblemIndex
            );
            console.log(`Matched for ${h.handle}:`, targetSubs.length);
        } catch (e) {
            console.log(`Error for ${h.handle}:`, e.message);
        }
    }
}
test();
