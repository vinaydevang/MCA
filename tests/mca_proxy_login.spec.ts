// import { test, chromium } from '@playwright/test';

// test('MCA Login with Bright Data Proxy', async () => {
//     // Credentials
//     const mcaUsername = 'your_mca_username'; // REPLACE THIS WITH ACTUAL USERNAME
//     const mcaPassword = 'your_mca_password'; // REPLACE THIS WITH ACTUAL PASSWORD

//     // Generate a random session ID for IP rotation
//     const sessionId = (Math.random() * 10000).toFixed(0);

//     // Proxy Configuration
//     const proxyOptions = {
//         server: 'http://brd.superproxy.io:33335',
//         // Appending -country-in to force India-based IPs if the zone supports it
//         username: `brd-customer-hl_57191b85-zone-turia_zone-session-s${sessionId}-country-in`,
//         password: 'wpl7g93f9bsb'
//     };

//     console.log(`Launching browser with Proxy (Session: s${sessionId}, Country: IN)...`);
//     console.log(`Using Proxy: ${proxyOptions.server}`);
//     console.log(`Username: ${proxyOptions.username}`);

//     const browser = await chromium.launch({
//         headless: false,
//         proxy: proxyOptions,
//         args: [
//             '--disable-blink-features=AutomationControlled',
//             '--no-sandbox',
//             '--start-maximized'
//         ]
//     });

//     const context = await browser.newContext({
//         viewport: { width: 1920, height: 1080 },
//         ignoreHTTPSErrors: true
//     });

//     const page = await context.newPage();

//     console.log('Navigating to MCA Homepage (with retries)...');
//     const maxRetries = 3;
//     let success = false;
//     for (let i = 0; i < maxRetries; i++) {
//         try {
//             console.log(`Attempt ${i + 1} of ${maxRetries}...`);
//             await page.goto('https://www.mca.gov.in/content/mca/global/en/home.html', {
//                 timeout: 90000,
//                 waitUntil: 'domcontentloaded'
//             });
//             console.log('Reached MCA Homepage.');
//             success = true;
//             break;
//         } catch (error: any) {
//             console.log(`Attempt ${i + 1} failed: ${error.message}`);
//             try {
//                 await page.screenshot({ path: `nav_failure_attempt_${i + 1}.png` });
//             } catch (screenshotError) {
//                 console.log('Could not take screenshot (page might be closed).');
//             }
//             if (i < maxRetries - 1) {
//                 console.log('Waiting 5 seconds before retry...');
//                 await page.waitForTimeout(5000);
//             }
//         }
//     }

//     if (!success) {
//         console.log('Could not reach MCA Homepage after multiple attempts.');
//         // Optionally, you might want to exit the test here if navigation is critical
//         // test.fail('Failed to navigate to MCA Homepage after multiple attempts.');
//     } else {
//         // Click My Workspace only if navigation was successful
//         console.log('Clicking "My Workspace" to trigger login...');
//         try {
//             await page.click('a:has-text("My Workspace")');
//         } catch (error) {
//             console.log('Clicking "My Workspace" failed.');
//             await page.screenshot({ path: 'my_workspace_click_error.png' });
//         }
//     }

//     // Wait for Login Form
//     console.log('Waiting for login form to load...');
//     try {
//         // Wait for the specific MCA v3 login fields
//         const usernameField = page.locator('#userName, input[name="userName"], input[placeholder*="User"]');
//         await usernameField.first().waitFor({ state: 'visible', timeout: 30000 });

//         // Automated Entry
//         console.log('Found login fields. Entering credentials...');
//         await usernameField.first().fill(mcaUsername);

//         const passwordField = page.locator('#password, input[name="password"], input[type="password"]');
//         await passwordField.first().fill(mcaPassword);

//         console.log('Credentials entered successfully.');
//         console.log('--------------------------------------------------');
//         console.log('MANUAL ACTION REQUIRED:');
//         console.log('1. Enter the CAPTCHA code manually.');
//         console.log('2. Click the "Sign In" button.');
//         console.log('--------------------------------------------------');
//     } catch (e) {
//         await page.screenshot({ path: 'login_fields_failure.png' });
//         console.log('ERROR: Could not find login fields automatically.');
//         console.log('Please check if the page loaded correctly or if "Sign In" was clicked.');
//     }

