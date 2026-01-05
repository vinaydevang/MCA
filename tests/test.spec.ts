import { test, chromium } from '@playwright/test';

test('Verify ZenRows API Key Status', async () => {
  const apiKey = '708ae2115560b58fe56cb6d2ae6641c55da6b0fb';
  const connectionURL = `wss://browser.zenrows.com?apikey=${apiKey}`;

  console.log('Testing connection...');
  try {
    const browser = await chromium.connectOverCDP(connectionURL);
    console.log('✅ Connection Successful! The API key is active.');
    await browser.close();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('❌ Connection Failed! The key might be expired or invalid:', message);
  }
});