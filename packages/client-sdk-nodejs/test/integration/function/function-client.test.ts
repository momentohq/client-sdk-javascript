import {
  CacheClient,
  Configurations,
  CreateCache,
  CredentialProvider,
  DeleteFunction,
  ListFunctions,
  ListFunctionVersions,
  PreviewFunctionClient,
  PutFunction,
} from '../../../src';
import * as fs from 'fs';
import * as path from 'path';
import {v4} from 'uuid';

// Runs whenever MOMENTO_API_KEY is set (the normal integration sweep), using the same MOMENTO_API_KEY +
// MOMENTO_ENDPOINT env vars as the rest of the suite via CredentialProvider.fromEnvVarV2(). Functions are
// enabled in all cells, so no special gating is needed.
const describeIfLive = process.env.MOMENTO_API_KEY ? describe : describe.skip;

describeIfLive('PreviewFunctionClient (integration)', () => {
  const cacheName = `js-fn-it-${v4().slice(0, 8)}`;
  const wasm = fs.readFileSync(path.join(__dirname, 'test-function.wasm'));
  let cacheClient: CacheClient;
  let functionClient: PreviewFunctionClient;

  beforeAll(async () => {
    const credentialProvider = CredentialProvider.fromEnvVarV2();
    cacheClient = new CacheClient({
      configuration: Configurations.Laptop.latest(),
      credentialProvider,
      defaultTtlSeconds: 60,
    });
    const create = await cacheClient.createCache(cacheName);
    if (create instanceof CreateCache.Error) {
      throw create.innerException();
    }
    functionClient = new PreviewFunctionClient({credentialProvider});
  });

  afterAll(async () => {
    functionClient?.close();
    if (cacheClient) {
      await cacheClient.deleteCache(cacheName);
    }
  });

  it('puts, lists, lists versions of, and deletes a function', async () => {
    const name = `it-fn-${v4().slice(0, 8)}`;

    const put = await functionClient.putFunction(cacheName, name, wasm, {
      description: 'integration test function',
      environmentVariables: {E2E_GREETING: 'hello'},
    });
    expect(put).toBeInstanceOf(PutFunction.Success);
    const functionId = (put as PutFunction.Success).functionId();
    expect(functionId).toBeTruthy();

    const list = await functionClient.listFunctions(cacheName);
    expect(list).toBeInstanceOf(ListFunctions.Success);
    const listedNames = (list as ListFunctions.Success)
      .getFunctions()
      .map(f => f.getName());
    expect(listedNames).toContain(name);

    const versions = await functionClient.listFunctionVersions(functionId);
    expect(versions).toBeInstanceOf(ListFunctionVersions.Success);
    expect(
      (versions as ListFunctionVersions.Success).getVersions().length
    ).toBeGreaterThanOrEqual(1);

    const del = await functionClient.deleteFunction(cacheName, name);
    expect(del).toBeInstanceOf(DeleteFunction.Success);

    const after = await functionClient.listFunctions(cacheName);
    expect(after).toBeInstanceOf(ListFunctions.Success);
    expect(
      (after as ListFunctions.Success).getFunctions().map(f => f.getName())
    ).not.toContain(name);
  }, 30000);
});
