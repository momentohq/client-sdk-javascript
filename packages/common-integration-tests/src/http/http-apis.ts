import {ExpiresIn, GenerateApiKey, PermissionScope} from '@gomomento/sdk-core';
import {InternalSuperUserPermissions} from '@gomomento/sdk-core/dist/src/internal/utils';
import {IAuthClient} from '@gomomento/sdk-core/dist/src/clients/IAuthClient';
import * as https from 'https';

import {v4} from 'uuid';
import {IncomingMessage} from 'node:http';

const SUPER_USER_PERMISSIONS: PermissionScope =
  new InternalSuperUserPermissions();

function makeRequest(
  method: string,
  hostname: string,
  path: string,
  headers: Record<string, string>,
  body?: string
): Promise<IncomingMessage> {
  return new Promise((resolve, reject) => {
    const options = {
      hostname,
      path,
      method,
      headers,
    };

    const req = https.request(options, res => {
      resolve(res);
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
): Promise<IncomingMessage> {
  const encodedKey = encodeURIComponent(key);
  const path = `/cache/${cacheName}?key=${encodedKey}&value=${value}&ttl_seconds=${ttl}`;
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
): Promise<IncomingMessage> {
  const encodedKey = encodeURIComponent(key);
  const path = `/cache/${cacheName}?key=${encodedKey}`;
  const headers = {
    Authorization: apiKey,
    'Content-Type': 'application/json',
  };

  return makeRequest('GET', baseUrl, path, headers);
}

function deleteValue(
  baseUrl: string,
  apiKey: string,
  cacheName: string,
  key: string
): Promise<IncomingMessage> {
  const encodedKey = encodeURIComponent(key);
  const path = `/cache/${cacheName}?key=${encodedKey}`;
  const headers = {
    Authorization: apiKey,
    'Content-Type': 'application/json',
  };

  return makeRequest('DELETE', baseUrl, path, headers);
}

export function runHttpApiTest(
  sessionTokenAuthClient: IAuthClient,
  cacheName: string
) {
  describe('Momento HTTP API', () => {
    let apiKey: string;
    let baseUrl: string;

    beforeAll(async () => {
      const resp = await sessionTokenAuthClient.generateApiKey(
        SUPER_USER_PERMISSIONS,
        ExpiresIn.minutes(5)
      );
      expect(resp).toBeInstanceOf(GenerateApiKey.Success);
      const successResp = resp as GenerateApiKey.Success;
      apiKey = successResp.apiKey;
      baseUrl = `api.cache.${successResp.endpoint}`;
    });

    it('should successfully PUT, GET, DELETE a value in the cache', async () => {
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
      expect(putRes.statusCode as number).toBe(204);

      // Use GET API to retrieve the value
      const getRes = await getValue(baseUrl, apiKey, cacheName, key);
      expect(getRes.statusCode).toBe(200);

      // Use DELETE API to update the value
      const delRes = await deleteValue(baseUrl, apiKey, cacheName, key);
      expect(delRes.statusCode).toBe(204);

      // Use GET API to retrieve the value
      const getRes2 = await getValue(baseUrl, apiKey, cacheName, key);
      expect(getRes2.statusCode).toBe(404);
    });
  });
}
