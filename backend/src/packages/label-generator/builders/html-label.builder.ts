import { FieldOptions } from '../interfaces/field.interface';
import { getDefaultLabelTemplate } from '../templates/default-label.template';

export class HtmlLabelBuilder {
  private logoImageSrc?: string;
  private qrImageSrc: string = '';
  private barcodeImageSrc?: string;
  private fields: FieldOptions[] = [];

  withLogo(src?: string): this {
    this.logoImageSrc = src;
    return this;
  }

  withQr(src: string): this {
    this.qrImageSrc = src;
    return this;
  }

  withBarcode(src?: string): this {
    this.barcodeImageSrc = src;
    return this;
  }

  withFields(fields: FieldOptions[]): this {
    this.fields = fields;
    return this;
  }

  build(): string {
    if (!this.qrImageSrc) {
      throw new Error('QR Image Source is required to build the label.');
    }

    return getDefaultLabelTemplate({
      logoImageSrc: this.logoImageSrc,
      qrImageSrc: this.qrImageSrc,
      barcodeImageSrc: this.barcodeImageSrc,
      fields: this.fields,
    });
  }
}
