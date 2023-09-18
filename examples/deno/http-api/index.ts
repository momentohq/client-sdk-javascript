// Basic HTTP server that uses the Momento HTTP API
// to set, get, and delete an item from a cache

import { serve } from 'http'
import { load } from 'dotenv'
import { HttpClient } from 'momento_http'

const env = await load()

export const handler = async (_request: Request): Promise<Response> => {
	const cacheName = env['MOMENTO_CACHE_NAME']
	if (!cacheName) {
		throw new Error('Missing environment variable MOMENTO_CACHE_NAME')
	}

	const apiKey = env['MOMENTO_API_KEY']
	if (!apiKey) {
		throw new Error('Missing environment variable MOMENTO_API_KEY')
	}

	const endpoint = env['MOMENTO_HTTP_ENDPOINT']
	if (!endpoint) {
		throw new Error('Missing environment variable MOMENTO_HTTP_ENDPOINT')
	}

	const key = 'foo'
	const value = 'FOO'

	const momento = new HttpClient(apiKey, endpoint)

	await momento.set(cacheName, key, value, 10)
	console.log(`Set the key-value pair in the cache ${cacheName}`)

	const getRespAfterSet = await momento.get(cacheName, key)
	console.log(`Fetching the key after setting the value: ${getRespAfterSet}`)

	await momento.delete(cacheName, key)
	console.log(`Deleted the key-value pair from the cache ${cacheName}`)

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
