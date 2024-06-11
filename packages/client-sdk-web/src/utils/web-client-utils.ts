import {CredentialProvider} from '@gomomento/sdk-core';

export function convertToB64String(v: string | Uint8Array): string {
  if (typeof v === 'string') {
    const utf8Bytes = new TextEncoder().encode(v);
    const binaryString = String.fromCharCode(...utf8Bytes);
    return btoa(binaryString);
  } else {
    const binaryString = String.fromCharCode(...v);
    return btoa(binaryString);
  }
}

export function createCallMetadata(
  cacheName: string,
  timeoutMillis: number
): {cache: string; deadline: string} {
  const deadline = Date.now() + timeoutMillis;
  return {cache: cacheName, deadline: deadline.toString()};
}

export function getWebControlEndpoint(
  credentialProvider: CredentialProvider
): string {
  if (credentialProvider.areEndpointsOverridden()) {
    return withProtocolPrefix(credentialProvider.getControlEndpoint());
  }
  return withProtocolPrefix(`web.${credentialProvider.getControlEndpoint()}`);
}

export function getWebCacheEndpoint(
  credentialProvider: CredentialProvider
): string {
  if (credentialProvider.areEndpointsOverridden()) {
    return withProtocolPrefix(credentialProvider.getCacheEndpoint());
  }
  return withProtocolPrefix(`web.${credentialProvider.getCacheEndpoint()}`);
}

export function getWebTokenEndpoint(
  credentialProvider: CredentialProvider
): string {
  if (credentialProvider.areEndpointsOverridden()) {
    return withProtocolPrefix(credentialProvider.getTokenEndpoint());
  }
  return withProtocolPrefix(`web.${credentialProvider.getTokenEndpoint()}`);
}

function withProtocolPrefix(endpoint: string): string {
  if (endpoint.match(/^http(?:s)?:\/\//)) {
    return endpoint;
  }
  return `https://${endpoint}`;
}
