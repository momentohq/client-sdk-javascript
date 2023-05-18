import {InvalidArgumentError} from '../../errors/errors';
import jwtDecode from 'jwt-decode';
import {isBase64} from './validators';
import {decodeFromBase64} from './string';

export interface LegacyClaims {
  /**
   * control plane endpoint
   */
  cp: string;
  /**
   * cache endpoint
   */
  c: string;
}

export interface Base64DecodedV1Token {
  api_key: string;
  endpoint: string;
}

function decodeAuthTokenClaims<T>(authToken: string): T {
  return jwtDecode<T>(authToken);
}

interface TokenAndEndpoints {
  // If we decode a JWT that doesn't actually have the controlEndpoint/cacheEndpoint claims, then they will come back
  // as undefined; thus we need the types here to be `string | undefined`.
  controlEndpoint: string | undefined;
  cacheEndpoint: string | undefined;
  authToken: string;
}

/**
 * @param {string=} token
 * @returns TokenAndEndpoints
 */
export const decodeAuthToken = (token?: string): TokenAndEndpoints => {
  if (!token) {
    throw new InvalidArgumentError('malformed auth token');
  }

  try {
    // v1 api tokens don't have an endpoint as part of their claims. Instead, when the SDK returns tokens, we
    // give it to them as a base64 encoded string of '{ "api_key": "<the key>", "endpoint": "prod.momentohq.com" }'.
    // Since in the near future, most customers are going to be using these newer tokens, we are first checking to see if
    // they are base64 encoded, which will tell us that they are our v1 api tokens. If its not, we will fall back to decoding
    // it as one of our legacy jwts.
    if (isBase64(token)) {
      const base64DecodedToken = JSON.parse(
        decodeFromBase64(token)
      ) as Base64DecodedV1Token;
      if (!base64DecodedToken.endpoint || !base64DecodedToken.api_key) {
        throw new InvalidArgumentError('failed to parse token');
      }
      return {
        controlEndpoint: `control.${base64DecodedToken.endpoint}`,
        cacheEndpoint: `cache.${base64DecodedToken.endpoint}`,
        authToken: base64DecodedToken.api_key,
      };
    } else {
      // This decode function uses generics to advertise that we will usually expect to find the LegacyClaims.  However,
      // if the token is a valid JWT but not actually one of our legacy tokens, the endpoint claims will be undefined,
      // which is why the return type for this function specifies that the controlEndpoint/cacheEndpoint may be undefined.
      const decodedLegacyToken = decodeAuthTokenClaims<LegacyClaims>(token);
      return {
        controlEndpoint: decodedLegacyToken.cp,
        cacheEndpoint: decodedLegacyToken.c,
        authToken: token,
      };
    }
  } catch (e) {
    throw new InvalidArgumentError('failed to parse token');
  }
};
