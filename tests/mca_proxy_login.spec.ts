import { test, chromium } from '@playwright/test';

test('MCA Login with Bright Data Proxy', async () => {
    // Credentials
    const mcaUsername = 'your_mca_username'; // REPLACE THIS WITH ACTUAL USERNAME
    const mcaPassword = 'your_mca_password'; // REPLACE THIS WITH ACTUAL PASSWORD

    // Generate a random session ID for IP rotation
    const sessionId = (Math.random() * 10000).toFixed(0);

    // Proxy Configuration
    const proxyOptions = {
        server: 'http://brd.superproxy.io:33335',
        // Appending -country-in to force India-based IPs if the zone supports it
        username: `brd-customer-hl_57191b85-zone-turia_zone-session-s${sessionId}-country-in`,
        password: 'wpl7g93f9bsb'
    };

    console.log(`Launching browser with Proxy (Session: s${sessionId}, Country: IN)...`);
    console.log(`Using Proxy: ${proxyOptions.server}`);
    console.log(`Username: ${proxyOptions.username}`);

    const browser = await chromium.launch({
        headless: false,
        proxy: proxyOptions,
        args: [
            '--disable-blink-features=AutomationControlled',
            '--no-sandbox',
            '--start-maximized'
        ]
    });

    const context = await browser.newContext({
        viewport: { width: 1920, height: 1080 },
        ignoreHTTPSErrors: true
    });

    const page = await context.newPage();

    console.log('Navigating to MCA Homepage (with retries)...');
    const maxRetries = 3;
    let success = false;
    for (let i = 0; i < maxRetries; i++) {
        try {
            console.log(`Attempt ${i + 1} of ${maxRetries}...`);
            await page.goto('https://www.mca.gov.in/content/mca/global/en/home.html', {
                timeout: 90000,
                waitUntil: 'domcontentloaded'
            });
            console.log('Reached MCA Homepage.');
            success = true;
            break;
        } catch (error: any) {
            console.log(`Attempt ${i + 1} failed: ${error.message}`);
            try {
                await page.screenshot({ path: `nav_failure_attempt_${i + 1}.png` });
            } catch (screenshotError) {
                console.log('Could not take screenshot (page might be closed).');
            }
            if (i < maxRetries - 1) {
                console.log('Waiting 5 seconds before retry...');
                await page.waitForTimeout(5000);
            }
        }
    }

    if (!success) {
        console.log('Could not reach MCA Homepage after multiple attempts.');
        // Optionally, you might want to exit the test here if navigation is critical
        // test.fail('Failed to navigate to MCA Homepage after multiple attempts.');
    } else {
        // Click My Workspace only if navigation was successful
        console.log('Clicking "My Workspace" to trigger login...');
        try {
            await page.click('a:has-text("My Workspace")');
        } catch (error) {
            console.log('Clicking "My Workspace" failed.');
            await page.screenshot({ path: 'my_workspace_click_error.png' });
        }
    }

    // Wait for Login Form
    console.log('Waiting for login form to load...');
    try {
        // Wait for the specific MCA v3 login fields
        const usernameField = page.locator('#userName, input[name="userName"], input[placeholder*="User"]');
        await usernameField.first().waitFor({ state: 'visible', timeout: 30000 });

        // Automated Entry
        console.log('Found login fields. Entering credentials...');
        await usernameField.first().fill(mcaUsername);

        const passwordField = page.locator('#password, input[name="password"], input[type="password"]');
        await passwordField.first().fill(mcaPassword);

        console.log('Credentials entered successfully.');
        console.log('--------------------------------------------------');
        console.log('MANUAL ACTION REQUIRED:');
        console.log('1. Enter the CAPTCHA code manually.');
        console.log('2. Click the "Sign In" button.');
        console.log('--------------------------------------------------');
    } catch (e) {
        await page.screenshot({ path: 'login_fields_failure.png' });
        console.log('ERROR: Could not find login fields automatically.');
        console.log('Please check if the page loaded correctly or if "Sign In" was clicked.');
    }

    // Wait for login to complete (Sign Out button appears)
    try {
        await page.waitForFunction(() => {
            const bodyText = document.body.innerText;
            return bodyText.includes('Sign Out') || bodyText.includes('Logout') || bodyText.includes('Welcome');
        }, { timeout: 300000 }); // 5 minutes for manual CAPTCHA + Login

        console.log('Login detected! Navigating to MCA Services...');

        // Navigate to MCA Services
        const mcaServices = page.locator('a[title="MCA Services"]');
        await mcaServices.waitFor({ state: 'visible' });
        await mcaServices.click();

        console.log('Successfully navigated to MCA Services!');
    } catch (e) {
        console.log('Waiting for login timed out or failed.');
    }

    console.log('Automation paused.');
    await page.pause();
});