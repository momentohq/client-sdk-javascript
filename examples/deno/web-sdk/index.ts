// Basic HTTP server that uses the Momento web SDK
// to set, get, and delete an item from a cache

import { serve } from 'http'
import {
	CacheClient,
	CacheDeleteResponse,
	CacheGetResponse,
	CacheSetResponse,
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
	switch (setResponse.type) {
		case CacheSetResponse.Success:
			console.log('Key stored successfully!')
			break
		case CacheSetResponse.Error:
			console.log(`Error setting key: ${setResponse.toString()}`)
			break
	}

	const getResponse = await momento.get(cacheName, key)
	switch (getResponse.type) {
		case CacheGetResponse.Hit:
			console.log(`cache hit: ${getResponse.valueString()}`)
			break
		case CacheGetResponse.Miss:
			console.log('cache miss')
			break
		case CacheGetResponse.Error:
			console.log(`Error: ${getResponse.message()}`)
			break
	}

	const deleteResponse = await momento.delete(cacheName, key)
	switch (deleteResponse.type) {
		case CacheDeleteResponse.Success:
			console.log('Key deleted successfully!')
			break
		case CacheDeleteResponse.Error:
			console.log(`Error deleting key: ${deleteResponse.toString()}`)
			break
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
