export const labelGeneratorConfig = {
  pageSize: {
    width: '100mm',
    height: '150mm', // standard shipping label size (4x6 inches)
  },
  qrCode: {
    width: 150,
    margin: 1,
    color: {
      dark: '#000000',
      light: '#ffffff',
    },
  },
  barcode: {
    height: 12, // in millimeters
    includetext: true,
    textxalign: 'center',
    scale: 1, // reduced scale to prevent it from being too wide
  },
  logo: {
    maxWidth: '250px', // larger logo
    maxHeight: '80px',
  },
  colors: {
    primary: '26, 86, 232', // Figma Blue Primary (rgb)
    secondary: '210, 54, 0', // Figma Orange Secondary (rgb)
  },
  typography: {
    fontFamily: 'Arial, sans-serif',
    fontSize: {
      small: '10px',
      medium: '12px',
      large: '16px',
      title: '24px',
    },
  },
  layout: {
    padding: '10mm',
    gap: '15px',
  },
};
