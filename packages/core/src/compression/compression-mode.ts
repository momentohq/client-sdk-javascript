/**
 * When compressing a value, you may choose between these different modes to control the trade-off between compression speed and compression ratio.
 */
export enum CompressionMode {
  /**
   * The default compression mode; provides a good balance between speed and compression ratio.
   * @type {CompressionMode.Default}
   */
  Default = 'Default',
  /**
   * The fastest compression mode; provides the fastest compression speed, prioritizing reduction in CPU usage over compression ratio.
   * @type {CompressionMode.Fast}
   */
  Fast = 'Fast',
  /**
   * The smallest compression mode; provides the best compression ratio, prioritizing reduction in storage space over compression speed.
   * @type {CompressionMode.Smallest}
   */
  Smallest = 'Smallest',
}
