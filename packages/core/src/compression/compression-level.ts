/**
 * When compressing a value, you may choose between these different modes to control the trade-off between compressionLevel speed and compressionLevel ratio.
 */
export enum CompressionLevel {
  /**
   * The default compressionLevel mode; provides a good balance between speed and compressionLevel ratio.
   * @type {CompressionLevel.Default}
   */
  Default = 'Default',
  /**
   * The fastest compressionLevel mode; provides the fastest compressionLevel speed, prioritizing reduction in CPU usage over compressionLevel ratio.
   * @type {CompressionLevel.Fast}
   */
  Fast = 'Fast',
  /**
   * The smallest compressionLevel mode; provides the best compressionLevel ratio, prioritizing reduction in storage space over compressionLevel speed.
   * @type {CompressionLevel.Best}
   */
  Best = 'Best',
}
