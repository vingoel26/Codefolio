import fs from 'fs';

const BROWSER_UA = 'Mozilla/5.0 (X11; Linux x86_64; rv:120.0) Gecko/20100101 Firefox/120.0';

async function getCodeChefCookie() {
    try {
        const res = await fetch('https://www.codechef.com/', {
            headers: {
                'User-Agent': BROWSER_UA,
                'Accept': 'text/html',
            },
            redirect: 'manual',
        });
        const cookies = [];
        const setCookie = res.headers.getSetCookie?.() || [];
        for (const c of setCookie) {
            const name = c.split(';')[0];
            if (name) cookies.push(name);
        }
        if (cookies.length === 0) {
            const raw = res.headers.get('set-cookie');
            if (raw) {
                for (const part of raw.split(/,\s*(?=[A-Z])/)) {
                    const name = part.split(';')[0];
                    if (name) cookies.push(name);
                }
            }
        }
        return cookies.join('; ') || null;
    } catch {
        return null;
    }
}

async function main() {
    const handle = 'vingw009';
    const cookie = await getCodeChefCookie();
    const headers = {
        'User-Agent': BROWSER_UA,
        'Accept': 'text/html',
        ...(cookie ? { 'Cookie': cookie } : {}),
    };
    const res = await fetch(`https://www.codechef.com/users/${handle}`, { headers });
    const html = await res.text();
    fs.writeFileSync('/tmp/cc_profile.html', html);
    console.log('Saved to /tmp/cc_profile.html, length: ' + html.length);
}
main();
