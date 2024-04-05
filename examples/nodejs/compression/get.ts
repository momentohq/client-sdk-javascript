const getResponse = await cacheClient.get(
  'my-cache',
  'my-key',
  {
    decompressionMode: DecompressionMode.Enabled,
  }
);
