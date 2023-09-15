//! Default Compute@Edge template program.

// These imports are provided by the Fastly runtime, ESLint can ignore

// eslint-disable-next-line
/// <reference types="@fastly/js-compute" />
// eslint-disable-next-line
import {env} from 'fastly:env';
// eslint-disable-next-line
import {ConfigStore} from 'fastly:config-store';
// eslint-disable-next-line
import {enableDebugLogging} from 'fastly:experimental';

enableDebugLogging(true);

// The entry point for your application.
//
// Use this fetch event listener to define your main request handling logic. It
// could be used to route based on the request properties (such as method or
// path), send the request to a backend, make completely new requests, and/or
// generate synthetic responses.
addEventListener('fetch', event => event.respondWith(handleRequest(event)));

async function handleRequest(event: FetchEvent) {
  // Log Fastly service version
  console.log('FASTLY_SERVICE_VERSION:', env('FASTLY_SERVICE_VERSION') || 'local');

  // Receive the client request.
  const req = event.request;
  console.log(`Received request url: ${req.url}`);

  // Connect to the Config Store. Make sure the name matches what was specified in the fastly.toml
  const secrets = new ConfigStore('secrets');
  console.log('Connected to the Fastly Config Store');

  // Get all required information from the Config Store
  // Note: for production environments, the Momento API key should be saved in a Fastly Secret Store
  const apiKey = secrets.get('MOMENTO_API_KEY');
  if (!apiKey) {
    return new Response('Missing required env var MOMENTO_API_KEY', {
      status: 500,
    });
  }
  const cacheName = secrets.get('MOMENTO_CACHE');
  if (!cacheName) {
    return new Response('Missing required env var MOMENTO_CACHE', {
      status: 500,
    });
  }
  const httpEndpoint = secrets.get('MOMENTO_HTTP_ENDPOINT');
  if (!httpEndpoint) {
    return new Response('Missing required env var MOMENTO_HTTP_ENDPOINT', {
      status: 500,
    });
  }
  const backend = secrets.get('MOMENTO_BACKEND');
  if (!backend) {
    return new Response('Missing required env var MOMENTO_BACKEND', {
      status: 500,
    });
  }

  const key = 'momento';
  const value = 'serverless';

  try {
    const momento = new MomentoFetcher(apiKey, httpEndpoint, backend);

    const getResp = await momento.get(cacheName, key);
    console.log(`Fetching the key when the cache is empty: ${getResp}`);

    await momento.set(cacheName, key, value, 10);
    console.log(`Set the key-value pair in the cache ${cacheName}`);

    const getRespAfterSet = await momento.get(cacheName, key);
    console.log(`Fetching the key after setting the value: ${getRespAfterSet}`);

    await momento.delete(cacheName, key);
    console.log(`Deleted the key-value pair from the cache ${cacheName}`);

    return new Response(`Tested the Momento cache using: <br /> Key: ${key} | Value: ${value}`, {
      status: 200,
      headers: new Headers({'Content-Type': 'text/html; charset=utf-8'}),
    });
  } catch (e) {
    if (e instanceof Error) {
      return new Response(`Caught exception while running the Momento example: ${e.message}`, {
        status: 500,
      });
    } else {
      return new Response('Error running the Momento example', {
        status: 500,
      });
    }
  }
}

class MomentoFetcher {
  private readonly apiToken: string;
  private readonly baseurl: string;
  private readonly backend: string;

  constructor(token: string, endpoint: string, backend: string) {
    this.apiToken = token;
    this.baseurl = `https://${endpoint}/cache`;
    this.backend = backend;
  }

  async get(cacheName: string, key: string) {
    const resp = await fetch(`${this.baseurl}/${cacheName}?key=${key}&token=${this.apiToken}`, {backend: this.backend});

    if (resp.status >= 200 && resp.status < 300) {
      const value = await resp.text();
      console.log(`successfully retrieved ${key} from cache ${cacheName}: ${value}`);
      return value;
    } else if (resp.status === 404) {
      const value = await resp.text();
      console.log(`${key} not found or cache ${cacheName} not found: ${value}`);
      return '';
    } else {
      throw new Error(
        `failed to retrieve item from cache ${cacheName}. Message: ${resp.statusText} | Status: ${resp.status}`
      );
    }
  }

  async set(cacheName: string, key: string, value: string, ttl_seconds = 30) {
    const resp = await fetch(
      `${this.baseurl}/${cacheName}?key=${key}&token=${this.apiToken}&ttl_seconds=${ttl_seconds}`,
      {
        method: 'PUT',
        body: value,
        backend: this.backend,
      }
    );

    if (resp.status >= 200 && resp.status < 300) {
      console.log(`successfully set ${key} into cache`);
    } else {
      throw new Error(
        `failed to set item into cache ${cacheName}. Message: ${resp.statusText} | Status: ${resp.status}`
      );
    }

    return resp.status;
  }

  async delete(cacheName: string, key: string) {
    const resp = await fetch(`${this.baseurl}/${cacheName}?key=${key}&token=${this.apiToken}`, {
      method: 'DELETE',
      backend: this.backend,
    });
    if (resp.status >= 200 && resp.status < 300) {
      console.log(`successfully deleted ${key} from cache ${cacheName}`);
    } else {
      throw new Error(
        `failed to delete ${key} from cache ${cacheName}. Message: ${resp.statusText} | Status: ${resp.status}`
      );
    }

    return resp.text();
  }
}
