// screenshots.mjs — captures real app screenshots for README
// Run from /frontend: node screenshots.mjs

import puppeteer from 'puppeteer';
import { mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, '..', 'screenshots');
mkdirSync(OUT_DIR, { recursive: true });

const BASE = 'http://localhost:3000';
const API  = 'http://localhost:8000/api';

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

async function shot(page, name, waitMs = 2500) {
  await new Promise(r => setTimeout(r, waitMs));
  const file = join(OUT_DIR, `${name}.png`);
  await page.screenshot({ path: file, fullPage: false });
  console.log(`  ✅ screenshots/${name}.png`);
}

const browser = await puppeteer.launch({
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
  defaultViewport: { width: 1440, height: 860 },
});

try {
  // ─── USER SCREENSHOTS ────────────────────────────────────────────────────
  const userToken = await getToken('demo@finhealth.com', 'demo1234');
  if (!userToken) { console.error('❌ User login failed'); process.exit(1); }
  console.log('📸 User screenshots...');

  // Login
  { const p = await browser.newPage();
    await p.goto(`${BASE}/login`, { waitUntil: 'networkidle2' });
    await shot(p, '01_login', 1200); await p.close(); }

  // Dashboard
  { const p = await browser.newPage();
    await injectToken(p, userToken);
    await p.goto(`${BASE}/dashboard`, { waitUntil: 'networkidle2' });
    await shot(p, '02_user_dashboard', 3500); await p.close(); }

  // Income
  { const p = await browser.newPage();
    await injectToken(p, userToken);
    await p.goto(`${BASE}/income`, { waitUntil: 'networkidle2' });
    await shot(p, '03_income', 2500); await p.close(); }

  // Expenses
  { const p = await browser.newPage();
    await injectToken(p, userToken);
    await p.goto(`${BASE}/expenses`, { waitUntil: 'networkidle2' });
    await shot(p, '04_expenses', 2500); await p.close(); }

  // Categories
  { const p = await browser.newPage();
    await injectToken(p, userToken);
    await p.goto(`${BASE}/categories`, { waitUntil: 'networkidle2' });
    await shot(p, '05_categories', 2500); await p.close(); }

  // Analysis
  { const p = await browser.newPage();
    await injectToken(p, userToken);
    await p.goto(`${BASE}/analysis`, { waitUntil: 'networkidle2' });
    await shot(p, '06_analysis', 4500); await p.close(); }

  // Reports
  { const p = await browser.newPage();
    await injectToken(p, userToken);
    await p.goto(`${BASE}/reports`, { waitUntil: 'networkidle2' });
    await shot(p, '07_reports', 2500); await p.close(); }

  // ─── ADMIN SCREENSHOTS ───────────────────────────────────────────────────
  const adminToken = await getToken('admin@finhealth.com', 'admin123');
  if (!adminToken) { console.error('❌ Admin login failed'); process.exit(1); }
  console.log('📸 Admin screenshots...');

  // Admin Dashboard (top)
  { const p = await browser.newPage();
    await injectToken(p, adminToken);
    await p.goto(`${BASE}/admin/dashboard`, { waitUntil: 'networkidle2' });
    await shot(p, '08_admin_dashboard_top', 4000);
    await p.evaluate(() => window.scrollBy(0, 900));
    await shot(p, '09_admin_dashboard_mid', 1500);
    await p.evaluate(() => window.scrollBy(0, 900));
    await shot(p, '10_admin_dashboard_bot', 1500);
    await p.close(); }

  // R Plots page
  { const p = await browser.newPage();
    await injectToken(p, adminToken);
    await p.goto(`${BASE}/admin/plots`, { waitUntil: 'networkidle2' });
    await shot(p, '11_admin_plots_top', 10000); // wait for all 7 R plots
    await p.evaluate(() => window.scrollBy(0, 1100));
    await shot(p, '12_admin_plots_mid', 2000);
    await p.close(); }

  // DB Explorer
  { const p = await browser.newPage();
    await injectToken(p, adminToken);
    await p.goto(`${BASE}/admin/database`, { waitUntil: 'networkidle2' });
    await shot(p, '13_admin_database', 2500); await p.close(); }

  console.log(`\n🎉 Done! All screenshots saved to screenshots/`);
} finally {
  await browser.close();
}
