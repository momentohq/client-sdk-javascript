// Basic HTTP server that uses the Momento web SDK to create a cache
// and set, get, and delete an item from a cache

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
		configuration: Configurations.Laptop.v1(),
		credentialProvider: CredentialProvider.fromString({
			authToken: env['MOMENTO_AUTH_TOKEN'],
		}),
		defaultTtlSeconds: 60,
	})

	const createCacheResponse = await momento.createCache('cache')
	if (createCacheResponse instanceof CreateCache.AlreadyExists) {
		console.log('cache already exists')
	} else if (createCacheResponse instanceof CreateCache.Error) {
		throw createCacheResponse.innerException()
	}

	console.log('Storing key=foo, value=FOO')
	const setResponse = await momento.set('cache', 'foo', 'FOO')
	if (setResponse instanceof CacheSet.Success) {
		console.log('Key stored successfully!')
	} else {
		console.log(`Error setting key: ${setResponse.toString()}`)
	}

	const getResponse = await momento.get('cache', 'foo')
	if (getResponse instanceof CacheGet.Hit) {
		console.log(`cache hit: ${getResponse.valueString()}`)
	} else if (getResponse instanceof CacheGet.Miss) {
		console.log('cache miss')
	} else if (getResponse instanceof CacheGet.Error) {
		console.log(`Error: ${getResponse.message()}`)
	}

	return new Response(getResponse.body, {
		status: getResponse.status,
		headers: {
			'content-type': 'application/json',
		},
	})
}

serve(handler)
