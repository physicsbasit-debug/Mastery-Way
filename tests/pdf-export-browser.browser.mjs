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
      // Calibrated so the original A4 paginator pushes only the signature row
      // onto page seven, matching the uploaded report rather than adding filler.
      const targetHeight = 6 * 1088 - 90;
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
    assert.ok(geometry.height > 6 * 1088 - 140 && geometry.height < 6 * 1088, JSON.stringify(geometry));

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
    mkdirSync('tests/pdf-proof', { recursive: true });
    writeFileSync('tests/pdf-proof/exam-signature-stress.pdf', pdf);
    console.log('Exam signature stress: ' + JSON.stringify({ ...geometry, pages, bytes: pdf.length }));
    assert.equal(pdf.subarray(0, 4).toString(), '%PDF');
    assert.equal(pages, 6, 'A seventh signature-only A4 page must not be emitted');
  } finally {
    await browser.close();
  }
});

test('actual seven-fragment geometry merges signatures into the sixth PDF page in Chromium', async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1200, height: 900 } });
    await page.goto('http://127.0.0.1:5173/tests/pdf-chart-fixture.html', { waitUntil: 'networkidle' });
    await page.locator('#route-exam').click();
    await page.locator('#fixture-report').evaluate(report => {
      report.style.padding = '0';
      report.style.border = '0';
      report.style.margin = '20px auto';
      report.innerHTML = '';
      const lengths = [1050, 997, 1013, 727, 1069, 1064];
      for (let i = 0; i < lengths.length; i++) {
        const block = document.createElement('div');
        block.setAttribute('data-pdf-keep', 'true');
        block.style.cssText = 'box-sizing:border-box;position:relative;width:100%;height:' + lengths[i] + 'px;background:#fffefa;';
        const text = document.createElement('span');
        text.textContent = 'اختبار سلامة الصفحة ' + (i + 1);
        text.style.cssText = 'position:absolute;right:15px;top:12px;font-size:18px;';
        block.appendChild(text);
        report.appendChild(block);
      }
      const signatures = document.createElement('section');
      signatures.className = 'signature-section';
      signatures.style.cssText = 'height:126px;box-sizing:border-box;display:grid;grid-template-columns:repeat(3,1fr);gap:10px;';
      for (const title of ['المعلم', 'المعلم الأول / المشرف', 'إدارة المدرسة']) {
        const s = document.createElement('div');
        s.style.cssText = 'height:90px;border:1px solid #ccd6dd;border-radius:8px;padding:15px;';
        s.textContent = title + ' - الاسم والتوقيع';
        signatures.appendChild(s);
      }
      report.appendChild(signatures);
    });
    const geometry = await page.locator('#fixture-report').evaluate(el => {
      const r = el.getBoundingClientRect(), sign = el.querySelector('.signature-section').getBoundingClientRect();
      return { height: r.height, signatureTop: sign.top - r.top };
    });
    assert.equal(geometry.height, 6046);
    assert.equal(geometry.signatureTop, 5920);

    await page.getByRole('button', { name: 'تصدير PDF' }).click();
    const dl = page.locator('a[download]');
    await dl.waitFor({ state: 'visible', timeout: 120000 });
    const base64 = await dl.evaluate(async element => {
      const bytes = new Uint8Array(await (await fetch(element.href)).arrayBuffer());
      let result = '';
      for (let offset = 0; offset < bytes.length; offset += 16000) {
        result += String.fromCharCode(...bytes.slice(offset, offset + 16000));
      }
      return btoa(result);
    });
    const pdf = Buffer.from(base64, 'base64');
    const pages = (pdf.toString('latin1').match(/\/Type\s*\/Page\b/g) || []).length;
    mkdirSync('tests/pdf-proof', { recursive: true });
    writeFileSync('tests/pdf-proof/exam-real-slice-signatures.pdf', pdf);
    assert.equal(pages, 6, 'the actual seven-fragment geometry must collapse to six A4 pages');
    console.log('Exam real-slice regression: ' + JSON.stringify({ ...geometry, pages, pdfBytes: pdf.length }));
  } finally { await browser.close(); }
});
