import {InvalidArgumentError} from '.';
import {importJWK, JWK, JWTHeaderParameters, KeyLike, SignJWT} from 'jose';

export enum CacheOperation {
  Get = 'GET',
  Set = 'SET',
}

export interface SigningRequest {
  /**
   * @param {string} cacheName - Name of the cache the signed token should be allowed to operate on.
   */
  cacheName: string;
  /**
   * @param {number} expiryEpochSeconds - Timestamp in epoch seconds for
   * when the signed token should expire.
   */
  expiryEpochSeconds: number;
  /**
   * @param {string} [cacheKey] - The cache key the signed token is allowed to
   * access. If not present, auth token is allowed to be used for any key.
   */
  cacheKey?: string;
  /**
   * @param {CacheOperation} [cacheOperation] - The operation the signed token
   * should be valid for. If not present the signed token is allowed to be used
   * for any operation.
   */
  cacheOperation?: CacheOperation;
  /**
   * @param {number} [ttlSeconds] - The time to live for cache items that this
   * signed token can set. If not present the signed token is allowed to be
   * used for set operations with any ttl.
   */
  ttlSeconds?: number;
}

export interface PresignedUrlRequest extends SigningRequest {
  /**
   * @param {string} cacheKey - The cache key the presigned
   * URL should access.
   */
  cacheKey: string;
  /**
   * @param {CacheOperation} cacheOperation - The operation the presigned
   * URL should perform on the item in the cache.
   */
  cacheOperation: CacheOperation;
  /**
   * @param {number} [ttlSeconds] - The time to live for cache items when
   * performing a SET. Required when operation is CacheOperation.Set.
   */
  ttlSeconds?: number;
}

interface headers extends JWTHeaderParameters {
  alg: string;
  typ: string;
  kid: string;
}

// `jose.importJWK` returns Promise<KeyLike | Uint8Array>. It doesn't really
// matter to us which, so this is just an alias for convenience purposes.
type joseKey = KeyLike | Uint8Array;

/**
 * Momento Signer
 *
 * Features include:
 * - Create signed jwts for use with HTTP requests to the Momento Simple Cache
 * Service
 * - Create presigned URLs to use for HTTP requests to the Momento Simple
 * Cache Service
 *
 * Example usage:
 *   ```const signingKeyResponse = await momentoClient.createSigningKey(60 * 24)
 *   const keyString = signingKeyResponse.getKey();
 *   const endpoint = signingKeyResponse.getEndpoint();
 *   const signer = await MomentoSigner.init(keyString)
 *   const getUrl = await signer.createPresignedUrl(endpoint, {
 *     cacheName: 'mycache',
 *     cacheKey: 'mykey',
 *     cacheOperation: CacheOperation.GET,
 *     expiryEpochSeconds: Math.floor(Date.now() / 1000) + 10 * 60;
 *   });
 *   fetch(getUrl)```
 *
 * @see {@link https://github.com/momentohq/client-sdk-examples/blob/main/javascript/presigned-url-example.ts|The exampes repo} has a more extensive example.
 *
 * @export
 * @class MomentoSigner
 */
export class MomentoSigner {
  private readonly key: joseKey;
  private readonly headers: headers;

  private constructor(key: joseKey, headers: headers) {
    this.key = key;
    this.headers = headers;
  }

  /**
   * Creates a new MomentoSigner instance with the specified private key
   *
   * @param {string} jwkJsonString - the JSON string of the JWK key. Can be
   * optained from `createSigningKey` response.
   * @returns {Promise<MomentoSigner>} - Promise containing the MomentoSigner
   * instance
   * @memberof MomentoSigner
   */
  static async init(jwkJsonString: string): Promise<MomentoSigner> {
    let jwk: JWK;
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      jwk = JSON.parse(jwkJsonString);
    } catch (e) {
      throw new InvalidArgumentError(`Invalid JWK JSON: ${jwkJsonString}`);
    }

    let key: joseKey;
    try {
      key = await importJWK(jwk);
    } catch (e) {
      throw new InvalidArgumentError(`Unable to import JWK ${jwkJsonString}`);
    }

    const headers = buildHeaders(jwk);

    return new MomentoSigner(key, headers);
  }

  /**
   * Creates a new presigned URL
   *
   * @param {string} hostname - hostname of Simple Cache Service. Can be
   * obtained from `createSigningKey` response.
   * @param {PresignedUrlRequest} presignedUrlRequest - Contains parameters
   * for the generated URL.
   * @returns {Promise<string>} - Promise containing the presigned URL
   * @memberof MomentoSigner
   */
  public async createPresignedUrl(
    hostname: string,
    presignedUrlRequest: PresignedUrlRequest
  ): Promise<string> {
    const jwtToken = await this.signAccessToken(presignedUrlRequest);
    const cacheName = presignedUrlRequest.cacheName;
    const cacheKey = presignedUrlRequest.cacheKey;
    switch (presignedUrlRequest.cacheOperation) {
      case CacheOperation.Get:
        return `https://rest.${hostname}/cache/get/${cacheName}/${cacheKey}?token=${jwtToken}`;
      case CacheOperation.Set: {
        const ttlSeconds = presignedUrlRequest.ttlSeconds;
        if (ttlSeconds === undefined) {
          throw new InvalidArgumentError(
            'ttlSeconds is required for SET operation'
          );
        }
        return `https://rest.${hostname}/cache/set/${cacheName}/${cacheKey}?token=${jwtToken}&ttl_milliseconds=${
          ttlSeconds * 1000
        }`;
      }
      default:
        throw new Error('Unhandled operation');
    }
  }

  /**
   * Creates a new signed JWT for use with the Momento Simple Cache Service
   *
   * @param {SigningRequest} signingRequest - Contains parameters
   * for building the JWT.
   * @returns {Promise<string>} - Promise containing the signed JWT
   * @memberof MomentoSigner
   */
  public signAccessToken(signingRequest: SigningRequest): Promise<string> {
    let methodClaim: {method?: string[]};
    switch (signingRequest.cacheOperation) {
      case CacheOperation.Get:
        methodClaim = {method: ['get']};
        break;
      case CacheOperation.Set:
        methodClaim = {method: ['set']};
        break;
      default:
        methodClaim = {};
        break;
    }

    const ttlClaim = signingRequest.ttlSeconds
      ? {ttl: signingRequest.ttlSeconds}
      : {};
    const keyClaim = signingRequest.cacheKey
      ? {key: signingRequest.cacheKey}
      : {};

    const payload = {
      exp: signingRequest.expiryEpochSeconds,
      cache: signingRequest.cacheName,
      ...keyClaim,
      ...methodClaim,
      ...ttlClaim,
    };

    return new SignJWT(payload)
      .setProtectedHeader(this.headers)
      .setExpirationTime(signingRequest.expiryEpochSeconds)
      .sign(this.key);
  }
}

function buildHeaders(jwk: JWK): headers {
  const alg = jwk.alg;
  if (alg === undefined) {
    throw new InvalidArgumentError(
      'Invalid JWK: alg claim must be present in signing key'
    );
  }
  const kid = jwk.kid;
  if (kid === undefined) {
    throw new InvalidArgumentError(
      'Invalid JWK: expected kid claim to be present'
    );
  }

  return {
    alg: alg,
    kid: kid,
    typ: 'JWT',
  };
}
