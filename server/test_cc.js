import { fetchCodeChefData } from './src/services/codechef.js';

async function main() {
    console.log('=== Testing CodeChef ===');
    try {
        const cc = await fetchCodeChefData('vingw009');
        console.log('Profile:', JSON.stringify(cc.profile, null, 2));
        console.log('Stats:', JSON.stringify(cc.stats, null, 2));
    } catch (e) {
        console.error('CodeChef ERROR:', e.message);
    }
}

main();
