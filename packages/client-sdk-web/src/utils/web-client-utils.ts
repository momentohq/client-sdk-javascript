import {CredentialProvider} from '@gomomento/sdk-core';

export function convertToB64String(v: string | Uint8Array): string {
  if (typeof v === 'string') {
    const encodedString = encodeURIComponent(v);
    let decodedString = '';
    for (let i = 0; i < encodedString.length; i++) {
      if (encodedString[i] === '%') {
        const hex = encodedString.substr(i + 1, 2);
        decodedString += String.fromCharCode(parseInt(hex, 16));
        i += 2;
      } else {
        decodedString += encodedString[i];
      }
    }
    return btoa(decodedString);
  } else {
    const chars = new Uint8Array(v);
    let binary = '';
    for (let i = 0; i < chars.length; i++) {
      binary += String.fromCharCode(chars[i]);
    }
    return btoa(binary);
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
