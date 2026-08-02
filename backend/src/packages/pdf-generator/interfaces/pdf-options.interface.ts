export interface PdfOptions {
  /**
   * Paper format. If set, takes priority over width or height options.
   * Defaults to 'A4'.
   */
  format?: 'A4' | 'A5' | 'A6' | 'Letter' | 'Legal' | 'Tabloid';
  
  /**
   * Paper width, accepts values labeled with units (e.g. '100mm', '10cm', '800px').
   */
  width?: string | number;
  
  /**
   * Paper height, accepts values labeled with units (e.g. '150mm', '10cm', '800px').
   */
  height?: string | number;
  
  /**
   * Paper orientation.
   * Defaults to false (portrait).
   */
  landscape?: boolean;
  
  /**
   * Print background graphics.
   * Defaults to true for our specific use cases.
   */
  printBackground?: boolean;
  
  /**
   * Scale of the webpage rendering.
   * Defaults to 1.
   */
  scale?: number;
  
  /**
   * Paper margins.
   */
  margin?: {
    top?: string | number;
    right?: string | number;
    bottom?: string | number;
    left?: string | number;
  };
}
