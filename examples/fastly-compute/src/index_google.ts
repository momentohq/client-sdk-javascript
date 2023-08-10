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
}

