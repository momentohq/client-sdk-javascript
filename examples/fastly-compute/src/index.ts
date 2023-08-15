// Ramya's implementation

/// <reference types="@fastly/js-compute" />
import { env } from "fastly:env";
import { ConfigStore } from "fastly:config-store";

import { enableDebugLogging } from "fastly:experimental";
enableDebugLogging(true);

async function get(authToken: string, httpEndpoint: string, backend: string, cacheName: string, key: string): Promise<string> {

  const getUrl = `https://${httpEndpoint}/cache/${cacheName}?key=${key}&token=${authToken}`;
  const getResp = await fetch(getUrl, { backend: backend });
  if (getResp.status >= 200 && getResp.status < 300) {
    const value = await getResp.text();
    console.log(`successfully retrieved ${key} from cache ${cacheName}: ${value}`);
    return value;
  } else if (getResp.status == 404) {
    const value = await getResp.text();
    console.log(`${key} not found or cache ${cacheName} not found: ${value}`);
    return "";
  } else {
    throw new Error(`failed to retrieve item: ${getResp.statusText} status: ${getResp.status} cache: ${cacheName}`);
  }
}

async function set(authToken: string, httpEndpoint: string, backend: string, cacheName: string, key: string, value: string, ttlSeconds: number = 300) {
  // set a value in the cache:
  const setUrl =  `https://${httpEndpoint}/cache/${cacheName}?key=${key}&token=${authToken}&ttl_seconds=${ttlSeconds}`;
  const setResp = await fetch(
   setUrl,
    {
      method: 'PUT',
      body: value,
      backend: backend,
    }
  );

  if (setResp.status >= 200 && setResp.status < 300) {
    console.log(`successfully set ${key} into cache`);
  } else {
    throw new Error(
    `failed to set item: ${setResp.statusText} status: ${setResp.status} cache: ${cacheName}`
    );
  }
}

  // The entry point for your application.
//
// Use this fetch event listener to define your main request handling logic. It
// could be used to route based on the request properties (such as method or
// path), send the request to a backend, make completely new requests, and/or
// generate synthetic responses.
addEventListener("fetch", (event) => event.respondWith(handleRequest(event)));

async function handleRequest(event: FetchEvent) {
    // Log service version
    console.log("FASTLY_SERVICE_VERSION:", env('FASTLY_SERVICE_VERSION') || 'local');
    // Get the client request.
    const req = event.request;
    console.log(`request url: ${req.url}`);

    const secrets = new ConfigStore("secrets");
    const authToken = secrets.get("MOMENTO_TOKEN");
    if (!authToken) {
      return new Response("Missing required env var MOMENTO_TOKEN", {
        status: 500,
      });
    }
    const cacheName = secrets.get("MOMENTO_CACHE");
    if (!cacheName) {
      return new Response("Missing required env var MOMENTO_CACHE", {
        status: 500,
      });
    }
    const httpEndpoint = secrets.get("MOMENTO_HTTP_ENDPOINT");
    if (!httpEndpoint) {
      return new Response("Missing required env var MOMENTO_HTTP_ENDPOINT", {
        status: 500,
      });
    }
    const backend = secrets.get("MOMENTO_BACKEND");
    if (!backend) {
      return new Response("Missing required env var MOMENTO_BACKEND", {
        status: 500,
      });
    }

    try {
      console.log("Running momento example");
      const testKey = "IAmATestKey";
      const testValue = "Far out in the uncharted backwaters of the unfashionable end of the western spiral arm of the Galaxy lies a small unregarded yellow sun";
      const getResp = await get(authToken, httpEndpoint, backend, cacheName, testKey);
      console.log(`${getResp}`);
      const setResp = await set(authToken, httpEndpoint, backend, cacheName, testKey, testValue, 10);
      const getRespAfterSet = await get(authToken, httpEndpoint, backend, cacheName, testKey);
      console.log(`${getRespAfterSet}`);
      // Send a default synthetic response.
      return new Response("Tested get and set successfully", {
        status: 200,
        headers: new Headers({ "Content-Type": "text/html; charset=utf-8" }),
      });
  } catch (e) {
    if (e instanceof Error) {
      return new Response(`Caught exception: ${e.message}`, {
        status: 500,
      });
    } else {
      return new Response("Unknown error", {
        status: 500,
      });
    }
  }
};

