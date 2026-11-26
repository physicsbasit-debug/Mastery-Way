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
