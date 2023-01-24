{{ ossHeader }}

## Getting Started :running:

### Requirements

- Node version [10.13 or higher](https://nodejs.org/en/download/) is required
- A Momento Auth Token is required, you can generate one using the [Momento CLI](https://github.com/momentohq/momento-cli)

### Examples

Ready to dive right in? Just check out the [examples](./examples/README.md) directory for complete, working examples of
how to use the SDK.

### Installation

Use `npm` to install Momento:

```bash
npm install @gomomento/sdk
```

### Usage

Checkout our [examples](./examples/README.md) directory for complete examples of how to use the SDK.

Here is a quickstart you can use in your own project:

```typescript
{{ usageExampleCode }}
```

Momento also supports storing pure bytes,

```typescript
const key = new Uint8Array([109, 111, 109, 101, 110, 116, 111]);
const value = new Uint8Array([
  109, 111, 109, 101, 110, 116, 111, 32, 105, 115, 32, 97, 119, 101, 115, 111,
  109, 101, 33, 33, 33,
]);
const setResponse = await momento.set('cache', key, value, 50);
const getResponse = await momento.get('cache', key);
```

Handling cache misses,

```typescript
const getResponse = await cache.get('cache', 'non-existent key');
if (getResponse instanceof CacheGet.Miss) {
  console.log('cache miss');
}
```

And storing files.

```typescript
const buffer = fs.readFileSync('./file.txt');
const filebytes = Uint8Array.from(buffer);
const cacheKey = 'key';
const cacheName = 'my example cache';

// store file in cache
const setResponse = await momento.set(cacheName, cacheKey, filebytes);

// retrieve file from cache
const getResponse = await momento.get(cacheName, cacheKey);

// write file to disk
if (getResponse instanceof CacheGet.Hit) {
  fs.writeFileSync('./file-from-cache.txt', Buffer.from(getResponse.valueUint8Array()));
}
```

### Error Handling

Errors that occur in calls to `SimpleCacheClient` methods are surfaced to developers as part of the return values of
the calls, as opposed to by throwing exceptions. This makes them more visible, and allows your IDE to be more
helpful in ensuring that you've handled the ones you care about. (For more on our philosophy about this, see our
blog post on why [Exceptions are bugs](https://www.gomomento.com/blog/exceptions-are-bugs). And send us any
feedback you have!)

The preferred way of interpreting the return values from `SimpleCacheClient` methods is
using `instanceof` to match and handle the specific response type. Here's a quick example:

```typescript
const getResponse = await client.get(CACHE_NAME, KEY);
if (getResponse instanceof CacheGet.Hit) {
    console.log(`Looked up value: ${getResponse.valueString()}`);
} else {
    // you can handle other cases via pattern matching in "else if" blocks, or a default case
    // via an `else` block.  For each conditional, your IDE should be able to give you code
    // completion indicating the possible types; in this case, `CacheGet.Miss` and `CacheGet.Error`.
}
```

Using this approach, you get a type-safe response object in the case of a cache hit. But if the cache read
results in a Miss or an error, you'll also get a type-safe object that you can use to get more info about what happened.

In cases where you get an error response, it will always include an `ErrorCode` that you can use to check
the error type:

```typescript
const getResponse = await client.get(CACHE_NAME, KEY);
if (getResponse instanceof CacheGet.Error) {
    if (getResponse.errorCode() == MomentoErrorCode.TIMEOUT_ERROR) {
       // this would represent a client-side timeout, and you could fall back to your original data source
    }
}
```

Note that, outside of `SimpleCacheClient` responses, exceptions can occur and should be handled as usual. For example,
trying to instantiate a `SimpleCacheClient` with an invalid authentication token will result in an
`IllegalArgumentException` being thrown.

### Tuning

TODO: Coming Soon

{{ ossFooter }}
