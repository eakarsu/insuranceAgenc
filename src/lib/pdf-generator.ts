/**
 * HTML→PDF generator using puppeteer-core.
 * Gracefully falls back to returning HTML if Chrome is not available.
 */
export async function generatePDF(html: string): Promise<{ buffer: Buffer; format: 'pdf' | 'html' }> {
  try {
    const puppeteer = await import('puppeteer-core');
    let executablePath: string | undefined;

    try {
      const chromium = await import('@sparticuz/chromium');
      executablePath = await chromium.default.executablePath();
    } catch {
      // Try common local Chrome paths
      const paths = [
        '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
        '/usr/bin/google-chrome',
        '/usr/bin/chromium-browser',
        'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      ];

      for (const p of paths) {
        try {
          const fs = await import('fs');
          if (fs.existsSync(p)) {
            executablePath = p;
            break;
          }
        } catch {
          continue;
        }
      }
    }

    if (!executablePath) {
      console.warn('[PDF] No Chrome executable found — returning HTML');
      return { buffer: Buffer.from(html, 'utf-8'), format: 'html' };
    }

    const browser = await puppeteer.default.launch({
      executablePath,
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });

    const pdfBuffer = await page.pdf({
      format: 'letter',
      margin: { top: '0.5in', right: '0.5in', bottom: '0.5in', left: '0.5in' },
      printBackground: true,
    });

    await browser.close();

    return { buffer: Buffer.from(pdfBuffer), format: 'pdf' };
  } catch (error) {
    console.warn('[PDF] Generation failed, returning HTML:', error);
    return { buffer: Buffer.from(html, 'utf-8'), format: 'html' };
  }
}
