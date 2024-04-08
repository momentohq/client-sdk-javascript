const getResponse = await cacheClient.get(
  'my-cache',
  'my-key',
  {
    decompress: true,
  }
);
