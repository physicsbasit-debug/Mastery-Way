import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { chromium } from 'playwright';

test('real Recharts reports export aligned PDF-only charts without resizing the live view', async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1200, height: 900 } });
    await page.goto('http://127.0.0.1:5173/tests/pdf-chart-fixture.html', { waitUntil: 'networkidle' });
    mkdirSync('tests/pdf-proof', { recursive: true });

    for (const route of ['exam', 'individual']) {
      await page.locator(`#route-${route}`).click();
      await page.locator('#fixture-report .recharts-surface').first().waitFor({ state: 'visible' });
      const originalWidth = await page.locator('#fixture-report').evaluate(el => el.getBoundingClientRect().width);
      assert.equal(originalWidth, 794);
      assert.ok(await page.locator('#fixture-report .mw-pdf-chart-live').count() > 0);
      assert.equal(await page.locator('#fixture-report .mw-pdf-static-chart').first().isVisible(), false);

      await page.getByRole('button', { name: 'تصدير PDF' }).click();
      const download = page.locator('a[download]');
      await download.waitFor({ state: 'visible', timeout: 60000 });
      const base64 = await download.evaluate(async element => {
        const response = await fetch(element.href);
        const bytes = new Uint8Array(await response.arrayBuffer());
        let binary = '';
        for (let offset = 0; offset < bytes.length; offset += 16000) {
          binary += String.fromCharCode(...bytes.slice(offset, offset + 16000));
        }
        return btoa(binary);
      });
      const pdf = Buffer.from(base64, 'base64');
      assert.ok(pdf.length > 5000, `PDF too small: ${pdf.length}`);
      assert.equal(pdf.subarray(0, 4).toString(), '%PDF');
      writeFileSync(`tests/pdf-proof/${route}.pdf`, pdf);
      await page.screenshot({ path: `tests/pdf-proof/${route}-screen.png`, fullPage: true });
      const afterWidth = await page.locator('#fixture-report').evaluate(el => el.getBoundingClientRect().width);
      assert.equal(afterWidth, originalWidth, 'Export changed the live report layout');
      assert.equal(await page.locator('#fixture-report .mw-pdf-static-chart').first().isVisible(), false);
      console.log(`OK ${route} PDF: ${pdf.length} bytes, unchanged report width`);
    }
  } finally {
    await browser.close();
  }
});

test('exam PDF packs an orphaned signature row into the preceding A4 pages without clipping', async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1200, height: 900 } });
    await page.goto('http://127.0.0.1:5173/tests/pdf-chart-fixture.html', { waitUntil: 'networkidle' });
    await page.locator('#route-exam').click();
    await page.locator('#fixture-report .recharts-surface').first().waitFor({ state: 'visible' });

    // Reproduce the uploaded seven-page report's signature-only trailing page.
    const geometry = await page.evaluate(() => {
      const report = document.querySelector('#fixture-report');
      const filler = document.createElement('div');
      filler.style.height = '1px';
      filler.style.background = 'repeating-linear-gradient(to bottom, #fff 0px, #fff 32px, #f1f5f9 33px, #fff 34px)';
      const signatures = document.createElement('section');
      signatures.className = 'signature-section';
      signatures.style.cssText = 'display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:24px;min-height:120px;';
      for (const label of ['المعلم', 'المعلم الأول / المشرف', 'إدارة المدرسة']) {
        const card = document.createElement('div');
        card.style.cssText = 'border:1px solid #cbd5e1;padding:15px;text-align:center;border-radius:10px;';
        card.textContent = label + ' - الاسم والتوقيع';
        signatures.appendChild(card);
      }
      report.append(filler, signatures);
      const targetHeight = 6 * 1088 + 160;
      const currentHeight = report.getBoundingClientRect().height;
      filler.style.height = Math.max(1, targetHeight - currentHeight + 1) + 'px';
      const reportRect = report.getBoundingClientRect();
      const signRect = signatures.getBoundingClientRect();
      return {
        height: Math.ceil(reportRect.height),
        signatureTop: signRect.top - reportRect.top,
        hasThreeSignatures: signatures.children.length === 3,
      };
    });
    assert.ok(geometry.hasThreeSignatures);
    assert.ok(geometry.height > 6 * 1088 && geometry.height < 6 * 1140, JSON.stringify(geometry));

    await page.getByRole('button', { name: 'تصدير PDF' }).click();
    const download = page.locator('a[download]');
    await download.waitFor({ state: 'visible', timeout: 120000 });
    const base64 = await download.evaluate(async element => {
      const bytes = new Uint8Array(await (await fetch(element.href)).arrayBuffer());
      let binary = '';
      for (let offset = 0; offset < bytes.length; offset += 16000) {
        binary += String.fromCharCode(...bytes.slice(offset, offset + 16000));
      }
      return btoa(binary);
    });
    const pdf = Buffer.from(base64, 'base64');
    const pages = (pdf.toString('latin1').match(/\/Type\s*\/Page\b/g) || []).length;
    assert.equal(pages, 6, 'A seventh signature-only A4 page must not be emitted');
    assert.equal(pdf.subarray(0, 4).toString(), '%PDF');
    mkdirSync('tests/pdf-proof', { recursive: true });
    writeFileSync('tests/pdf-proof/exam-signature-stress.pdf', pdf);
    console.log('Exam signature stress: ' + JSON.stringify({ ...geometry, pages, bytes: pdf.length }));
  } finally {
    await browser.close();
  }
});
