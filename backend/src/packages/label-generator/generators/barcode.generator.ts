import * as bwipjs from 'bwip-js';
import { BarcodeOptions } from '../interfaces/barcode.interface';
import { labelGeneratorConfig } from '../config/label-generator.config';

export class BarcodeGenerator {
  /**
   * Generates a base64 encoded PNG image string for a Code128 barcode.
   * @param options BarcodeOptions containing the value to encode.
   * @returns Promise resolving to a base64 string.
   */
  async generate(options: BarcodeOptions): Promise<string> {
    if (!options.value) {
      throw new Error('Barcode value cannot be empty');
    }

    return new Promise((resolve, reject) => {
      bwipjs.toBuffer(
        {
          bcid: 'code128',
          text: options.value,
          scale: labelGeneratorConfig.barcode.scale,
          height: labelGeneratorConfig.barcode.height,
          includetext: labelGeneratorConfig.barcode.includetext,
          textxalign: labelGeneratorConfig.barcode.textxalign as any,
        },
        (err, pngBuffer) => {
          if (err) {
            const errorMessage = typeof err === 'string' ? err : err.message;
            reject(new Error(`Failed to generate Barcode: ${errorMessage}`));
          } else {
            const dataUrl = `data:image/png;base64,${pngBuffer.toString('base64')}`;
            resolve(dataUrl);
          }
        },
      );
    });
  }
}
