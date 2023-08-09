/// <reference types="@fastly/js-compute" />
import { Backend } from "fastly:backend";

// The entry point for your application.
//
// Use this fetch event listener to define your main request handling logic. It
// could be used to route based on the request properties (such as method or
// path), send the request to a backend, make completely new requests, and/or
// generate synthetic responses.


addEventListener("fetch", (event) => {  
  event.respondWith(handleRequest(event));
});

async function handleRequest(event: FetchEvent) {

	// Testing basic fetch call
	
	const backend = new Backend({
		name: 'google',
		target: "google.com",
		useSSL: true,
	});

	const resp = await fetch("https://www.google.com", {backend: backend.toString()});
	console.log("google response:", resp.status, resp.statusText);
	return new Response(await resp.text(), {
		status: 200,
		headers: new Headers({ "Content-Type": "text/html; charset=utf-8" }),
	});


	// const key = "hello";
	// const value = "hello-momento";

	// Set these values
	// const cache = "";
	// const apiKey = "";
	// const endpoint = "";

	// const backend = new Backend({
	// 	name: 'momento_service',
	// 	target: endpoint,
	// 	useSSL: true,
	// });

	// const client = new MomentoFetcher(
	// 	apiKey, 
	// 	endpoint,
	// 	backend
	// );
	
	// // setting a value into cache
	// const setResp = await client.set(cache, key, value);
	// console.log("setResp", setResp.text);

	// // getting a value from cache
	// const getResp = await client.get(cache, key);
	// console.log("getResp", getResp);

	// // deleting a value from cache
	// const deleteResp = await client.delete(cache, key);
	// console.log("deleteResp", deleteResp);

	// return new Response(JSON.stringify({ response: getResp }));
}

class MomentoFetcher {
	private readonly apiToken: string;
	private readonly baseurl: string;
  private readonly backend: Backend;
  
	constructor(token: string, endpoint: string, backend: Backend) {
		this.apiToken = token;
		this.baseurl = `https://${endpoint}/cache`;
    this.backend = backend;
	}

	async get(cacheName: string, key: string) {
		const resp = await fetch(`${this.baseurl}/${cacheName}?key=${key}&token=${this.apiToken}`, { backend: this.backend.toString() });
		if (resp.status < 300) {
			console.log(`successfully retrieved ${key} from cache`)
		} else {
			throw new Error(`failed to retrieve item from cache: ${cacheName} with status code ${resp.status}`);
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

		return resp;
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

		return resp.text();
	}
}

