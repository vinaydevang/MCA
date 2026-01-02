import { test, chromium, expect } from '@playwright/test';

test('MCA Login with Bright Data Proxy', async () => {
  // 1. Configure the Proxy Object
  const proxyConfig = {
    server: 'http://brd.superproxy.io:33335',
    username: 'brd-customer-hl_57191b85-zone-turia_zone',
    password: 'wpl7g93f9bsb'
  };

  // 2. Launch Chrome (Fixed Viewport Issue)
  const context = await chromium.launchPersistentContext('C:/mca-automation', {
    headless: false,
    // FIX: Replaced 'null' with explicit dimensions to stop the crash
    viewport: { width: 1920, height: 1080 }, 
    proxy: proxyConfig, 
    args: [
      '--disable-blink-features=AutomationControlled', 
      '--start-maximized' 
    ]
  });

  const page = context.pages()[0] || await context.newPage();

  console.log('Navigating to MCA via Proxy...');
  await page.goto('https://www.mca.gov.in/content/mca/global/en/home.html');

  // 3. Optional: Verify Proxy IP (Uncomment to debug)
  // await page.goto('https://api.ipify.org');
  // const ip = await page.innerText('body');
  // console.log(`Connected via IP: ${ip}`);
  // await page.goto('https://www.mca.gov.in/content/mca/global/en/home.html');

  // 4. Click Sign In
  const signInLink = page.getByRole('link', { name: /Sign In\s?\/\s?Sign Up/i }).first();
  await signInLink.waitFor({ state: 'visible' });
  await signInLink.click();

  console.log('Browser is open. Please log in manually.');
  
  // Keeps the browser open indefinitely so you can work
  await page.pause();
});