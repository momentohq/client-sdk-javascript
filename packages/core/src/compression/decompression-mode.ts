/**
 * When compressing a value, you may choose between these different modes to control the trade-off between compressionLevel speed and compressionLevel ratio.
 */
export enum DecompressionMode {
  /**
   * Decompress the value if it is compressed.
   * @type {DecompressionMode.Enabled}
   */
  Enabled = 'Enabled',
  /**
   * Do not decompress the value.
   * @type {DecompressionMode.Disabled}
   */
  Disabled = 'Disabled',
}
