/// <reference types="@fastly/js-compute" />
import { Backend } from "fastly:backend";
import { env } from "fastly:env";

import {
	AuthClient,
	CacheClient,
	Configurations,
	CredentialProvider,
	ExpiresIn,
	GenerateAuthToken,
	ListCaches,
	TokenScopes,
  } from '@gomomento/sdk-web';
  import {InternalSuperUserPermissions} from '@gomomento/sdk-core/dist/src/internal/utils';
  import XMLHttpRequestPolyfill from 'xhr4sw';
  import Promise from 'promise-polyfill';

// The entry point for your application.
//
// Use this fetch event listener to define your main request handling logic. It
// could be used to route based on the request properties (such as method or
// path), send the request to a backend, make completely new requests, and/or
// generate synthetic responses.


addEventListener("fetch", (event) => {
  Object.defineProperty(self, 'XMLHttpRequest', {
    configurable: false,
    enumerable: true,
    writable: false,
    value: XMLHttpRequestPolyfill
  });
  
  event.respondWith(handleRequest(event));
});

async function handleRequest(event: FetchEvent) {
  // Object.defineProperty(self, 'XMLHttpRequest', {
  //   configurable: false,
  //   enumerable: true,
  //   writable: false,
  //   value: XMLHttpRequestPolyfill
  // });

  // Log service version
  console.log("FASTLY_SERVICE_VERSION:", env('FASTLY_SERVICE_VERSION') || 'local');

  // Get the client request.
  let req = event.request;

  // Filter requests that have unexpected methods.
  if (!["HEAD", "GET", "PURGE"].includes(req.method)) {
    return new Response("This method is not allowed", {
      status: 405,
    });
  }

  let url = new URL(req.url);
  console.log("What's the url?", url.pathname);

  // If request is to the `/` path...
  if (url.pathname === "/") {
    const key = "key";
		const value = "value";

    // Set these values
    const cache = "<cache name here>";
    const apiKey = "<auth token here>";
    const endpoint = "<endpoint here>";
    


/** Momento Web SDK Attempt */
    const cacheClient = new CacheClient({
      configuration: Configurations.Browser.latest(),
      credentialProvider: CredentialProvider.fromString({
        authToken: apiKey
      }),
      defaultTtlSeconds: 60,
    });
    console.log("Set up the cacheClient");

    // return new Response("Just sanity checking", {
    //   status: 200,
    // });

    let res;

    // polyfill for the promise?
    // Object.defineProperty(Promise<Response>, 'XMLHttpRequest', {
    //   configurable: false,
    //   enumerable: true,
    //   writable: false,
    //   value: XMLHttpRequestPolyfill
    // });

    try {
      const setResp = await cacheClient.set(cache, key, value);
      console.log("setResp", setResp.toString());
      // cacheClient.set(cache, key, value).then(res => console.log("setResp", res));
    }
    catch (error) {
      console.error(error);
    }
    
    try {
      const getResp = await cacheClient.get(cache, key);
      console.log("getResp", getResp.toString());
      res = getResp.toString();
    }
    catch (error) {
      console.error(error);
    }
    
    // const deleteResp = await cacheClient.delete(cache, key);
    // console.log("deleteResp", deleteResp);

    return new Response(JSON.stringify({ response: res }));
/** Momento Web SDK Attempt */



/** Momento HTTP API Attempt */
    // const backend = new Backend({
    //   name: 'my_backend',
    //   target: endpoint,
    //   useSSL: true,
    // });

    // const client = new MomentoFetcher(
    //   apiKey, 
    //   endpoint,
    //   backend
    // );

		// // setting a value into cache
		// const setResp = await client.set(cache, key, value);
		// console.log("setResp", setResp);

		// // getting a value from cache
		// const getResp = await client.get(cache, key);
		// console.log("getResp", getResp);

    // // deleting a value from cache
		// const deleteResp = await client.delete(cache, key);
		// console.log("deleteResp", deleteResp);

		// return new Response(JSON.stringify({ response: getResp }));
/** Momento HTTP API Attempt */
  }

  // Catch all other requests and return a 404.
  return new Response("The page you requested could not be found", {
    status: 404,
  });
}


