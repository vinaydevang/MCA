// import { test, expect } from '@playwright/test';

// test.use({
//   // Apply stealth at test level
//   contextOptions: {
//     bypassCSP: true,
//   }
// });

// test('MCA Portal Login - Maximum Stealth', async ({ page, context }) => {
//   console.log('Starting test with maximum stealth...');

//   // Inject stealth scripts
//   await context.addInitScript(() => {
//     Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
//     Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3, 4, 5] });
//     Object.defineProperty(navigator, 'languages', { get: () => ['en-US', 'en'] });

//     (window as any).chrome = { runtime: {} };

//     const originalQuery = window.navigator.permissions.query;
//     window.navigator.permissions.query = (parameters: any) =>
//       Promise.resolve({ state: 'prompt' } as PermissionStatus);
//   });

//   await test.step('Navigate Very Slowly', async () => {
//     console.log('Navigating...');
//     await page.goto('https://www.mca.gov.in/content/mca/global/en/home.html', {
//       waitUntil: 'networkidle',
//       timeout: 60000
//     });

//     console.log('Page loaded. Simulating human reading...');
//     // Simulate human reading the page
//     await page.waitForTimeout(8000);

//     // Random scrolling
//     await page.mouse.wheel(0, 300);
//     await page.waitForTimeout(2000);
//     await page.mouse.wheel(0, -100);
//     await page.waitForTimeout(1500);
//   });

//   await test.step('Very Slow Click', async () => {
//     const signInLink = page.getByRole('link', { name: /Sign In/i }).first();

//     if (await signInLink.isVisible()) {
//       console.log('Moving to Sign In...');

//       // Get element position
//       const box = await signInLink.boundingBox();
//       if (box) {
//         // Move mouse slowly to element
//         const targetX = box.x + box.width / 2;
//         const targetY = box.y + box.height / 2;

//         // Gradual movement
//         for (let i = 0; i < 10; i++) {
//           await page.mouse.move(
//             targetX * (i / 10) + Math.random() * 5,
//             targetY * (i / 10) + Math.random() * 5
//           );
//           await page.waitForTimeout(50 + Math.random() * 50);
//         }
//       }

//       await page.waitForTimeout(1500);
//       console.log('Clicking...');
//       await signInLink.click({ delay: 150 });

//       console.log('Clicked. Waiting...');
//       await page.waitForTimeout(4000);
//     }
//   });

//   await test.step('Final Check', async () => {
//     // Wait even longer
//     await page.waitForTimeout(8000);

//     const url = page.url();
//     console.log('Final URL: ' + url);

//     if (url.includes('home.html') && !url.includes('login')) {
//       console.error('❌ FAILED: Redirected back');
//       await page.screenshot({ path: 'failed.png', fullPage: true });
//     } else {
//       console.log('✅ SUCCESS: On login page!');

//       const userId = page.locator('#userId').first();
//       if (await userId.isVisible({ timeout: 5000 }).catch(() => false)) {
//         await userId.click({ delay: 100 });
//         await page.keyboard.type('DEMO_USER', { delay: 120 });
//         console.log('✅ Successfully filled user ID!');
//       }
//     }
//   });

//   console.log('\n=== Pausing for inspection ===');
//   await page.pause();
// });


import { test, chromium, Page, Browser, Frame } from '@playwright/test';
import * as fs from 'fs';

