// /// <reference types="@fastly/js-compute" />
// import { Backend } from "fastly:backend";
// import { env } from "fastly:env";

import {CacheClient, Configurations, CredentialProvider} from '@gomomento/sdk';
// import {InternalSuperUserPermissions} from '@gomomento/sdk-core/dist/src/internal/utils';
// import XMLHttpRequestPolyfill from 'xhr4sw';
// import Promise from 'promise-polyfill';

// The entry point for your application.
//
// Use this fetch event listener to define your main request handling logic. It
// could be used to route based on the request properties (such as method or
// path), send the request to a backend, make completely new requests, and/or
// generate synthetic responses.

// addEventListener("fetch", (event) => {
//   Object.defineProperty(self, 'XMLHttpRequest', {
//     configurable: false,
//     enumerable: true,
//     writable: false,
//     value: XMLHttpRequestPolyfill
//   });

//   event.respondWith(handleRequest(event));
// });

async function handleRequest(version: string) {
  console.log('Momento connection:', version);

  // Log service version
  // console.log("FASTLY_SERVICE_VERSION:", env('FASTLY_SERVICE_VERSION') || 'local');

  // Get the client request.
  // let req = event.request;

  // Filter requests that have unexpected methods.
  // if (!["HEAD", "GET", "PURGE"].includes(req.method)) {
  //   return new Response("This method is not allowed", {
  //     status: 405,
  //   });
  // }

  // let url = new URL(req.url);
  // console.log("What's the url?", url.pathname);

  // If request is to the `/` path...
  // if (url.pathname === "/") {
  const key = 'key';
  const value = 'value';

  // Set these values
  const cache = 'fastly-cache';
  const apiKey =
    'eyJlbmRwb2ludCI6ImNlbGwtNC11cy13ZXN0LTItMS5wcm9kLmEubW9tZW50b2hxLmNvbSIsImFwaV9rZXkiOiJleUpoYkdjaU9pSklVekkxTmlKOS5leUp6ZFdJaU9pSmhibWwwWVVCdGIyMWxiblJ2YUhFdVkyOXRJaXdpZG1WeUlqb3hMQ0p3SWpvaVJXaFpTMFpCYjFORFFVVmhSR2R2VFZwdFJucGtSM2cxVEZkT2FGa3lhR3dpTENKbGVIQWlPakUyT1RJd05EazVOemg5LjJmb0VaZm1pTU4xMzUwZGg1YjBBc1lwYTBJTUM5YlIwbHB3ZDNvTkdFNFUifQ==';
  const endpoint = 'https://api.cache.cell-4-us-west-2-1.prod.a.momentohq.com';

  /** Momento Web SDK Attempt */
  // ts-nocheck
  if (version === 'sdk') {
    const cacheClient = new CacheClient({
      configuration: Configurations.Laptop.v1(), // instead of Browser.latest()
      credentialProvider: CredentialProvider.fromString({
        authToken: apiKey,
      }),
      defaultTtlSeconds: 60,
    });
    console.log('Set up the cacheClient');

    // return new Response("Just sanity checking", {
    //   status: 200,
    // });

    // let res;

    try {
      console.log('Attempting to set item in cache', cache);
      const setResp = await cacheClient.set(cache, key, value);
      console.log('setResp', setResp.toString());
      // cacheClient.set(cache, key, value).then(res => console.log("setResp", res));
    } catch (error) {
      console.error(error);
    }

    try {
      console.log('Attempting to get item from cache', cache);
      const getResp = await cacheClient.get(cache, key);
      console.log('getResp', getResp.toString());
      // res = getResp.toString();
    } catch (error) {
      console.error(error);
    }

    // const deleteResp = await cacheClient.delete(cache, key);
    // console.log("deleteResp", deleteResp);

    // return new Response(JSON.stringify({ response: res }), {
    // 	headers: { "Content-Type": "application/json" },
    // });

    // return new Response("Making it to the end?", {
    // 	status: 200,
    // });
    console.log('made it to the end');
  } else if (version === 'http') {
    /** Momento HTTP API Attempt */
    // const backend = new Backend({
    // 	name: 'momento_service',
    // 	target: endpoint,
    // 	useSSL: true,
    // });

    const client = new MomentoFetcher(apiKey, endpoint);

    // setting a value into cache
    const setResp = await client.set(cache, key, value);
    console.log('set the value', setResp);

    // getting a value from cache
    const getResp = await client.get(cache, key);
    console.log('getResp', getResp);

    // deleting a value from cache
    // const deleteResp = await client.delete(cache, key);
    // console.log("deleteResp", deleteResp);

    // return new Response(JSON.stringify({ response: getResp }), {
    // 	headers: { "Content-Type": "application/json" },
    // });

    // return new Response("Making it to the end?", {
    // 	status: 200,
    // });
    console.log('made it to the end');
  } else {
    throw new Error('Not connecting to Momento via web SDK or HTTP API');
  }
}

// Catch all other requests and return a 404.
// return new Response("The page you requested could not be found", {
//   status: 404,
// });
// }

// MomentoFetcher defined by Matt in first Cloudflare example using HTTP API

class MomentoFetcher {
  private readonly apiToken: string;
  private readonly baseurl: string;
  // private readonly backend: Backend;

  constructor(token: string, endpoint: string) {
    this.apiToken = token;
    this.baseurl = `${endpoint}/cache`;
    // this.backend = backend;
  }

  async get(cacheName: string, key: string) {
    // @ts-ignore
    const resp = await fetch(
      `${this.baseurl}/${cacheName}?key=${key}&token=${this.apiToken}`,
      {method: 'GET'}
      // { backend: this.backend.toString() }
    );
    if (resp.status < 300) {
      console.log(`successfully retrieved ${key} from cache`);
    } else {
      throw new Error(`failed to retrieve item from cache: ${cacheName} with status code ${resp.status}`);
    }

    return await resp.text();
  }

  async set(cacheName: string, key: string, value: string, ttl_seconds = 30) {
    // @ts-ignore
    const resp = await fetch(
      `${this.baseurl}/${cacheName}?key=${key}&token=${this.apiToken}&ttl_seconds=${ttl_seconds}`,
      {
        method: 'PUT',
        body: value,
        // backend: this.backend.toString()
      }
    );

    if (resp.status < 300) {
      console.log(`successfully set ${key} into cache`);
    } else {
      throw new Error(
        `failed to set item into cache message: ${resp.statusText} status: ${resp.status} cache: ${cacheName}`
      );
    }

    return resp.status;
  }

  async delete(cacheName: string, key: string) {
    // @ts-ignore
    const resp = await fetch(`${this.baseurl}/${cacheName}?key=${key}&token=${this.apiToken}`, {
      method: 'DELETE',
      // backend: this.backend.toString()
    });
    if (resp.status < 300) {
      console.log(`successfully deleted ${key} from cache`);
    } else {
      throw new Error(
        `failed to delete ${key} from cache. Message: ${resp.statusText}; Status: ${resp.status} cache: ${cacheName}`
      );
    }

    return resp;
  }
}

// call handleRequest and test inside of function works as expected
// then determine if it's a fastly problem
handleRequest('sdk').then();
