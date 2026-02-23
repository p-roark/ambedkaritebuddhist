import { chromium } from '@playwright/test';
import { mkdir } from 'fs/promises';

const BASE = 'http://localhost:3000';
const OUT = '/tmp/screenshots';

await mkdir(OUT, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

const pages = [
  { name: 'home', url: '/' },
  { name: 'login', url: '/auth/login' },
  { name: 'register', url: '/auth/register' },
  { name: 'dashboard-redirect', url: '/dashboard' },
  { name: 'events', url: '/events' },
  { name: 'about', url: '/about' },
];

for (const { name, url } of pages) {
  await page.goto(BASE + url, { waitUntil: 'networkidle' });
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: true });
  console.log(`✓ ${name}`);
}

await browser.close();
console.log(`\nScreenshots saved to ${OUT}`);
