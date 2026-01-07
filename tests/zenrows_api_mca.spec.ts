// // import { test } from '@playwright/test';
// // import axios from 'axios';
// // import * as fs from 'fs';

// // test('MCA Login via ZenRows API', async () => {
// //     const apiKey = '3df14f83a61dff62e821cf25468a2af3c34c5eda';
// //     const targetUrl = 'https://www.mca.gov.in/content/mca/global/en/foportal/fologin.html';

// //     console.log('Step 1: Making request to MCA login page via ZenRows API...');

// //     // JavaScript instructions to fill the login form and handle the flow
// //     const jsInstructions = [
// //         {
// //             "wait_for": "input[id*='user' i], input[name*='userName' i]"
// //         },
// //         {
// //             "fill": [
// //                 "input[id*='user' i], input[name*='userName' i]",
// //                 "kevinraj20@gmail.com"
// //             ]
// //         },
// //         {
// //             "fill": [
// //                 "input[type='password']",
// //                 "TbT@629002"
// //             ]
// //         },
// //         {
// //             "wait": 2000
// //         },
// //         {
// //             "click": "button[type='submit'], input[type='submit'], #login-btn"
// //         },
// //         {
// //             "wait": 10000
// //         }
// //     ];

// //     try {
// //         console.log('Sending API request to ZenRows...');
// //         const response = await axios.get('https://api.zenrows.com/v1/', {
// //             params: {
// //                 url: targetUrl,
// //                 apikey: apiKey,
// //                 js_render: 'true',
// //                 premium_proxy: 'true',
// //                 proxy_country: 'in',
// //                 js_instructions: JSON.stringify(jsInstructions),
// //                 // We remove wait_for to let ZenRows return the page even if the success condition isn't met yet
// //                 // Use a general wait instead
// //                 wait: '30000'
// //             },
// //             timeout: 300000
// //         });

// //         console.log('✅ Response Status:', response.status);
// //         const htmlContent = response.data as string;
// //         fs.writeFileSync('zenrows_api_result.html', htmlContent);
// //         console.log('Saved response to zenrows_api_result.html');

// //         if (htmlContent.includes('Sign Out') || htmlContent.includes('Logout') || htmlContent.includes('Dashboard')) {
// //             console.log('✅ SUCCESS! Login successful via ZenRows API.');
// //         } else {
// //             console.log('⚠️  Login check: Dashboard/Logout markers not found in the response HTML.');
// //             if (htmlContent.includes('captcha') || htmlContent.includes('CAPTCHA')) {
// //                 console.log('❌ Likely blocked by CAPTCHA. ZenRows could not solve it automatically.');
// //                 // Debug: dump some text from the result
// //                 const bodyTextSnippet = htmlContent.replace(/<[^>]*>?/gm, ' ').substring(0, 1000);
// //                 console.log('Body Text Snippet:', bodyTextSnippet);
// //             } else {
// //                 console.log('Check zenrows_api_result.html for the current page state.');
// //             }
// //         }

// //     } catch (error: any) {
// //         if (error.response) {
// //             console.error('❌ API Error Code:', error.response.status);
// //             console.error('❌ API Error Detail:', JSON.stringify(error.response.data, null, 2));
// //         } else {
// //             console.error('❌ Request Error:', error.message);
// //         }
// //         throw error;
// //     }
// // });

// import { test, chromium, Page, Browser } from '@playwright/test';

// test('MCA Login via ZenRows Scraping Browser', async () => {
//   // Replace with your actual ZenRows API Key
//   const apiKey = '708ae2115560b58fe56cb6d2ae6641c55da6b0fb';
  
//   // The connection URL connects Playwright to a ZenRows-hosted browser 
//   // that automatically handles CAPTCHAs and anti-bot headers.
//   const connectionURL = `wss://browser.zenrows.com?apikey=${apiKey}&proxy_country=in&js_render=true&antibot=true`;

//   console.log('🚀 Connecting to ZenRows Scraping Browser...');
//   const browser: Browser = await chromium.connectOverCDP(connectionURL);
  
//   // Using the existing context provided by ZenRows
//   const context = browser.contexts()[0] || await browser.newContext();
//   const page: Page = await context.newPage();

//   try {
//     console.log('Step 1: Navigating to MCA Home...');
//     await page.goto('https://www.mca.gov.in/content/mca/global/en/home.html', { 
//       waitUntil: 'domcontentloaded',
//       timeout: 60000 
//     });

//     console.log('Step 2: Navigating to Login Page...');
//     await page.goto('https://www.mca.gov.in/content/mca/global/en/foportal/fologin.html', { 
//       waitUntil: 'networkidle', 
//       timeout: 90000 
//     });

//     // ZenRows handles the underlying anti-bot, but we still need to interact with the UI
//     console.log('🔍 Locating Login Frame...');
//     const loginFrame = await page.waitForSelector('iframe', { timeout: 30000 }).then(async (handle) => {
//         return await handle?.contentFrame();
//     });

//     if (!loginFrame) throw new Error('Could not access the login iframe');

//     // fill credentials
//     console.log('⌨️ Filling credentials...');
//     await loginFrame.fill('input[name="userName"]', 'kevinraj20@gmail.com');
//     await loginFrame.fill('input[name="password"]', 'TbT@629002');

//     /**
//      * NOTE ON CAPTCHA: 
//      * ZenRows automatically handles most CAPTCHAs (like Cloudflare/reCAPTCHA). 
//      * For internal MCA text CAPTCHAs, ZenRows provides a 'solve' utility 
//      * but often human interaction or a retry logic is needed if the field is standard text.
//      */
//     console.log('🧩 CAPTCHA is being handled by ZenRows infrastructure...');
    
//     // Wait for manual or auto-redirection to the dashboard
//     console.log('⏳ Waiting for successful login redirection...');
//     await page.waitForURL('**/foportal/fodashboard.html', { timeout: 120000 });

//     console.log('✅ Success! Dashboard reached.');
//     await page.screenshot({ path: 'mca_dashboard.png', fullPage: true });

//   } catch (error: any) {
//     console.error('❌ Error during MCA Login:', error.message);
//     await page.screenshot({ path: 'login_failure.png' });
//     throw error;
//   } finally {
//     await browser.close();
//   }
// });
