import {CredentialProvider} from '@gomomento/sdk-core';
import * as https from 'https';
import {v4} from 'uuid';

function makeRequest(
  method: string,
  hostname: string,
  path: string,
  headers: Record<string, string>,
  body?: string
): Promise<{
  statusCode: number;
  statusMessage: string | undefined;
  body: string;
}> {
  return new Promise((resolve, reject) => {
    const options = {
      hostname,
      path,
      method,
      headers,
    };

    const req = https.request(options, res => {
      let data = '';

      res.on('data', chunk => {
        data += chunk;
      });

      res.on('end', () => {
        resolve({
          statusCode: res.statusCode || 0,
          statusMessage: res.statusMessage,
          body: data,
        });
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(body);
    }

    req.end();
  });
}

function putValue(
  baseUrl: string,
  apiKey: string,
  cacheName: string,
  key: string,
  value: string,
  ttl: number
): Promise<{statusCode: number; statusMessage: string | undefined}> {
  const path = `/cache/${encodeValue(cacheName)}?key=${encodeValue(
    key
  )}&value=${encodeValue(value)}&ttl_seconds=${ttl}`;
  const headers = {
    Authorization: apiKey,
    'Content-Type': 'application/json',
  };

  return makeRequest('PUT', baseUrl, path, headers, value);
}

function getValue(
  baseUrl: string,
  apiKey: string,
  cacheName: string,
  key: string
): Promise<{
  statusCode: number;
  statusMessage: string | undefined;
  body: string;
}> {
  const path = `/cache/${encodeValue(cacheName)}?key=${encodeValue(key)}`;
  const headers = {
    Authorization: apiKey,
  };

  return makeRequest('GET', baseUrl, path, headers);
}

function deleteValue(
  baseUrl: string,
  apiKey: string,
  cacheName: string,
  key: string
): Promise<{statusCode: number; statusMessage: string | undefined}> {
  const path = `/cache/${encodeValue(cacheName)}?key=${encodeValue(key)}`;
  const headers = {
    Authorization: apiKey,
  };

  return makeRequest('DELETE', baseUrl, path, headers);
}

function encodeValue(value: string): string {
  return encodeURIComponent(value);
}

export function runHttpApiTest(
  credentialProvider: CredentialProvider,
  cacheName: string
) {
  describe('Momento HTTP API', () => {
    let apiKey: string;
    let baseUrl: string;
    let cacheEndpoint: string;

    beforeAll(() => {
      cacheEndpoint = credentialProvider.getCacheEndpoint();
      apiKey = credentialProvider.getAuthToken();
      baseUrl = `api.${cacheEndpoint}`;
    });

    it('should return error on non-existing cache', async () => {
      const key = v4();
      const value = v4();
      const ttl = 300;

      const nonExistentCache = v4();

      // PUT API
      const putRes = await putValue(
        baseUrl,
        apiKey,
        nonExistentCache,
        key,
        value,
        ttl
      );
      expect(putRes.statusCode).toBe(404);
      expect(putRes.statusMessage?.toLowerCase()).toBe('not found');

      // GET API
      const getRes = await getValue(baseUrl, apiKey, nonExistentCache, key);
      expect(getRes.statusCode).toBe(404);
      expect(getRes.statusMessage?.toLowerCase()).toBe('not found');

      // DELETE API
      const delRes = await deleteValue(baseUrl, apiKey, nonExistentCache, key);
      expect(delRes.statusCode).toBe(404);
      expect(delRes.statusMessage?.toLowerCase()).toBe('not found');
    });

    it('should successfully PUT and GET a value from a cache', async () => {
      const key = v4();
      const value = v4();
      const ttl = 300;

      // Use PUT API to set the string value
      const putRes = await putValue(
        baseUrl,
        apiKey,
        cacheName,
        key,
        value,
        ttl
      );
      expect(putRes.statusCode).toBe(204);

      // Use GET API to retrieve the value
      const getRes = await getValue(baseUrl, apiKey, cacheName, key);
      expect(getRes.statusCode).toBe(200);
      expect(getRes.body).toBe(value);
    });

    it('should return error on GET on non-existing key', async () => {
      // Use GET API to retrieve the value that was not set
      const getRes2 = await getValue(baseUrl, apiKey, cacheName, v4());
      expect(getRes2.statusCode).toBe(404);
      expect(getRes2.statusMessage?.toLowerCase()).toBe('not found');
    });

    it('should successfully DELETE a value from a cache', async () => {
      const key = v4();
      const value = v4();
      const ttl = 300;

      // Use PUT API to set the value
      const putRes = await putValue(
        baseUrl,
        apiKey,
        cacheName,
        key,
        value,
        ttl
      );
      expect(putRes.statusCode).toBe(204);

      // Use DELETE API to delete the value that was set
      const delRes = await deleteValue(baseUrl, apiKey, cacheName, key);
      expect(delRes.statusCode).toBe(204);
    });

    it('should return success on DELETE on non-existing key', async () => {
      // Use DELETE API to delete the value that was not set
      const delRes2 = await deleteValue(baseUrl, apiKey, cacheName, v4());
      expect(delRes2.statusCode).toBe(204);
    });
  });
}
