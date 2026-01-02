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