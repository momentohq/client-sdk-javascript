// Basic HTTP server that uses the Momento web SDK to set, get, and delete an item from a cache

import { serve } from "https://deno.land/std@0.198.0/http/server.ts";
import {CacheClient, Configurations, CredentialProvider, CreateCache, CacheSet, CacheGet} from "npm:@gomomento/sdk-web@1.30.0";
import XMLHttpRequestPolyfill from "npm:xhr4sw@0.0.5";

Deno.env.set("MOMENTO_AUTH_TOKEN", "<your Momento auth token>");

const handler = async (_request: Request): Promise<Response> => {
  Object.defineProperty(self, 'XMLHttpRequest', {
    configurable: false,
    enumerable: true,
    writable: false,
    value: XMLHttpRequestPolyfill
  });

  const momento = new CacheClient({
    configuration: Configurations.Laptop.v1(),
    credentialProvider: CredentialProvider.fromString({
      authToken: Deno.env.get('MOMENTO_AUTH_TOKEN'),
    }),
    defaultTtlSeconds: 60,
  });

  const createCacheResponse = await momento.createCache('cache');
  if (createCacheResponse instanceof CreateCache.AlreadyExists) {
    console.log('cache already exists');
  } else if (createCacheResponse instanceof CreateCache.Error) {
    throw createCacheResponse.innerException();
  }

  console.log('Storing key=foo, value=FOO');
  const setResponse = await momento.set('cache', 'foo', 'FOO');
  if (setResponse instanceof CacheSet.Success) {
    console.log('Key stored successfully!');
  } else {
    console.log(`Error setting key: ${setResponse.toString()}`);
  }

  const getResponse = await momento.get('cache', 'foo');
  if (getResponse instanceof CacheGet.Hit) {
    console.log(`cache hit: ${getResponse.valueString()}`);
  } else if (getResponse instanceof CacheGet.Miss) {
    console.log('cache miss');
  } else if (getResponse instanceof CacheGet.Error) {
    console.log(`Error: ${getResponse.message()}`);
  }

  return new Response(getResponse.body, {
    status: getResponse.status,
    headers: {
      "content-type": "application/json",
    },
  });
};

serve(handler);