async function momentoExample(sessionToken: string, baseEndpoint: string): Promise<string> {

	const controlEndpoint = `control.${baseEndpoint}`;
	const cacheEndpoint = `cache.${baseEndpoint}`;
	const httpEndpoint = `api.cache.${baseEndpoint}`;
	// Here we construct an auth client, which is where the token APIs are exposed
	const authClient = new AuthClient({
	  credentialProvider: CredentialProvider.fromString({
		authToken: sessionToken,
		controlEndpoint: controlEndpoint,
		cacheEndpoint: cacheEndpoint,
	  }),
	});
  
	// Here we generate a temporary superuser token that can be used to list caches in the region
	const wizardTokenResponse = await authClient.generateAuthToken(
	  new InternalSuperUserPermissions(),
	  ExpiresIn.seconds(30)
	);
	let wizardApiToken;
	if (wizardTokenResponse instanceof GenerateAuthToken.Success) {
	  wizardApiToken = wizardTokenResponse.authToken;
	} else {
	  throw new Error(`A problem occurred when generating auth token: ${wizardTokenResponse.toString()}`);
	}
  
	// Now we create a cache client for interacting with the cache APIs
	const cacheClient = new CacheClient({
	  configuration: Configurations.Browser.latest(),
	  credentialProvider: CredentialProvider.fromString({authToken: wizardApiToken}),
	  defaultTtlSeconds: 60,
	});
  
	// Get the list of existing caches
	const listCachesResponse = await cacheClient.listCaches();
	let caches;
	if (listCachesResponse instanceof ListCaches.Success) {
	  caches = listCachesResponse.getCaches();
	} else {
	  throw new Error(`A problem occurred when listing caches: ${listCachesResponse.toString()}`);
	}
  
	let response = `Found the following caches:\n${caches.map(c => c.getName()).join('\n')}`;
	console.log(`${response}`);
  
	if (caches && caches.length != 0) {
		// arbitrarily selecting the first cache:
		const chosenCache = caches[0].getName();
	
		// Now we create a more restricted token that can be used in the user's cloudflare worker environment
		const workerTokenResponse = await authClient.generateAuthToken(
		TokenScopes.cacheReadWrite(chosenCache),
		ExpiresIn.never()
		);
	
		let workerApiToken;
		if (workerTokenResponse instanceof GenerateAuthToken.Success) {
		workerApiToken = workerTokenResponse.authToken;
		} else {
		throw new Error(`A problem occurred when generating auth token: ${workerTokenResponse.toString()}`);
		}
	
		// This is just a sanity check that the new token works properly
		await verifyWorkerApiToken(workerApiToken, httpEndpoint, chosenCache);
		// And now we're all done, and just need to store these values as secrets/env vars!
		response += `\nIntegration complete! Here are the three required env vars:
		
MOMENTO_AUTH_TOKEN=${workerApiToken}
MOMENTO_HTTP_ENDPOINT=${httpEndpoint}
MOMENTO_CACHE=${chosenCache}
			
		`;
    } else {
		response += '\nNo caches found.';
	}
	return response;

  }
  
  async function verifyWorkerApiToken(workerApiToken: string, httpEndpoint: string, cacheName: string) {
	const testKey = 'testkey';
	const testValue = 'testvalue';
  
	// set a value in the cache:
	const setResp = await fetch(
	  `https://${httpEndpoint}/cache/${cacheName}?key=${testKey}&token=${workerApiToken}&ttl_seconds=10`,
	  {
		method: 'PUT',
		body: testValue,
	  }
	);
  
	if (setResp.status < 300) {
	  console.log(`successfully set ${testKey} into cache`);
	} else {
	  throw new Error(
		`failed to set item into cache message: ${setResp.statusText} status: ${setResp.status} cache: ${cacheName}`
	  );
	}
  
	const getResp = await fetch(`https://${httpEndpoint}/cache/${cacheName}?key=${testKey}&token=${workerApiToken}`);
	if (getResp.status < 300) {
	  console.log(`successfully retrieved ${testKey} from cache`);
	} else {
	  throw new Error(`failed to retrieve item from cache: ${cacheName}`);
	}
  
	const value = await getResp.text();
	if (value === testValue) {
	  console.log('Retrieved expected value from cache!');
	} else {
	  throw new Error(`Retrieved unexpected value '${value}' from cache!`);
	}
  }




// Define Momento HTTP API interactions
class MomentoFetcher {
	private readonly apiToken: string;
	private readonly baseurl: string;
  private readonly backend: Backend;
  
	constructor(token: string, endpoint: string, backend: Backend) {
		this.apiToken = token;
		this.baseurl = `${endpoint}/cache`;
    this.backend = backend;
	}

	async get(cacheName: string, key: string) {
		const resp = await fetch(`${this.baseurl}/${cacheName}?key=${key}&token=${this.apiToken}`, { backend: this.backend.toString() });
		if (resp.status < 300) {
			console.log(`successfully retrieved ${key} from cache`)
		} else {
			throw new Error(`failed to retrieve item from cache: ${cacheName}`)
		}
		
		return await resp.text();
	}

	async set(cacheName: string, key: string, value: string, ttl_seconds: number = 30) {
		const resp = await fetch(`${this.baseurl}/${cacheName}?key=${key}&token=${this.apiToken}&ttl_seconds=${ttl_seconds}`, {
			method: 'PUT',
			body: value,
      backend: this.backend.toString()
		});

		if (resp.status < 300) {
			console.log(`successfully set ${key} into cache`);
		} else {
			throw new Error(`failed to set item into cache message: ${resp.statusText} status: ${resp.status} cache: ${cacheName}`);
		}

		return;
	}

	async delete(cacheName: string, key: string) {
		const resp = await fetch(`${this.baseurl}/${cacheName}?key=${key}&token=${this.apiToken}`, {
			method: 'DELETE',
      backend: this.backend.toString()
		});
		if (resp.status < 300) {
			console.log(`successfully deleted ${key} from cache`);
		} else {
			throw new Error(`failed to delete ${key} from cache. Message: ${resp.statusText}; Status: ${resp.status} cache: ${cacheName}`);
		}

		return resp;
	}
}

