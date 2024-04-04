const setResponse = await cacheClient.set(
  'my-cache',
  'my-key',
  'my-value',
  {
    compression: CompressionMode.Default,
  }
);
