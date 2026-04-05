import { chromium } from '@playwright/test';
import { mkdir } from 'fs/promises';

const BASE = 'http://localhost:3000';
const OUT = '/tmp/screenshots';
await mkdir(OUT, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

// Mock admin session
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

await page.goto(`${BASE}/dashboard`, { waitUntil: 'networkidle' });

// Overview
await page.screenshot({ path: `${OUT}/dashboard-overview.png`, fullPage: true });
console.log('✓ overview');

// Pending
await page.click('button:has-text("Pending")');
await page.waitForTimeout(300);
await page.screenshot({ path: `${OUT}/dashboard-pending.png`, fullPage: true });
console.log('✓ pending');

// Members
await page.click('button:has-text("Members")');
await page.waitForTimeout(300);
await page.screenshot({ path: `${OUT}/dashboard-members.png`, fullPage: true });
console.log('✓ members');

// Referral Codes tab
await page.click('button:has-text("Referral Codes")');
await page.waitForTimeout(300);
await page.screenshot({ path: `${OUT}/dashboard-referrals.png`, fullPage: true });
console.log('✓ referrals list');

// Open modal
await page.click('button:has-text("+ Generate Referral Code")');
await page.waitForTimeout(300);
await page.screenshot({ path: `${OUT}/dashboard-modal-empty.png`, fullPage: true });
console.log('✓ modal (empty)');

// Generate a code
await page.click('button:has-text("Generate Code")');
await page.waitForTimeout(300);
await page.screenshot({ path: `${OUT}/dashboard-modal-generated.png`, fullPage: true });
console.log('✓ modal (with code)');

await browser.close();
console.log(`\nDone! Screenshots in ${OUT}`);
