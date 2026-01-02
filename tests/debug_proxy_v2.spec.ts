import { test, chromium } from '@playwright/test';

test('Debug Proxy Connectivity', async () => {
    const sessionId = (Math.random() * 10000).toFixed(0);
    const proxyOptions = {
        server: 'http://brd.superproxy.io:33335',
        username: `brd-customer-hl_57191b85-zone-turia_zone-session-s${sessionId}`,
        password: 'wpl7g93f9bsb'
    };

    console.log(`Testing Proxy with Session: s${sessionId}`);

    const browser = await chromium.launch({
        proxy: proxyOptions,
        headless: true
    });

    const context = await browser.newContext({ ignoreHTTPSErrors: true });
    const page = await context.newPage();

    try {
        console.log('Navigating to api.ipify.org...');
        await page.goto('https://api.ipify.org?format=json', { timeout: 30000 });
        const content = await page.textContent('body');
        console.log('Proxy connection successful!');
        console.log('Detected IP:', content);
    } catch (e) {
        console.log('Proxy connection failed to api.ipify.org');
        console.log('Error:', e.message);
    } finally {
        await browser.close();
    }
});
