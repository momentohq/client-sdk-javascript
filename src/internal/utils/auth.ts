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

interface V1ApiTokenClaims {
  sub: string;
  ver: number;
  exp: number;
}

export interface V1ApiTokenClaimsWithEndpoint extends V1ApiTokenClaims {
  endpoint: string;
  authToken: string;
}

export interface Base64DecodedV1Token {
  api_key: string;
  endpoint: string;
}

function decodeAuthTokenClaims<T>(apiToken: string): T {
  return jwtDecode<T>(apiToken);
}

interface TokenAndEndpoints {
  controlEndpoint: string;
  cacheEndpoint: string;
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
    if (isBase64(token)) {
      const base64DecodedToken = JSON.parse(
        decodeFromBase64(token)
      ) as Base64DecodedV1Token;
      return {
        controlEndpoint: `control.${base64DecodedToken.endpoint}`,
        cacheEndpoint: `data.${base64DecodedToken.endpoint}`,
        authToken: base64DecodedToken.api_key,
      };
    } else {
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