//     // Wait for login to complete (Sign Out button appears)
//     try {
//         await page.waitForFunction(() => {
//             const bodyText = document.body.innerText;
//             return bodyText.includes('Sign Out') || bodyText.includes('Logout') || bodyText.includes('Welcome');
//         }, { timeout: 300000 }); // 5 minutes for manual CAPTCHA + Login

//         console.log('Login detected! Navigating to MCA Services...');

//         // Navigate to MCA Services
//         const mcaServices = page.locator('a[title="MCA Services"]');
//         await mcaServices.waitFor({ state: 'visible' });
//         await mcaServices.click();

//         console.log('Successfully navigated to MCA Services!');
//     } catch (e) {
//         console.log('Waiting for login timed out or failed.');
//     }

//     console.log('Automation paused.');
//     await page.pause();
// });

import { test, expect, chromium, Page, Browser, Locator } from '@playwright/test';
import * as fs from 'fs';
import { createWorker, PSM } from 'tesseract.js';
import { Jimp } from 'jimp';

/**
 * Global helper for logging to both console and a file
 */
function traceLog(msg: string) {
    const ts = new Date().toISOString();
    try {
        fs.appendFileSync('captcha_trace.log', `[${ts}] ${msg}\n`);
    } catch { }
    console.log(msg);
}

/**
 * Clean OCR text by fixing common character recognition mistakes
 */
function cleanOCRText(text: string): string {
    return text
        .replace(/[^A-Za-z0-9]/g, '')  // Remove non-alphanumeric (keep case)
        .trim();
}

/**
 * Enhanced helper function to extract CAPTCHA text using Tesseract OCR
 * Includes image preprocessing, multiple PSM modes, and debug saving
 * @param captchaLocator - Playwright Locator for the CAPTCHA element (canvas/img)
 * @param attempt - Attempt number for logging purposes
 * @returns Object containing the recognized text and confidence score
 */
/**
 * Enhanced helper function to extract CAPTCHA text using Tesseract OCR
 * Includes multi-threshold preprocessing, sharpening, and PSM mode testing
 */
async function getCaptchaText(
    captchaLocator: Locator,
    attempt: number
): Promise<{ text: string; confidence: number }> {
    try {
        // 1. Capture the CAPTCHA image
        const captchaBuffer = await captchaLocator.screenshot({
            type: 'png',
            timeout: 20000
        }).catch(async (e) => {
            traceLog(`⚠️ Screenshot fails: ${e.message}. Retrying via parent...`);
            const handle = await captchaLocator.elementHandle();
            return await handle?.screenshot({ type: 'png' }) as Buffer;
        });

        if (!captchaBuffer) throw new Error('Failed to capture CAPTCHA buffer');
        fs.writeFileSync(`debug_captcha_${attempt}_original.png`, captchaBuffer);

        // 2. Load base image with Jimp
        const baseImage = await Jimp.read(captchaBuffer);
        // Upscale 2x
        baseImage.resize({ w: baseImage.bitmap.width * 2, h: baseImage.bitmap.height * 2 });

        // We will try multiple threshold levels and pick the one with highest confidence
        const thresholdLevels = [110, 128, 150];
        let overallBest = { text: '', confidence: 0 };

        for (const thresh of thresholdLevels) {
            const image = baseImage.clone();

            // Apply preprocessing chain
            image
                .greyscale()
                .contrast(0.6)
                .convolute([[0, -1, 0], [-1, 5, -1], [0, -1, 0]]) // Simple Sharpening kernel
                .threshold({ max: thresh });

            const processedBuffer = await image.getBuffer('image/png' as any);
            const processedPath = `debug_captcha_${attempt}_thresh_${thresh}.png`;
            await image.write(processedPath as `${string}.${string}`);

            // Pick PSM modes to test
            const psmModes = [
                { mode: PSM.SINGLE_LINE, name: 'SINGLE_LINE' },
                { mode: PSM.SINGLE_WORD, name: 'SINGLE_WORD' }
            ];

            for (const { mode, name } of psmModes) {
                // To avoid initialization warnings, we pass OCR Engine Mode (OEM) during creation
                // OEM 1 = LSTM
                const worker = await createWorker('eng', 1);

                await worker.setParameters({
                    tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
                    tessedit_pageseg_mode: mode as any,
                });

                const { data: { text, confidence } } = await worker.recognize(processedBuffer);
                await worker.terminate();

                const cleanedText = cleanOCRText(text);
                traceLog(`  [Thresh ${thresh}] PSM ${name}: "${cleanedText}" (conf: ${confidence.toFixed(1)}%)`);

                if (confidence > overallBest.confidence && cleanedText.length >= 4) {
                    overallBest = { text: cleanedText, confidence };
                }
            }
        }

        traceLog(`🧩 Best result for attempt ${attempt}: "${overallBest.text}" (conf: ${overallBest.confidence.toFixed(1)}%)`);
        return overallBest;

    } catch (error: any) {
        traceLog(`🚨 OCR failed on attempt ${attempt}: ${error.message}`);
        return { text: '', confidence: 0 };
    }
}

