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
			console.log(`Error when getting value from cache! ${getResponse.toString()}`);
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
			console.log(`Error when setting value in cache! ${setResponse.toString()}`);
			throw new Error(`Error setting key ${key}: ${setResponse.toString()}`);
		}

		return;
	}

	async delete(cacheName: string, key: string) {
		const delResponse = await this.momento.delete(cacheName, key);
		if (delResponse instanceof CacheDelete.Success) {
			console.log(`successfully deleted ${key} from cache`);
		} else if (delResponse instanceof CacheDelete.Error) {
			console.log(`Error when deleting value from cache! ${delResponse.toString()}`);
			throw new Error(`failed to delete ${key} from cache. Message: ${delResponse.message()}; cache: ${cacheName}`);
		}

		return;
	}
}

export interface Env {
	MOMENTO_API_KEY: string;
	MOMENTO_CACHE_NAME: string;
}

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {

		if (env.MOMENTO_API_KEY === undefined) {
			throw new Error('MOMENTO_API_KEY must be set in .dev.vars for local development, and should' +
				' be uploaded to Cloudflare secrets through NPX if you are testing your worker. See README for more details')
		}

		if (env.MOMENTO_CACHE_NAME === undefined) {
			throw new Error('MOMENTO_CACHE_NAME must be set in wrangler.toml file. See README for more details')
		}

		console.log(`Creating cache client`);
		const momento = new CacheClient({
			configuration: Configurations.Laptop.v1(),
			credentialProvider: CredentialProvider.fromString({
				apiKey:env.MOMENTO_API_KEY
			}),
			defaultTtlSeconds: 60,
		});

		console.log(`Creating fetcher`);

		const client = new MomentoFetcher(momento);
		const cache = env.MOMENTO_CACHE_NAME;
		const key = "key";
		const value = "value";

		console.log(`Issuing a set`);

		// setting a value into cache
		await client.set(cache, key, value);

		console.log(`Issuing a get`);

		// getting a value from cache
		const getResponse = await client.get(cache, key)

		await client.delete(cache, key);

		// deleting a value from cache
		return new Response(JSON.stringify({ response: getResponse.toString() }));
	},
};
