
// import { test, chromium } from '@playwright/test';

// test('MCA Portal - CDP Connection', async () => {
//     console.log('Attempting to connect to Chrome at http://localhost:9222...');

//     let browser;
//     try {
//         browser = await chromium.connectOverCDP('http://localhost:9222');
//     } catch (e) {
//         console.error('FAILED to connect. Make sure you started Chrome with:');
//         console.error('& "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe" --remote-debugging-port=9222 --user-data-dir="C:\\chrome-debug"');
//         throw e;
//     }

//     console.log('Connected! Finding the Message Center/MCA tab...');

//     // Find the right context and page
//     const context = browser.contexts()[0];
//     let page = context.pages().find(p => p.url().includes('mca.gov.in'));

//     if (!page) {
//         console.log('MCA tab not found. Using the first available tab and navigating...');
//         page = context.pages()[0];
//         if (!page) {
//             page = await context.newPage();
//         }
//         await page.goto('https://www.mca.gov.in/content/mca/global/en/home.html');
//     } else {
//         try {
//             console.log(`Found existing MCA tab. Title: "${await page.title()}"`);
//             await page.bringToFront();
//         } catch (e) {
//             console.log('Could not get title or bring to front (page might be reloading), but proceeding with page handle...');
//         }
//     }

//     console.log('\n=== MANUAL INTERVENTION REQUIRED ===');
//     console.log('Please log in manually in the opened Chrome window if you haven\'t already.');
//     console.log('This script will wait until it detects a post-login state (e.g., "Signout" or Dashboard).');
//     console.log('====================================\n');

//     // Wait for a sign of successful login. 
//     // Adjust selector based on what appears after login.
//     // Common indicators: "Logout", "Sign Out", or a user profile icon.
//     // For now, we'll poll for "Sign Out" or similar text.

//     try {
//         await page.waitForFunction(() => {
//             const bodyText = document.body.innerText;
//             return bodyText.includes('Sign Out') || bodyText.includes('Logout') || bodyText.includes('Welcome');
//         }, { timeout: 300000 }); // Wait up to 5 minutes for user to login

//         console.log('✅ Login detected! Proceeding with automation...');

//         // Example post-login action: Log cookies
//         const cookies = await context.cookies();
//         console.log(`Captured ${cookies.length} cookies. Session is active.`);

//         // Here you would add the logic to scrape data or call APIs
//         // ...

//     } catch (e) {
//         console.log('Timed out waiting for login (or detection failed).');
//         console.log('Capture screenshot to debug...');
//         await page.screenshot({ path: 'cdp_login_debug.png' });

//         // Log some text to help identify the right selector
//         const text = await page.evaluate(() => document.body.innerText.slice(0, 500));
//         console.log('Page Text Snapshot (First 500 chars):\n' + text);
//     }

//     console.log('Disconnecting CDP session (Browser remains open)...');
//     await browser.close();
// });
