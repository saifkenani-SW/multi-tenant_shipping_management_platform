import { FieldOptions } from '../interfaces/field.interface';
import { labelGeneratorConfig } from '../config/label-generator.config';

export function getDefaultLabelTemplate(data: {
  logoImageSrc?: string;
  qrImageSrc: string;
  barcodeImageSrc?: string;
  fields: FieldOptions[];
}): string {
  const { logoImageSrc, qrImageSrc, barcodeImageSrc, fields } = data;
  const config = labelGeneratorConfig;

  let logoHtml = '';
  if (logoImageSrc) {
    logoHtml = `
      <div class="logo-container">
        <img src="${logoImageSrc}" alt="Logo" class="logo-img" />
      </div>
    `;
  }

  let barcodeHtml = '';
  if (barcodeImageSrc) {
    barcodeHtml = `
      <div class="barcode-container">
        <img src="${barcodeImageSrc}" alt="Barcode" class="barcode-img" />
      </div>
    `;
  }

  const fieldsHtml = fields
    .map(
      (field) => `
      <div class="field-container">
        <span class="field-label">${field.label}</span>
        <span class="field-value">${field.value}</span>
      </div>
    `,
    )
    .join('');

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        :root {
          --primary-rgb: ${config.colors.primary};
          --secondary-rgb: ${config.colors.secondary};
        }

        body {
          margin: 0;
          padding: 0;
          width: 100%;
          height: 100vh;
          font-family: ${config.typography.fontFamily};
          box-sizing: border-box;
          background-color: white;
          overflow: hidden; /* Prevent page break */
        }
        
        .label-wrapper {
          width: 100%;
          height: 100%;
          padding: 16px;
          background-color: white;
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
        }

        /* --- Header: Logo --- */
        .header {
          display: flex;
          justify-content: center;
          align-items: center;
          padding-bottom: 20px;
          border-bottom: 3px solid rgb(var(--primary-rgb));
          margin-bottom: 20px;
        }

        .logo-container {
          display: flex;
          justify-content: center;
          align-items: center;
          width: 100%;
        }

        .logo-img {
          max-width: ${config.logo.maxWidth};
          max-height: ${config.logo.maxHeight};
          object-fit: contain;
        }

        /* --- Barcode Section --- */
        .barcode-container {
          display: flex;
          justify-content: center;
          align-items: center;
          margin-bottom: 24px;
          padding: 16px;
          background-color: rgba(var(--primary-rgb), 0.03);
          border-radius: 12px;
          border: 1px dashed rgba(var(--primary-rgb), 0.3);
        }

        .barcode-img {
          max-width: 90%;
          max-height: 80px;
          object-fit: contain;
        }

        /* --- Details Section (Fields + QR) --- */
        .details-section {
          display: flex;
          flex-direction: row;
          justify-content: space-between;
          align-items: stretch;
          flex: 1;
          gap: 20px;
        }

        .fields-wrapper {
          display: flex;
          flex-direction: column;
          gap: 12px;
          flex: 2;
        }

        .field-container {
          display: flex;
          flex-direction: column;
          justify-content: center;
          background-color: #ffffff;
          padding: 12px 16px;
          border-radius: 8px;
          border-left: 5px solid rgb(var(--primary-rgb));
          box-shadow: 0 2px 4px rgba(0,0,0,0.04);
        }

        .field-label {
          font-size: ${config.typography.fontSize.small};
          color: rgba(0,0,0,0.5);
          text-transform: uppercase;
          font-weight: 700;
          letter-spacing: 0.8px;
          margin-bottom: 6px;
        }

        .field-value {
          font-size: ${config.typography.fontSize.medium};
          font-weight: 800;
          color: rgb(var(--secondary-rgb));
          word-break: break-word;
        }

        /* --- QR Code Section --- */
        .qr-section {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          flex: 1;
          background-color: rgba(var(--secondary-rgb), 0.03);
          border-radius: 12px;
          padding: 16px;
          border: 1px solid rgba(var(--secondary-rgb), 0.1);
        }

        .qr-img {
          width: ${config.qrCode.width}px;
          height: ${config.qrCode.width}px;
          border-radius: 8px;
          margin-bottom: 12px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.08);
          background-color: white;
          padding: 4px;
        }

        .qr-text {
          font-size: 11px;
          font-weight: 800;
          color: rgb(var(--primary-rgb));
          text-transform: uppercase;
          letter-spacing: 1px;
          text-align: center;
        }

      </style>
    </head>
    <body>
      <div class="label-wrapper">
        <div class="header">
          ${logoHtml}
        </div>
        
        ${barcodeHtml}

        <div class="details-section">
          <div class="fields-wrapper">
            ${fieldsHtml}
          </div>
          
          <div class="qr-section">
            <img src="${qrImageSrc}" alt="QR Code" class="qr-img" />
            <div class="qr-text">Scan To Track</div>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}
