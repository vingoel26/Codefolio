import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function test() {
    const match = await prisma.battleMatch.findUnique({
        where: { id: '5e35cfa1-f428-42f4-9685-eb8a62c41d86' }
    });
    console.log("Specific match:", match);
}
test();
