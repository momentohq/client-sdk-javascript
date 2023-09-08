import {CredentialProvider} from '@gomomento/sdk-core';

export function convertToB64String(v: string | Uint8Array): string {
  if (typeof v === 'string') {
    return btoa(v);
  }
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  return btoa(String.fromCharCode.apply(null, v));
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

export function getWebVectorEndpoint(
  credentialProvider: CredentialProvider
): string {
  if (credentialProvider.areEndpointsOverridden()) {
    return withProtocolPrefix(credentialProvider.getVectorEndpoint());
  }
  return withProtocolPrefix(`web.${credentialProvider.getVectorEndpoint()}`);
}

function withProtocolPrefix(endpoint: string): string {
  if (endpoint.match(/^http(?:s)?:\/\//)) {
    return endpoint;
  }
  return `https://${endpoint}`;
}
