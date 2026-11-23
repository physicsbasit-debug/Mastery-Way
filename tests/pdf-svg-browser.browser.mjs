import test from 'node:test';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';

test('cloned Recharts SVG does not resize when only its wrapper is enlarged', async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1100, height: 900 } });
    await page.setContent(`<!doctype html><html lang="ar" dir="rtl"><body>
      <section id="source" style="width:360px">
        <div class="recharts-responsive-container" style="width:100%;height:175px">
          <svg class="recharts-surface" width="360" height="175" viewBox="0 0 360 175">
            <rect x="0" y="0" width="360" height="175" fill="#f8fafc"></rect>
            <rect x="35" y="45" width="210" height="22" fill="#a87526"></rect>
          </svg>
        </div>
      </section>
    </body></html>`);
    const geometry = await page.evaluate(() => {
      const source = document.getElementById('source');
      const clone = source.cloneNode(true);
      clone.id = 'pdf-export-render';
      clone.style.width = '360px';
      document.body.appendChild(clone);
      const container = clone.querySelector('.recharts-responsive-container');
      container.style.height = '300px';
      const svg = clone.querySelector('svg');
      return {
        wrapperHeight: container.getBoundingClientRect().height,
        svgHeight: svg.getBoundingClientRect().height,
        viewBoxHeight: svg.viewBox.baseVal.height,
      };
    });
    assert.equal(geometry.wrapperHeight, 300);
    assert.equal(geometry.svgHeight, 175);
    assert.equal(geometry.viewBoxHeight, 175);
  } finally {
    await browser.close();
  }
});
