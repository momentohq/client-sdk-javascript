/**
 * When compressing a value, you may choose between these different modes to control the trade-off between compressionLevel speed and compressionLevel ratio.
 */
export enum CompressionLevel {
  /**
   * Provides a good balance between compression speed and compression ratio.
   * @type {CompressionLevel.Balanced}
   */
  Balanced = 'Balanced',
  /**
   * Provides the fastest compression speed, prioritizing reduction in CPU usage over compression ratio.
   * @type {CompressionLevel.Fastest}
   */
  Fastest = 'Fastest',
  /**
   * Provides the best compression ratio, prioritizing reduction in storage space over compression speed.
   * @type {CompressionLevel.SmallestSize}
   */
  SmallestSize = 'SmallestSize',
}
