import { chromium } from '@playwright/test';
import { mkdir } from 'fs/promises';

const BASE = 'http://localhost:3000';
const OUT = '/tmp/screenshots';
await mkdir(OUT, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

// Inject a mock NextAuth session so the dashboard doesn't redirect
await page.route('**/api/auth/session', route => {
  route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({
      user: { name: 'Pankaj Meshram', email: 'pankaj@example.com', role: 'ADMIN', image: null },
      expires: '2099-01-01T00:00:00.000Z',
    }),
  });
});

// --- Overview tab ---
await page.goto(`${BASE}/dashboard`, { waitUntil: 'networkidle' });
await page.screenshot({ path: `${OUT}/dashboard-overview.png`, fullPage: true });
console.log('✓ dashboard-overview');

// --- Pending Approvals tab ---
await page.click('button:has-text("Pending Approvals")');
await page.waitForTimeout(300);
await page.screenshot({ path: `${OUT}/dashboard-pending.png`, fullPage: true });
console.log('✓ dashboard-pending');

// --- Members tab ---
await page.click('button:has-text("Members")');
await page.waitForTimeout(300);
await page.screenshot({ path: `${OUT}/dashboard-members.png`, fullPage: true });
console.log('✓ dashboard-members');

await browser.close();
console.log(`\nDone! Screenshots in ${OUT}`);