test('MCA Login - Ultimate Extraction & Guaranteed Entry', async () => {
    // 1. API Key & Connection
    const apiKey = '46cae368af0151f0198e86d465a0f801a8f09ed6';
    const connectionURL = `wss://browser.zenrows.com?apikey=${apiKey}&proxy_country=in`;

    const traceLog = (msg: string) => {
        const timestamp = new Date().toISOString();
        fs.appendFileSync('captcha_trace.log', `[${timestamp}] ${msg}\n`);
        console.log(msg);
    };

    traceLog('=== TEST START ===');
    const browser: Browser = await chromium.connectOverCDP(connectionURL);
    const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page: Page = await context.newPage();

    try {
        traceLog('Step 1: Navigating to MCA Login...');
        await page.goto('https://www.mca.gov.in/content/mca/global/en/foportal/fologin.html', {
            waitUntil: 'networkidle',
            timeout: 90000
        });

        // 2. Guaranteed Frame Hunt
        let loginFrame: Frame | null = null;
        const userSelector = 'input[id*="user" i], input[name*="user" i], input[id*="Name" i]';

        traceLog('🔍 Searching for active Login Form inside frames...');
        for (let i = 0; i < 15; i++) {
            const allFrames = page.frames();
            for (const frame of allFrames) {
                try {
                    const isVisible = await frame.locator(userSelector).first().isVisible();
                    if (isVisible) {
                        loginFrame = frame;
                        break;
                    }
                } catch (e) { continue; }
            }
            if (loginFrame) break;
            await page.waitForTimeout(3000);
        }

        if (!loginFrame) throw new Error('❌ FAILED: Login frame not found.');
        traceLog(`✅ Target Frame found: ${loginFrame.url().substring(0, 50)}...`);

        // 3. Fill Credentials
        traceLog('⌨️ Entering Username and Password...');
        await loginFrame.locator(userSelector).first().fill('kevinraj20@gmail.com');
        await loginFrame.locator('input[type="password"]').first().fill('TbT@629002');

        // 4. Enhanced CAPTCHA Extraction
        traceLog('📸 Detecting CAPTCHA...');
        const captchaTarget = loginFrame.locator('#captchaCanvas, canvas[id*="captcha" i], img[src*="captcha" i]').first();
        const captchaInput = loginFrame.locator('input[id*="captcha" i], input[placeholder*="letters" i]').first();

        if (await captchaTarget.isVisible()) {
            // High-Resolution Browser-side Processing
            const base64Data = await captchaTarget.evaluate((el: HTMLElement) => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                if (!ctx) return null;

                const w = (el as any).naturalWidth || (el as any).width || el.clientWidth;
                const h = (el as any).naturalHeight || (el as any).height || el.clientHeight;

                // Scale up 2x for OCR clarity
                canvas.width = w * 2;
                canvas.height = h * 2;
                ctx.fillStyle = 'white';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(el as any, 0, 0, canvas.width, canvas.height);

                return canvas.toDataURL('image/png');
            });

            if (base64Data) {
                const snapshotPath = 'captcha_snapshot.png';
                const base64Image = base64Data.replace(/^data:image\/\w+;base64,/, "");
                fs.writeFileSync(snapshotPath, base64Image, 'base64');

                // 5. Specialized OCR
                traceLog('🤖 Running OCR...');
                const { createWorker } = require('tesseract.js');
                const worker = await createWorker('eng');
                await worker.setParameters({
                    tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
                });
                const { data: { text, confidence } } = await worker.recognize(snapshotPath);
                await worker.terminate();

                const cleanText = text.trim().replace(/\s/g, '');
                traceLog(`🧩 CAPTCHA Solved: "${cleanText}" (Confidence: ${confidence}%)`);

                if (cleanText.length >= 4) {
                    await captchaInput.fill(cleanText);
                    
                    traceLog('🚀 Clicking Sign In...');
                    const submitBtn = loginFrame.locator('input[type="submit"], button[type="submit"], #login-btn').first();
                    await submitBtn.click();

                    // 6. Verification
                    try {
                        await page.waitForURL('**/foportal/fodashboard.html', { timeout: 30000 });
                        traceLog('🎉 SUCCESS: Dashboard reached!');
                    } catch (e) {
                        traceLog('⚠️ Navigation failed. CAPTCHA might have been wrong.');
                        await page.screenshot({ path: 'login_failed.png' });
                    }
                }
            }
        } else {
            traceLog('❌ CAPTCHA element not visible.');
        }

    } catch (error: any) {
        traceLog(`❌ FATAL ERROR: ${error.message}`);
        await page.screenshot({ path: 'fatal_error.png' });
    } finally {
        await browser.close();
        traceLog('=== TEST END ===');
    }
});