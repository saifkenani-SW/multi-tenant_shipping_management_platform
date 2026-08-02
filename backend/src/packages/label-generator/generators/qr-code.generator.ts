import * as qrcode from 'qrcode';
import { QROptions } from '../interfaces/qr.interface';
import { labelGeneratorConfig } from '../config/label-generator.config';

export class QRCodeGenerator {
  /**
   * Generates a base64 encoded PNG image string for a QR code.
   * @param options QROptions containing the value to encode.
   * @returns Promise resolving to a base64 string.
   */
  async generate(options: QROptions): Promise<string> {
    if (!options.value) {
      throw new Error('QR code value cannot be empty');
    }

    try {
      const qrDataUrl = await qrcode.toDataURL(options.value, {
        width: labelGeneratorConfig.qrCode.width,
        margin: labelGeneratorConfig.qrCode.margin,
        color: labelGeneratorConfig.qrCode.color,
      });

      return qrDataUrl;
    } catch (error) {
      throw new Error(`Failed to generate QR code: ${(error as Error).message}`);
    }
  }
}
