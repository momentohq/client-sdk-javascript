import {InvalidArgumentError} from '../../errors';
import jwtDecode from 'jwt-decode';
import {isBase64} from './validators';
import {decodeFromBase64} from './string';
import {PredefinedScope} from '../../auth/tokens/token-scope';

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
  tokenEndpoint: string | undefined;
  vectorEndpoint: string | undefined;
  authToken: string;
}

export interface AllEndpoints {
  controlEndpoint: string;
  cacheEndpoint: string;
  tokenEndpoint: string;
  vectorEndpoint: string;
}

export function populateAllEndpointsFromBaseEndpoint(
  baseEndpoint: string
): AllEndpoints {
  return {
    controlEndpoint: `control.${baseEndpoint}`,
    cacheEndpoint: `cache.${baseEndpoint}`,
    tokenEndpoint: `token.${baseEndpoint}`,
    vectorEndpoint: `vector.${baseEndpoint}`,
  };
}

/**
 * @param {string} token
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
        ...populateAllEndpointsFromBaseEndpoint(base64DecodedToken.endpoint),
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
        tokenEndpoint: decodedLegacyToken.c,
        vectorEndpoint: decodedLegacyToken.c,
        authToken: token,
      };
    }
  } catch (e) {
    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
    throw new InvalidArgumentError(`failed to parse token: ${e}`);
  }
};

export class InternalSuperUserPermissions extends PredefinedScope {}
