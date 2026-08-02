import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { chromium, Browser } from 'playwright';
import { PdfOptions } from '../interfaces/pdf-options.interface';

@Injectable()
export class PdfGeneratorService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PdfGeneratorService.name);
  private browser: Browser | null = null;
  private isBrowserReady = false;

  async onModuleInit() {
    this.logger.log('Initializing Chromium browser for PDF generation...');
    try {
      const launchOptions: any = {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
      };
      if (process.env.CHROME_BIN) {
        launchOptions.executablePath = process.env.CHROME_BIN;
      }
      this.browser = await chromium.launch(launchOptions);
      this.isBrowserReady = true;
      this.logger.log('Chromium browser initialized successfully.');
    } catch (error) {
      this.logger.error('Failed to initialize Chromium browser.', error);
      throw error; // Fail fast if we cannot launch the browser
    }
  }

  async onModuleDestroy() {
    if (this.browser) {
      this.logger.log('Closing Chromium browser...');
      await this.browser.close();
      this.isBrowserReady = false;
      this.logger.log('Chromium browser closed.');
    }
  }

  /**
   * Returns true if the Chromium browser is launched and ready.
   */
  isReady(): boolean {
    return this.isBrowserReady && this.browser !== null;
  }

  /**
   * Generates a PDF Buffer from an HTML string.
   *
   * @param html The full HTML string to render
   * @param options Generic PDF options (maps to Playwright internally)
   * @returns A Promise resolving to a Buffer containing the PDF data
   */
  async generate(html: string, options?: PdfOptions): Promise<Buffer> {
    if (!this.browser) {
      throw new Error(
        'PDF Generator Service is not ready (Browser not initialized).',
      );
    }

    // 1. Create a fresh context for complete isolation per request
    const context = await this.browser.newContext();
    const page = await context.newPage();

    try {
      // 2. Load the HTML content
      // 'load' ensures images (even base64) and styles are fully parsed and rendered.
      await page.setContent(html, { waitUntil: 'load' });

      // 3. Map generic PdfOptions to Playwright's specific PDF options
      const playwrightPdfOptions = this.mapOptions(options);

      // 4. Generate the PDF buffer
      const pdfBuffer = await page.pdf(playwrightPdfOptions);

      return Buffer.from(pdfBuffer);
    } finally {
      // 5. Always cleanup the page and context, even if PDF generation fails
      await page
        .close()
        .catch((err) => this.logger.error('Failed to close page', err));
      await context
        .close()
        .catch((err) => this.logger.error('Failed to close context', err));
    }
  }

  private mapOptions(
    options?: PdfOptions,
  ): Parameters<import('playwright').Page['pdf']>[0] {
    const defaultOptions = {
      printBackground: true,
    };

    if (!options) {
      return defaultOptions;
    }

    return {
      ...defaultOptions,
      format: options.format,
      width: options.width,
      height: options.height,
      landscape: options.landscape,
      printBackground: options.printBackground ?? true,
      scale: options.scale,
      margin: options.margin,
    };
  }
}
