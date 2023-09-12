// Basic HTTP server that uses the Momento web SDK
// to set, get, and delete an item from a cache

import { serve } from 'http'
import {
	CacheClient,
	CacheGet,
	CacheSet,
	Configurations,
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

	const cacheName = env['MOMENTO_CACHE_NAME']
	if (!cacheName) {
		throw new Error('Missing environment variable MOMENTO_CACHE_NAME')
	}

	const apiKey = env['MOMENTO_API_KEY']
	if (!apiKey) {
		throw new Error('Missing environment variable MOMENTO_API_KEY')
	}

	const momento = new CacheClient({
		configuration: Configurations.Browser.v1(),
		credentialProvider: CredentialProvider.fromString({
			apiKey: apiKey,
		}),
		defaultTtlSeconds: 60,
	})

	const key = 'foo'
	const value = 'FOO'

	const setResponse = await momento.set(cacheName, key, value)
	if (setResponse instanceof CacheSet.Success) {
		console.log('Key stored successfully!')
	} else {
		console.log(`Error setting key: ${setResponse.toString()}`)
	}

	const getResponse = await momento.get(cacheName, key)
	if (getResponse instanceof CacheGet.Hit) {
		console.log(`cache hit: ${getResponse.valueString()}`)
	} else if (getResponse instanceof CacheGet.Miss) {
		console.log('cache miss')
	} else if (getResponse instanceof CacheGet.Error) {
		console.log(`Error: ${getResponse.message()}`)
	}

	const deleteResponse = await momento.delete(cacheName, key)
	if (deleteResponse instanceof CacheGet.Hit) {
		console.log(`cache hit: ${deleteResponse.valueString()}`)
	} else if (deleteResponse instanceof CacheGet.Miss) {
		console.log('cache miss')
	} else if (deleteResponse instanceof CacheGet.Error) {
		console.log(`Error: ${deleteResponse.message()}`)
	}

	return new Response(
		`Tested the Momento cache using: <br /> Key: ${key} | Value: ${value}`,
		{
			status: 200,
			headers: new Headers({
				'Content-Type': 'text/html; charset=utf-8',
			}),
		},
	)
}

serve(handler)
