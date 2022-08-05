import {InvalidArgumentError} from '.';
import {importJWK, JWK, JWTHeaderParameters, KeyLike, SignJWT} from 'jose';

export enum CacheOperation {
  Get = 'GET',
  Set = 'SET',
}

export interface signingRequest {
  cacheName: string;
  expiryEpochSeconds: number;
  cacheOperation?: CacheOperation;
  cacheKey?: string;
  ttlSeconds?: number;
}

export interface presignedUrlRequest extends signingRequest {
  cacheOperation: CacheOperation;
  cacheKey: string;
}

interface headers extends JWTHeaderParameters {
  alg: string;
  typ: string;
  kid: string;
}

// the jose.ImportJWK returns Promise<KeyLike | Uint8Array>. It doesn't really
// matter to us which, so this is just an alias for convenience purposes.
type joseKey = KeyLike | Uint8Array;

export class MomentoSigner {
  private readonly key: joseKey;
  private readonly headers: headers;

  private constructor(key: joseKey, headers: headers) {
    this.key = key;
    this.headers = headers;
  }

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

  public async createPresignedUrl(
    hostname: string,
    presignedUrlRequest: presignedUrlRequest
  ): Promise<string> {
    const jwtToken = await this.signAccessToken(presignedUrlRequest);
    const cacheName = presignedUrlRequest.cacheName;
    const cacheKey = presignedUrlRequest.cacheKey;
    if (presignedUrlRequest.cacheOperation === CacheOperation.Get) {
      return `https://rest.${hostname}/cache/get/${cacheName}/${cacheKey}?token=${jwtToken}`;
    } else if (presignedUrlRequest.cacheOperation === CacheOperation.Set) {
      const ttlSeconds = presignedUrlRequest.ttlSeconds;
      if (ttlSeconds === undefined) {
        throw new InvalidArgumentError(
          'ttlSeconds is required for SET operation'
        );
      }
      return `https://rest.${hostname}/cache/set/${cacheName}/${cacheKey}?token=${jwtToken}&ttl_milliseconds=${
        ttlSeconds * 1000
      }`;
    } else {
      throw new Error('Unhandled operation');
    }
  }

  public signAccessToken(signingRequest: signingRequest): Promise<string> {
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
