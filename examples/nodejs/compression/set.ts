const setResponse = await cacheClient.set(
  'my-cache',
  'my-key',
  'my-value',
  {
    compress: true,
  }
);
