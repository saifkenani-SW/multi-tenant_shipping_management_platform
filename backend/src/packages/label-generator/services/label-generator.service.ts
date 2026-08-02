import { Injectable } from '@nestjs/common';
import { GenerateLabelOptions } from '../interfaces/generate-label.interface';
import { QRCodeGenerator } from '../generators/qr-code.generator';
import { BarcodeGenerator } from '../generators/barcode.generator';
import { HtmlLabelBuilder } from '../builders/html-label.builder';

@Injectable()
export class LabelGeneratorService {
  constructor(
    private readonly qrCodeGenerator: QRCodeGenerator,
    private readonly barcodeGenerator: BarcodeGenerator,
  ) {}

  /**
   * Orchestrates the generation of a label by combining QR, Barcode, and fields into an HTML template.
   * @param options Options containing logo, qr, barcode, and fields.
   * @returns Promise resolving to the HTML string representing the label.
   */
  async generate(options: GenerateLabelOptions): Promise<string> {
    // 1. Generate QR Code
    let qrImageSrc = '';
    if (options.qr.enabled !== false) {
      qrImageSrc = await this.qrCodeGenerator.generate({
        value: options.qr.value,
      });
    }

    // 2. Generate Barcode (if enabled)
    let barcodeImageSrc: string | undefined;
    if (options.barcode && options.barcode.enabled !== false) {
      barcodeImageSrc = await this.barcodeGenerator.generate({
        value: options.barcode.value,
      });
    }

    // 3. Build HTML
    const builder = new HtmlLabelBuilder()
      .withQr(qrImageSrc)
      .withFields(options.fields || []);

    if (options.logo && options.logo.enabled !== false && options.logo.src) {
      builder.withLogo(options.logo.src);
    }

    if (barcodeImageSrc) {
      builder.withBarcode(barcodeImageSrc);
    }

    // 4. Return HTML
    return builder.build();
  }
}
