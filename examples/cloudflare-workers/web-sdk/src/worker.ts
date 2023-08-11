/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run start` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */
import {
	CacheClient, CacheDelete,
	CacheGet, CacheSet,
	Configurations, CreateCache,
	CredentialProvider,
} from "@gomomento/sdk-web";
import XMLHttpRequestPolyfill from "xhr4sw";

/**
 * This is needed to polyfill as otherwise we get HttpRequest not defined
 */
Object.defineProperty(self, 'XMLHttpRequest', {
	configurable: false,
	enumerable: true,
	writable: false,
	value: XMLHttpRequestPolyfill
});

class MomentoFetcher {
	private readonly momento: CacheClient;

	constructor(client: CacheClient) {
		this.momento = client;
	}

	async get(cacheName: string, key: string) {
		const getResponse = await this.momento.get(cacheName, key);
		if (getResponse instanceof CacheGet.Hit) {
			console.log(`cache hit: ${getResponse.valueString()}`);
		} else if (getResponse instanceof CacheGet.Miss) {
			console.log(`cache miss for key ${key}`);
		} else if (getResponse instanceof CacheGet.Error) {
			throw new Error(`Error retrieving key ${key}: ${getResponse.message()}`);
		}

		return getResponse;
	}

	async set(cacheName: string, key: string, value: string, ttl_seconds: number = 30) {
		const setResponse = await this.momento.set(cacheName, key, value, {
			ttl: ttl_seconds,
		});

		if (setResponse instanceof CacheSet.Success) {
			console.log('Key stored successfully!');
		} else if (setResponse instanceof CacheSet.Error) {
			throw new Error(`Error setting key ${key}: ${setResponse.toString()}`);
		}

		return;
	}

	async delete(cacheName: string, key: string) {
		const delResponse = await this.momento.delete(cacheName, key);
		if (delResponse instanceof CacheDelete.Success) {
			console.log(`successfully deleted ${key} from cache`);
		} else if (delResponse instanceof CacheDelete.Error) {
			throw new Error(`failed to delete ${key} from cache. Message: ${delResponse.message()}; cache: ${cacheName}`);
		}

		return;
	}
}

export interface Env {
	MOMENTO_AUTH_TOKEN: string;
	MOMENTO_CACHE_NAME: string;
}

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {

		const momento = new CacheClient({
			configuration: Configurations.Laptop.v1(),
			credentialProvider: CredentialProvider.fromString({
				authToken:env.MOMENTO_AUTH_TOKEN
			}),
			defaultTtlSeconds: 60,
		});

		const createCacheResponse = await momento.createCache('cache-web');
		if (createCacheResponse instanceof CreateCache.AlreadyExists) {
			console.log('cache already exists');
		} else if (createCacheResponse instanceof CreateCache.Error) {
			throw createCacheResponse.innerException();
		}

		const client = new MomentoFetcher(momento);
		const cache = env.MOMENTO_CACHE_NAME;
		const key = "key";
		const value = "value";

		// setting a value into cache
		await client.set(cache, key, value);

		// getting a value from cache
		const getResponse = await client.get(cache, key)

		await client.delete(cache, key);

		// deleting a value from cache
		return new Response(JSON.stringify({ response: getResponse.toString() }));
	},
};
