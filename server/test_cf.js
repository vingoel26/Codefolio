import axios from 'axios';
async function test() {
    try {
        const res = await axios.get('https://codeforces.com/api/user.status?handle=tourist&from=1&count=2');
        console.log(JSON.stringify(res.data.result, null, 2));
    } catch (e) {
        console.log(e.message);
    }
}
test();
