import { PrismaClient } from '@prisma/client';
import axios from 'axios';

const prisma = new PrismaClient();

// In-memory store of active polling intervals: matchId -> NodeJS.Timeout
const activePolls = new Map();

export const registerBattleHandlers = (io, socket) => {
    const userId = socket.user.id;
    const username = socket.user.username;

    // Join a battle room
    socket.on('battle:join', async (payload) => {
        try {
            const matchId = typeof payload === 'string' ? payload : payload.matchId;
            const cfHandle = typeof payload === 'string' ? null : payload.cfHandle;

            const match = await prisma.battleMatch.findUnique({
                where: { id: matchId },
                include: { players: { include: { user: { include: { linkedAccounts: { where: { platform: 'codeforces' } } } } } } }
            });

            if (!match) return socket.emit('battle:error', 'Match not found');

            // Find or create player
            let player = match.players.find(p => p.userId === userId);

            if (!player) {
                if (match.players.length >= 2) {
                    // Room is full, just join as spectator
                    socket.join(`battle_${matchId}`);
                    socket.join(match.conversationId);
                    socket.emit('battle:spectator', { message: 'Room full, spectating mode' });
                    return;
                }

                // Add as player
                player = await prisma.battlePlayer.create({
                    data: { matchId, userId, cfHandle },
                    include: { user: true }
                });

                // Update local match object
                match.players.push(player);
                io.to(`battle_${matchId}`).emit('battle:playerJoined', player);
            }

            socket.join(`battle_${matchId}`);
            socket.join(match.conversationId);

            // Send current state to the user joining
            socket.emit('battle:state', match);

            // If 2 players are now present and status is WAITING, start the match
            if (match.players.length === 2 && match.status === 'WAITING') {
                await startMatch(matchId, io);
            } else if (match.status === 'IN_PROGRESS' && !activePolls.has(matchId)) {
                // Server must have restarted; resume polling from DB state without resetting startTime
                const handles = match.players.map(p => {
                    if (p.cfHandle) return { userId: p.userId, handle: p.cfHandle };
                    const cfAcc = p.user.linkedAccounts.find(a => a.platform === 'codeforces' && a.isPrimary) ||
                        p.user.linkedAccounts.find(a => a.platform === 'codeforces');
                    return { userId: p.userId, handle: cfAcc ? cfAcc.handle : null };
                }).filter(h => h.handle);

                if (handles.length > 0) {
                    const pollInterval = setInterval(() => pollMatchStatus(match, handles, io, pollInterval), 15000);
                    activePolls.set(matchId, pollInterval);
                }
            }

        } catch (error) {
            console.error('[Socket] battle:join error', error);
            socket.emit('battle:error', 'Failed to join battle');
        }
    });

    // Spectate only without joining as player
    socket.on('battle:spectate', async (matchId) => {
        try {
            const match = await prisma.battleMatch.findUnique({ where: { id: matchId } });
            if (!match) return socket.emit('battle:error', 'Match not found');

            socket.join(`battle_${matchId}`);
            socket.join(match.conversationId);
            socket.emit('battle:state', match);
        } catch (error) {
            socket.emit('battle:error', 'Failed to spectate');
        }
    });
};

async function startMatch(matchId, io) {


    // Update match to IN_PROGRESS
    const match = await prisma.battleMatch.update({
        where: { id: matchId },
        data: {
            status: 'IN_PROGRESS',
            startTime: new Date()
        },
        include: { players: { include: { user: { include: { linkedAccounts: { where: { platform: 'codeforces' } } } } } } }
    });

    io.to(`battle_${matchId}`).emit('battle:started', match);

    // Start polling Codeforces for the players
    // Extract CF handles (use the explicit cfHandle if available, else fallback to linked account)
    const handles = match.players.map(p => {
        if (p.cfHandle) return { userId: p.userId, handle: p.cfHandle };

        const cfAcc = p.user.linkedAccounts.find(a => a.platform === 'codeforces' && a.isPrimary) ||
            p.user.linkedAccounts.find(a => a.platform === 'codeforces');
        return { userId: p.userId, handle: cfAcc ? cfAcc.handle : null };
    }).filter(h => h.handle);

    if (handles.length === 0) {
        console.warn(`[Battle] No CF handles for Match ${matchId}. Cannot poll.`);
        return;
    }

    const pollInterval = setInterval(() => pollMatchStatus(match, handles, io, pollInterval), 15000); // Poll every 15s
    activePolls.set(matchId, pollInterval);
}

async function pollMatchStatus(match, handles, io, intervalTimer) {
    try {
        const targetProblemIndex = match.problemId.split('-')[1]; // '1512-A' -> 'A'
        const targetContestId = parseInt(match.problemId.split('-')[0], 10);

        for (const h of handles) {
            // Append a timestamp to crack the Codeforces API CDN cache
            const response = await axios.get(`https://codeforces.com/api/user.status?handle=${h.handle}&from=1&count=5&_t=${Date.now()}`);
            if (response.data.status !== 'OK') continue;

            const submissions = response.data.result;

            // Look for submissions for the exact problem
            const targetSubs = submissions.filter(sub =>
                sub.problem.contestId === targetContestId &&
                sub.problem.index === targetProblemIndex
            );

            if (targetSubs.length > 0) {
                // Determine if they got an AC
                const hasAC = targetSubs.some(sub => sub.verdict === 'OK');

                // Broadcast their latest submission status to the room for flavor
                const latest = targetSubs[0];
                io.to(`battle_${match.id}`).emit('battle:submission', {
                    userId: h.userId,
                    verdict: latest.verdict,
                    testset: latest.testset,
                    passedTestCount: latest.passedTestCount
                });

                if (hasAC) {
                    // Win condition met!
                    await declareWinner(match.id, h.userId, io, intervalTimer);
                    return; // Stop processing other handles since match is over
                }
            }
        }
    } catch (error) {
        console.error(`[Battle] Error polling CF for match ${match.id}:`, error.message);
    }
}

async function declareWinner(matchId, winnerId, io, intervalTimer) {


    // Stop polling
    clearInterval(intervalTimer);
    activePolls.delete(matchId);

    // Update DB
    const match = await prisma.battleMatch.update({
        where: { id: matchId },
        data: {
            status: 'COMPLETED',
            winnerId,
            endTime: new Date()
        },
        include: { players: { include: { user: true } } }
    });

    // Broadcast win
    io.to(`battle_${matchId}`).emit('battle:completed', match);
}
