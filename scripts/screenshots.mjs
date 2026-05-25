// screenshots.mjs — captures real app screenshots for README
// Run: node scripts/screenshots.mjs

import puppeteer from 'puppeteer';
import { mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, '..', 'screenshots');
mkdirSync(OUT_DIR, { recursive: true });

const BASE = 'http://localhost:3000';
const API  = 'http://localhost:8000/api';

// ─── Helper: login and store cookie / token ───────────────────────────────────
async function getToken(email, password) {
  const res = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  return data?.data?.token ?? null;
}

async function injectToken(page, token) {
  await page.evaluateOnNewDocument((t) => {
    localStorage.setItem('token', t);
  }, token);
}

// ─── Helper: screenshot with a short wait ─────────────────────────────────────
async function shot(page, name, waitMs = 2000) {
  await new Promise(r => setTimeout(r, waitMs));
  const file = join(OUT_DIR, `${name}.png`);
  await page.screenshot({ path: file, fullPage: false });
  console.log(`  ✅ screenshots/${name}.png`);
}

// ─── Main ─────────────────────────────────────────────────────────────────────
const browser = await puppeteer.launch({
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,860'],
  defaultViewport: { width: 1440, height: 860 },
});

try {
  // ── USER SCREENSHOTS ──────────────────────────────────────────────────────
  const userToken = await getToken('myuser1@test.com', 'password123');
  if (!userToken) throw new Error('Failed to get user token — ensure demo user exists');

  // 1. Login page (unauthenticated)
  {
    const page = await browser.newPage();
    await page.goto(`${BASE}/login`, { waitUntil: 'networkidle2' });
    await shot(page, '01_login', 1000);
    await page.close();
  }

  // 2. User Dashboard
  {
    const page = await browser.newPage();
    await injectToken(page, userToken);
    await page.goto(`${BASE}/dashboard`, { waitUntil: 'networkidle2' });
    await shot(page, '02_user_dashboard', 3000);
    await page.close();
  }

  // 3. Expenses page
  {
    const page = await browser.newPage();
    await injectToken(page, userToken);
    await page.goto(`${BASE}/expenses`, { waitUntil: 'networkidle2' });
    await shot(page, '03_expenses', 2500);
    await page.close();
  }

  // 4. Categories page
  {
    const page = await browser.newPage();
    await injectToken(page, userToken);
    await page.goto(`${BASE}/categories`, { waitUntil: 'networkidle2' });
    await shot(page, '04_categories', 2500);
    await page.close();
  }

  // 5. Analysis page
  {
    const page = await browser.newPage();
    await injectToken(page, userToken);
    await page.goto(`${BASE}/analysis`, { waitUntil: 'networkidle2' });
    await shot(page, '05_analysis', 4000);
    await page.close();
  }

  // 6. Income page
  {
    const page = await browser.newPage();
    await injectToken(page, userToken);
    await page.goto(`${BASE}/income`, { waitUntil: 'networkidle2' });
    await shot(page, '06_income', 2500);
    await page.close();
  }

  // 7. Reports page
  {
    const page = await browser.newPage();
    await injectToken(page, userToken);
    await page.goto(`${BASE}/reports`, { waitUntil: 'networkidle2' });
    await shot(page, '07_reports', 2500);
    await page.close();
  }

  // ── ADMIN SCREENSHOTS ─────────────────────────────────────────────────────
  const adminToken = await getToken('admin@finhealth.com', 'admin123');
  if (!adminToken) throw new Error('Failed to get admin token');

  // 8. Admin Dashboard
  {
    const page = await browser.newPage();
    await injectToken(page, adminToken);
    await page.goto(`${BASE}/admin/dashboard`, { waitUntil: 'networkidle2' });
    await shot(page, '08_admin_dashboard', 4000);
    // Scroll down for more content
    await page.evaluate(() => window.scrollBy(0, 800));
    await shot(page, '08b_admin_dashboard_lower', 1500);
    await page.close();
  }

  // 9. Admin R Plots page
  {
    const page = await browser.newPage();
    await injectToken(page, adminToken);
    await page.goto(`${BASE}/admin/plots`, { waitUntil: 'networkidle2' });
    await shot(page, '09_admin_plots', 8000); // longer wait for all plots to load
    await page.evaluate(() => window.scrollBy(0, 900));
    await shot(page, '09b_admin_plots_lower', 2000);
    await page.close();
  }

  // 10. Admin DB Explorer
  {
    const page = await browser.newPage();
    await injectToken(page, adminToken);
    await page.goto(`${BASE}/admin/database`, { waitUntil: 'networkidle2' });
    await shot(page, '10_admin_database', 2500);
    await page.close();
  }

  console.log('\n🎉 All screenshots saved to screenshots/');
} finally {
  await browser.close();
}
