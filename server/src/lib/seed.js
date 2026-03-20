import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export const seedDatabase = async () => {
    console.log('[Seed] Starting database seed...');

    // 1. Create global channels
    const channels = [
        { name: 'General', slug: 'general', type: 'channel' },
        { name: 'LeetCode', slug: 'leetcode', type: 'channel' },
        { name: 'Codeforces', slug: 'codeforces', type: 'channel' },
        { name: 'CodeChef', slug: 'codechef', type: 'channel' },
        { name: 'GeeksforGeeks', slug: 'gfg', type: 'channel' },
    ];

    for (const channel of channels) {
        await prisma.conversation.upsert({
            where: { slug: channel.slug },
            update: {},
            create: channel,
        });
    }
    console.log(`[Seed] Seeded ${channels.length} global channels.`);

    // 2. Create test users
    const passwordHash = await bcrypt.hash('password123', 10);
    const user1 = await prisma.user.upsert({
        where: { email: 'demo@codestat.dev' },
        update: {},
        create: {
            email: 'demo@codestat.dev',
            username: 'vingw009',
            displayName: 'Dev User',
            passwordHash,
            bio: 'Competitive programming enthusiast and Codefolio developer.',
        },
    });

    const user2 = await prisma.user.upsert({
        where: { email: 'friend@codestat.dev' },
        update: {},
        create: {
            email: 'friend@codestat.dev',
            username: 'dev_friend',
            displayName: 'Coding Buddy',
            passwordHash,
            bio: 'Always down for a 1v1 battle.',
        },
    });
    console.log(`[Seed] Seeded test users: ${user1.username}, ${user2.username}`);

    // 3. Create mutual follows
    await prisma.follows.upsert({
        where: { followerId_followingId: { followerId: user1.id, followingId: user2.id } },
        update: {},
        create: { followerId: user1.id, followingId: user2.id },
    });
    await prisma.follows.upsert({
        where: { followerId_followingId: { followerId: user2.id, followingId: user1.id } },
        update: {},
        create: { followerId: user2.id, followingId: user1.id },
    });
    console.log(`[Seed] Established mutual follows.`);

    console.log('[Seed] Database seed complete.');
};
