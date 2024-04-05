/**
 * When compressing a value, you may choose between these different modes to control the trade-off between compressionLevel speed and compressionLevel ratio.
 */
export enum CompressionLevel {
  /**
   * The balanced compressionLevel mode; provides a good balance between speed and compressionLevel ratio.
   * @type {CompressionLevel.Default}
   */
  Balanced = 'Balanced',
  /**
   * The fastest compressionLevel mode; provides the fastest compressionLevel speed, prioritizing reduction in CPU usage over compressionLevel ratio.
   * @type {CompressionLevel.Fastest}
   */
  Fastest = 'Fastest',
  /**
   * The smallest compressionLevel mode; provides the best compressionLevel ratio, prioritizing reduction in storage space over compressionLevel speed.
   * @type {CompressionLevel.SmallestSize}
   */
  SmallestSize = 'SmallestSize',
}
