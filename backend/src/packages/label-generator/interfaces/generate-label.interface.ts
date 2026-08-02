import { LogoOptions } from './logo.interface';
import { QROptions } from './qr.interface';
import { BarcodeOptions } from './barcode.interface';
import { FieldOptions } from './field.interface';

export interface GenerateLabelOptions {
  logo?: LogoOptions;
  qr: QROptions;
  barcode?: BarcodeOptions;
  fields: FieldOptions[];
}
