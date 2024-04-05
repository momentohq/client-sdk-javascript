const setResponse = await cacheClient.set(
  'my-cache',
  'my-key',
  'my-value',
  {
    compressionLevel: CompressionLevel.Balanced,
  }
);
