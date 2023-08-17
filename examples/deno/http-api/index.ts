// Basic HTTP server that uses the Momento HTTP API
// to set, get, and delete an item from a cache

import { serve } from 'http'
import { load } from 'dotenv'

const env = await load()

// Light wrapper that provides error handling for fetch calls to the Momento HTTP API
class MomentoFetcher {
	private readonly apiToken: string
	private readonly baseurl: string

	constructor(token: string, endpoint: string) {
		this.apiToken = token
		this.baseurl = endpoint.includes('https://')
			? `${endpoint}/cache`
			: `https://${endpoint}/cache`
	}

	async get(cacheName: string, key: string) {
		const resp = await fetch(
			`${this.baseurl}/${cacheName}?key=${key}&token=${this.apiToken}`,
		)

		if (resp.status >= 200 && resp.status < 300) {
			const value = await resp.text()
			console.log(
				`successfully retrieved ${key} from cache ${cacheName}: ${value}`,
			)
			return value
		} else if (resp.status === 404) {
			const value = await resp.text()
			console.log(
				`${key} not found or cache ${cacheName} not found: ${value}`,
			)
			return ''
		} else {
			throw new Error(
				`failed to retrieve item from cache ${cacheName}. Message: ${resp.statusText} | Status: ${resp.status}`,
			)
		}
	}

	async set(cacheName: string, key: string, value: string, ttl_seconds = 30) {
		const resp = await fetch(
			`${this.baseurl}/${cacheName}?key=${key}&token=${this.apiToken}&ttl_seconds=${ttl_seconds}`,
			{
				method: 'PUT',
				body: value,
			},
		)

		if (resp.status >= 200 && resp.status < 300) {
			console.log(`successfully set ${key} into cache`)
		} else {
			throw new Error(
				`failed to set item into cache ${cacheName}. Message: ${resp.statusText} | Status: ${resp.status}`,
			)
		}

		return resp.status
	}

	async delete(cacheName: string, key: string) {
		const resp = await fetch(
			`${this.baseurl}/${cacheName}?key=${key}&token=${this.apiToken}`,
			{
				method: 'DELETE',
			},
		)
		if (resp.status >= 200 && resp.status < 300) {
			console.log(`successfully deleted ${key} from cache ${cacheName}`)
		} else {
			throw new Error(
				`failed to delete ${key} from cache ${cacheName}. Message: ${resp.statusText} | Status: ${resp.status}`,
			)
		}

		return resp.text()
	}
}

export const handler = async (_request: Request): Promise<Response> => {
	const cacheName = env['MOMENTO_CACHE_NAME']
	const authToken = env['MOMENTO_AUTH_TOKEN']
	const endpoint = env['MOMENTO_HTTP_ENDPOINT']
	const key = 'foo'
	const value = 'FOO'

	const momento = new MomentoFetcher(authToken, endpoint)

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
