import { test, expect, chromium, Page, Browser } from '@playwright/test';
import * as fs from 'fs';

test('MCA Login via ZenRows Cloud', async () => {
  const apiKey = '46cae368af0151f0198e86d465a0f801a8f09ed6';
  const connectionURL = `wss://browser.zenrows.com?apikey=${apiKey}&proxy_country=in`;

  const traceLog = (msg: string) => {
    const timestamp = new Date().toISOString();
    fs.appendFileSync('captcha_trace.log', `[${timestamp}] ${msg}\n`);
    console.log(msg);
  };

  const browser: Browser = await chromium.connectOverCDP(connectionURL);
  const context = browser.contexts()[0] || await browser.newContext();
  const page: Page = await context.newPage();

  let step = 1;
  const takeScreenshot = async (name: string) => {
    await page.screenshot({ path: `step_${step}_${name}.png`, fullPage: true });
    traceLog(`📸 Screenshot: step_${step}_${name}.png`);
    step++;
  };

  try {
    fs.writeFileSync('captcha_trace.log', '=== TEST START ===\n');
    fs.writeFileSync('error_details.txt', 'Test Started...');

    traceLog('Step 1: Navigating to Home...');
    await page.goto('https://www.mca.gov.in/content/mca/global/en/home.html', { waitUntil: 'domcontentloaded' });
    await takeScreenshot('home_page');

    traceLog('Step 2: Navigating to Login...');
    await page.goto('https://www.mca.gov.in/content/mca/global/en/foportal/fologin.html', {
      waitUntil: 'networkidle',
      timeout: 90000
    });
    await takeScreenshot('login_page_loaded');

    const allFrames = page.frames();
    traceLog(`Detected ${allFrames.length} frames.`);

    let loginFrame = null;
    for (const frame of allFrames) {
      const inputCount = await frame.locator('input:not([type="hidden"])').count();
      if (inputCount > 0) {
        loginFrame = frame;
        traceLog(`✅ Potential form found in frame: ${frame.url()}`);
        break;
      }
    }

    if (!loginFrame) {
      traceLog('❌ No visible inputs found in any frame.');
      throw new Error('Form not found.');
    }

    const userField = loginFrame.locator('input[id*="user" i], input[name*="user" i], input[type="text"]').first();
    const passField = loginFrame.locator('input[type="password"]').first();

    await userField.waitFor({ state: 'visible', timeout: 15000 });
    traceLog('Entering credentials...');
    await userField.fill('kevinraj20@gmail.com');
    await passField.fill('TbT@629002');
    await takeScreenshot('credentials_filled');

    // DUMP FRAME SOURCE
    try {
      const frameSource = await loginFrame.content();
      fs.writeFileSync('login_frame.html', frameSource);
      traceLog('📝 Login frame source dumped.');
    } catch (e) { }

    traceLog('Solving Captcha...');

    // STRATEGY: Target by ID first
    let targetImg = loginFrame.locator('#captchaCanvas, #captcha-img, img[src*="captcha" i]').first();
    let isTargetVisible = await targetImg.isVisible().catch(() => false);

    if (!isTargetVisible) {
      traceLog('Direct targeting failed, scanning candidates...');
      const candidates = loginFrame.locator('img, canvas');
      const candCount = await candidates.count();
      let bestScore = -1;

      for (let i = 0; i < candCount; i++) {
        try {
          const cand = candidates.nth(i);
          const info = await cand.evaluate((el: HTMLElement) => {
            return {
              tag: el.tagName.toLowerCase(),
              id: el.id,
              w: (el as any).naturalWidth || (el as any).width || el.clientWidth,
              h: (el as any).naturalHeight || (el as any).height || el.clientHeight,
              vis: el.offsetParent !== null && window.getComputedStyle(el).display !== 'none'
            };
          });

          traceLog(`Cand [${i}]: <${info.tag}> id="${info.id}" size=${info.w}x${info.h} vis=${info.vis}`);

          if (!info.vis) continue;

          let score = 0;
          if (info.tag === 'canvas') score += 100;
          if (info.id.toLowerCase().includes('cap')) score += 50;
          if (info.w > 100 && info.w < 350) score += 20;

          if (score > bestScore) {
            bestScore = score;
            targetImg = cand;
          }
        } catch (e: any) {
          traceLog(`Error scanning candidate ${i}: ${e.message}`);
        }
      }
    }

    const captchaInput = loginFrame.locator('input[id*="captcha" i], input[name*="captcha" i], input[placeholder*="letters" i]').first();
    const hasInput = await captchaInput.count() > 0;

    if (targetImg && hasInput) {
      traceLog('✅ Target and input found. Extracting image...');

      let base64Data = null;
      try {
        base64Data = await targetImg.evaluate((el: HTMLElement) => {
          try {
            let canvas: HTMLCanvasElement;
            if (el instanceof HTMLCanvasElement) {
              canvas = el;
            } else if (el instanceof HTMLImageElement) {
              canvas = document.createElement('canvas');
              canvas.width = el.naturalWidth || 200;
              canvas.height = el.naturalHeight || 60;
              const ctx = canvas.getContext('2d');
              if (!ctx) return 'ERROR: No 2d context';
              ctx.drawImage(el, 0, 0);
            } else {
              return 'ERROR: Not canvas/img';
            }
            return canvas.toDataURL('image/png');
          } catch (e: any) { return 'ERROR: ' + e.message; }
        });

        traceLog(`Extraction result length: ${base64Data?.length || 0}`);
        if (base64Data?.startsWith('ERROR:')) {
          traceLog(`❌ JS Extraction error: ${base64Data}`);
          base64Data = null;
        }
      } catch (err: any) {
        traceLog(`❌ evaluate failure: ${err.message}`);
      }

      const snapshotPath = 'captcha_snapshot.png';
      if (!base64Data || base64Data.length < 500) {
        traceLog('⚠️ Extraction failed/tiny. Taking direct screenshot...');
        await targetImg.screenshot({ path: snapshotPath });
      } else {
        const base64Image = base64Data.replace(/^data:image\/\w+;base64,/, "");
        fs.writeFileSync(snapshotPath, base64Image, 'base64');
        traceLog('📸 Extraction-based image saved.');
      }

      // OCR
      traceLog('Attempting OCR...');
      const { createWorker } = require('tesseract.js');
      const worker = await createWorker('eng');
      const ret = await worker.recognize(snapshotPath);
      await worker.terminate();
      const captchaText = ret.data.text.replace(/[^a-zA-Z0-9]/g, '').trim();
      traceLog(`🧩 CAPTCHA Text: "${captchaText}"`);

      if (captchaText) {
        await captchaInput.fill(captchaText);
        const submitBtn = loginFrame.locator('input[type="submit"], button[type="submit"], button:has-text("Sign In"), input[value="Sign In"]').first();
        if (await submitBtn.count() > 0) {
          traceLog('Clicking Submit...');
          await submitBtn.click();
        }

        try {
          await page.waitForURL('**/foportal/fodashboard.html', { timeout: 30000 });
          traceLog('✅ Dashboard reached!');
        } catch (e) {
          traceLog('⚠️ Navigation timeout. Check step_error.png');
        }
      }
    } else {
      traceLog('❌ Captcha target or input missing.');
    }

    await takeScreenshot('final_state');

  } catch (error: any) {
    traceLog(`❌ FATAL ERROR: ${error.message}`);
    fs.writeFileSync('error_details.txt', `Message: ${error.message}\nStack: ${error.stack}`);
    await takeScreenshot('error_state');
    throw error;
  } finally {
    await browser.close();
  }
});