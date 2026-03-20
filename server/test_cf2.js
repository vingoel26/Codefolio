import axios from 'axios';
async function test() {
    try {
        const response = await axios.get(`https://codeforces.com/api/user.status?handle=tourist&from=1&count=1&_t=${Date.now()}`);
        console.log("Status:", response.status);
    } catch (e) {
        console.log("Error:", e.message);
    }
}
test();
