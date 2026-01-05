import { test, expect, chromium, Page, Browser } from '@playwright/test';
import * as fs from 'fs';

test('MCA Login via ZenRows Cloud', async () => {
  const apiKey = '708ae2115560b58fe56cb6d2ae6641c55da6b0fb';
  const connectionURL = `wss://browser.zenrows.com?apikey=${apiKey}&proxy_country=in`;

  const browser: Browser = await chromium.connectOverCDP(connectionURL);
  const context = browser.contexts()[0] || await browser.newContext();
  const page: Page = await context.newPage();

  let step = 1;
  const takeScreenshot = async (name: string) => {
    await page.screenshot({ path: `step_${step}_${name}.png`, fullPage: true });
    console.log(`📸 Screenshot: step_${step}_${name}.png`);
    step++;
  };

  try {
    console.log('Step 1: Navigating to Home...');
    await page.goto('https://www.mca.gov.in/content/mca/global/en/home.html', { waitUntil: 'domcontentloaded' });
    await takeScreenshot('home_page');

    console.log('Step 2: Navigating to Login...');
    await page.goto('https://www.mca.gov.in/content/mca/global/en/foportal/fologin.html', { 
      waitUntil: 'networkidle', 
      timeout: 90000 
    });
    await takeScreenshot('login_page_loaded');

    // SEARCH ALL FRAMES
    console.log('Searching all frames for login inputs...');
    const allFrames = page.frames();
    console.log(`Detected ${allFrames.length} frames.`);

    let loginFrame = null;
    for (const frame of allFrames) {
        // Look for any frame containing an input that isn't hidden
        const inputCount = await frame.locator('input:not([type="hidden"])').count();
        if (inputCount > 0) {
            loginFrame = frame;
            console.log(`✅ Potential form found in frame: ${frame.url()}`);
            break;
        }
    }

    if (!loginFrame) {
        console.log('❌ No visible inputs found in any frame. Dumping source...');
        fs.writeFileSync('debug_source.html', await page.content());
        throw new Error('Form not found. Analyze step_2_login_page_loaded.png and debug_source.html');
    }

    // Try to fill by likely attributes inside the identified frame
    const userField = loginFrame.locator('input[id*="user" i], input[name*="user" i], input[type="text"]').first();
    const passField = loginFrame.locator('input[type="password"]').first();

    await userField.waitFor({ state: 'visible', timeout: 15000 });
    console.log('Entering credentials...');
    await userField.fill('kevinraj20@gmail.com');
    await passField.fill('TbT@629002');
    await takeScreenshot('credentials_filled');

    console.log('Waiting for manual Captcha solve from user...');
    // Increased timeout for you to see the screenshot and solve
    await page.waitForURL('**/foportal/fodashboard.html', { timeout: 180000 });
    
    console.log('✅ Success! Dashboard reached.');
    await takeScreenshot('final_dashboard');

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    await takeScreenshot('error_state');
    throw error;
  } finally {
    await browser.close();
  }
});