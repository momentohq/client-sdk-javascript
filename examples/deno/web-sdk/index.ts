// Basic HTTP server that uses the Momento web SDK
// to set, get, and delete an item from a cache

import { serve } from 'http'
import {
	CacheClient,
	CacheGet,
	CacheSet,
	Configurations,
	CreateCache,
	CredentialProvider,
} from 'momento'
import XMLHttpRequestPolyfill from 'xhr4sw'
import { load } from 'dotenv'

const env = await load()

export const handler = async (_request: Request): Promise<Response> => {
	Object.defineProperty(self, 'XMLHttpRequest', {
		configurable: false,
		enumerable: true,
		writable: false,
		value: XMLHttpRequestPolyfill,
	})

	const momento = new CacheClient({
		configuration: Configurations.Browser.v1(),
		credentialProvider: CredentialProvider.fromString({
			authToken: env['MOMENTO_AUTH_TOKEN'],
		}),
		defaultTtlSeconds: 60,
	})

	const cacheName = env['MOMENTO_CACHE_NAME']

	console.log('Storing key=foo, value=FOO')
	const setResponse = await momento.set(cacheName, 'foo', 'FOO')
	if (setResponse instanceof CacheSet.Success) {
		console.log('Key stored successfully!')
	} else {
		console.log(`Error setting key: ${setResponse.toString()}`)
	}

	const getResponse = await momento.get(cacheName, 'foo')
	if (getResponse instanceof CacheGet.Hit) {
		console.log(`cache hit: ${getResponse.valueString()}`)
	} else if (getResponse instanceof CacheGet.Miss) {
		console.log('cache miss')
	} else if (getResponse instanceof CacheGet.Error) {
		console.log(`Error: ${getResponse.message()}`)
	}

	const deleteResponse = await momento.delete(cacheName, 'foo')
	if (deleteResponse instanceof CacheGet.Hit) {
		console.log(`cache hit: ${deleteResponse.valueString()}`)
	} else if (deleteResponse instanceof CacheGet.Miss) {
		console.log('cache miss')
	} else if (deleteResponse instanceof CacheGet.Error) {
		console.log(`Error: ${deleteResponse.message()}`)
	}

	return new Response(getResponse.body, {
		status: getResponse.status,
		headers: {
			'content-type': 'application/json',
		},
	})
}

serve(handler)