test('MCA Login via ZenRows Cloud – auto‑solve CAPTCHA', async () => {
    // Increase test timeout to 8 minutes for slow network + OCR processing
    test.setTimeout(480000);

    const apiKey = '498c1cf2f2b3e48b43f649e3d81ffdbb449dc731';
    const connectionURL = `wss://browser.zenrows.com?apikey=${apiKey}&proxy_country=in`;

    // ---------- helpers ----------
    const takeScreenshot = async (name: string, page: Page) => {
        try {
            await page.screenshot({
                path: `step_${name}.png`,
                fullPage: false,
                timeout: 60000,
            });
            traceLog(`📸 Screenshot: step_${name}.png`);
        } catch (e: any) {
            traceLog(`⚠️ Screenshot failed: ${e.message}`);
        }
    };

    try {
        // ---------- launch ----------
        traceLog(`Connecting to ZenRows CDP: ${connectionURL.split('?')[0]}...`);
        const browser: Browser = await chromium.connectOverCDP(connectionURL);

        browser.on('disconnected', () => {
            traceLog('❌ BROWSER DISCONNECTED unexpectedly');
        });

        const context = (await browser.contexts())[0] || await browser.newContext();
        const page: Page = await context.newPage();

        // Quick health check
        try {
            await page.evaluate(() => window.location.href);
            traceLog('✅ Connection health check passed (browser is responsive)');
        } catch (e: any) {
            traceLog(`❌ Connection health check FAILED: ${e.message}`);
            throw e;
        }

        // ---------- navigation ----------
        fs.writeFileSync('captcha_trace.log', '=== TEST START ===\n');

        const loginUrl = 'https://www.mca.gov.in/content/mca/global/en/foportal/fologin.html';
        let navigationSuccess = false;

        for (let attempt = 1; attempt <= 3; attempt++) {
            try {
                traceLog(`🚀 Navigation attempt ${attempt} to Login...`);
                await page.goto(loginUrl, {
                    waitUntil: 'domcontentloaded',
                    timeout: 120000
                });

                traceLog('⏳ Waiting for DOM to stabilize (10s)...');
                await page.waitForTimeout(10000);

                // Wait for any input to appear (handles slow dynamic loading)
                try {
                    traceLog('⌛ Waiting for any input field to appear in any frame...');
                    await page.waitForFunction(() => {
                        const allFrames = Array.from(window.frames);
                        for (const f of allFrames) {
                            try {
                                if (f.document.querySelector('input:not([type="hidden"])')) return true;
                            } catch (e) { }
                        }
                        return !!document.querySelector('input:not([type="hidden"])');
                    }, { timeout: 30000 });
                } catch (e) {
                    traceLog('⚠️ No inputs appeared within 30s wait.');
                }

                // Wait for overlays/spinners to vanish
                try {
                    traceLog('⌛ Checking for loading overlays...');
                    await page.waitForFunction(() => {
                        const loaders = document.querySelectorAll('.loader, .spinner, [class*="loading" i], [id*="loading" i]');
                        for (const l of Array.from(loaders)) {
                            try {
                                const style = window.getComputedStyle(l);
                                if (style.display !== 'none' && style.visibility !== 'hidden' && (l as HTMLElement).offsetHeight > 0) return false;
                            } catch { }
                        }
                        return true;
                    }, { timeout: 20000 });
                    traceLog('✅ No visible loaders found.');
                } catch (overlayErr) {
                    traceLog('⚠️ Spinner still present or timeout, proceeding anyway...');
                }

                // Validate if we can see any frame with input fields
                const framesToCheck = page.frames();
                traceLog(`🔍 Total frames detected: ${framesToCheck.length}`);

                let found = false;
                for (let idx = 0; idx < framesToCheck.length; idx++) {
                    const f = framesToCheck[idx];
                    try {
                        const url = f.url();
                        const inputCount = await f.locator('input:not([type="hidden"])').count().catch(() => 0);
                        traceLog(`   Frame ${idx}: ${url} (inputs: ${inputCount})`);
                        if (inputCount > 0) {
                            found = true;
                        }
                    } catch (frameError) {
                        traceLog(`   Frame ${idx}: Error checking inputs`);
                    }
                }

                if (found) {
                    traceLog('✅ Functional login fields detected.');
                    navigationSuccess = true;
                    break;
                } else {
                    traceLog('⚠️ No frames with input fields found yet. Retrying...');
                    await takeScreenshot(`nav_fail_attempt_${attempt}`, page);
                }
            } catch (e: any) {
                traceLog(`⚠️ Navigation attempt ${attempt} failed: ${e.message}`);
                if (attempt === 3) throw e;
                await page.waitForTimeout(5000);
            }
        }

        if (!navigationSuccess) {
            throw new Error('Failed to reach login page with functional fields after multiple attempts.');
        }

        await takeScreenshot('login_page', page);

        // ---------- locate login frame ----------
        const frames = page.frames();
        let loginFrame = null;
        for (const f of frames) {
            const cnt = await f.locator('input:not([type="hidden"])').count();
            if (cnt > 0) {
                loginFrame = f;
                traceLog(`✅ Login frame identified: ${f.url()}`);
                break;
            }
        }
        if (!loginFrame) throw new Error('Could not re-locate login frame after navigation check');

        // ---------- fill credentials ----------
        const userField = loginFrame
            .locator('input[id*="user" i], input[name*="user" i], input[type="text"]')
            .first();
        const passField = loginFrame.locator('input[type="password"]').first();

        traceLog('⏳ Waiting for User ID field visibility...');
        await userField.waitFor({ state: 'visible', timeout: 20000 });

        traceLog('⌨️ Filling credentials...');
        await userField.click();
        await userField.fill('kevinraj20@gmail.com');

        await passField.click();
        await passField.fill('TbT@629002');

        traceLog('📸 Taking credentials_filled screenshot...');
        await takeScreenshot('credentials_filled', page);

        // Wait for CAPTCHA image to be visible within the frame
        traceLog('⌛ Waiting for CAPTCHA image to load...');
        const captchaImg = loginFrame.locator('#captchaCanvas, #captcha-img, img[src*="captcha" i]').first();
        try {
            await captchaImg.waitFor({ state: 'visible', timeout: 30000 });
            traceLog('✅ CAPTCHA image is visible.');
        } catch (e) {
            traceLog('⚠️ CAPTCHA image not detected after 30s. Will try generic scan.');
        }

        // ---------- dump frame source (debug) ----------
        try {
            const src = await loginFrame.content();
            fs.writeFileSync('login_frame.html', src);
            traceLog('📝 Frame source saved');
        } catch { }

        // ---------- CAPTCHA handling ----------
        const captchaInput = loginFrame
            .locator('input[id*="captcha" i], input[name*="captcha" i], input[placeholder*="letters" i]')
            .first();

        const refreshBtn = loginFrame.locator('#refresh, #refresh-img').first();

        const MAX_ATTEMPTS = 3;
        let solved = false;

        for (let attempt = 1; attempt <= MAX_ATTEMPTS && !solved; attempt++) {
            traceLog(`--- CAPTCHA ATTEMPT ${attempt} ---`);

            // locate element (canvas preferred, fallback to img)
            let target = loginFrame
                .locator('#captchaCanvas, #captcha-img, img[src*="captcha" i]')
                .first();

            const visible = await target.isVisible().catch(() => false);
            if (!visible) {
                traceLog('Target not visible – trying generic scan');
                const candidates = loginFrame.locator('img, canvas');
                const cnt = await candidates.count();
                let bestScore = -1;
                for (let i = 0; i < cnt; i++) {
                    const cand = candidates.nth(i);
                    const info = await cand.evaluate((el: HTMLElement) => ({
                        tag: el.tagName.toLowerCase(),
                        id: el.id,
                        w: (el as any).naturalWidth || (el as any).width || el.clientWidth,
                        h: (el as any).naturalHeight || (el as any).height || el.clientHeight,
                        vis: el.offsetParent !== null && window.getComputedStyle(el).display !== 'none',
                    }));
                    if (!info.vis) continue;
                    let score = 0;
                    if (info.tag === 'canvas') score += 100;
                    if (info.id.toLowerCase().includes('cap')) score += 50;
                    if (info.w > 100 && info.w < 350) score += 20;
                    if (score > bestScore) {
                        bestScore = score;
                        target = cand;
                    }
                }
            }

            // ----- Extract CAPTCHA text using OCR -----
            const { text: rawText, confidence } = await getCaptchaText(target, attempt);
            traceLog(`OCR result: "${rawText}" (conf: ${confidence.toFixed(1)}%)`);

            // Adaptive confidence threshold: 
            // - High confidence (>=70%) always accepted
            // - Medium confidence (>=35% now) accepted if text length looks right (5-7 chars)
            const isHighConfidence = confidence >= 70;
            const isMediumConfidenceWithValidLength = confidence >= 35 && rawText.length >= 5 && rawText.length <= 7;

            if (rawText && (isHighConfidence || isMediumConfidenceWithValidLength)) {
                traceLog(`✅ Accepting result: "${rawText}" (conf: ${confidence.toFixed(1)}%, highConf: ${isHighConfidence}, validLen: ${isMediumConfidenceWithValidLength})`);

                await takeScreenshot(`captcha_fill_attempt_${attempt}`, page);

                // ----- fill and submit -----
                await captchaInput.fill(rawText);
                const submitBtn = loginFrame
                    .locator('input[type="submit"], button[type="submit"], button:has-text("Sign In"), input[value="Sign In"]')
                    .first();

                if (await submitBtn.count() > 0) {
                    await submitBtn.click();
                    traceLog('Submit clicked. Waiting for dashboard...');
                } else {
                    traceLog('Submit button not found');
                }

                // wait for dashboard
                try {
                    await page.waitForURL('**/foportal/fodashboard.html', { timeout: 45000 });
                    traceLog('✅ Dashboard reached – CAPTCHA solved');
                    solved = true;

                    // ---------- Post-Login Navigation ----------
                    traceLog('🚀 Navigating to MCA Services...');
                    const mcaServices = page.locator('a[title="MCA Services"], a:has-text("MCA Services")').first();
                    await mcaServices.waitFor({ state: 'visible', timeout: 30000 });
                    await mcaServices.click();
                    traceLog('✅ Clicked MCA Services');

                    await page.waitForTimeout(3000);

                    traceLog('🚀 Navigating to "View Company or LLP Master Data"...');
                    const masterDataLink = page.locator('a:has-text("View Company or LLP Master Data")').first();
                    await masterDataLink.waitFor({ state: 'visible', timeout: 20000 });
                    await masterDataLink.click();
                    traceLog('✅ Reached Master Data Search Page');

                    await takeScreenshot('master_data_search', page);

                } catch (e: any) {
                    traceLog(`⚠️ Dashboard or Navigation failed: ${e.message}`);
                    await takeScreenshot('navigation_error', page);
                }
            } else {
                traceLog('OCR confidence too low or empty text');
            }

            // ----- if not solved, refresh and retry -----
            if (!solved && attempt < MAX_ATTEMPTS) {
                if (await refreshBtn.isVisible()) {
                    await refreshBtn.click();
                    traceLog('Clicked Refresh Captcha');
                    await page.waitForTimeout(1500); // give time for new image
                } else {
                    traceLog('Refresh button not found – will retry without it');
                }
            }
        }

        if (!solved) {
            traceLog('❌ All attempts failed – manual intervention required');
        }

        await takeScreenshot('final_state', page);
        await browser.close();
    } catch (error: any) {
        traceLog(`🚨 FATAL ERROR: ${error.message}`);
        throw error;
    }
});


