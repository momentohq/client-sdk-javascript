import {
  DeleteFunction,
  FunctionConfigurations,
  InvalidArgumentError,
  ListFunctions,
  ListFunctionVersions,
  PreviewFunctionClient,
  PutFunction,
  StringMomentoTokenProvider,
} from '../../src';

// Syntactically correct but not a real token; used only for unit testing constructors + the validation path.
const fakeAuthTokenForTesting =
  'eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJzcXVpcnJlbCIsImNwIjoiY29udHJvbCBwbGFuZSBlbmRwb2ludCIsImMiOiJkYXRhIHBsYW5lIGVuZHBvaW50In0.zsTsEXFawetTCZI';
const credentialProvider = new StringMomentoTokenProvider({
  authToken: fakeAuthTokenForTesting,
});
const configuration = FunctionConfigurations.Laptop.latest();

describe('PreviewFunctionClient', () => {
  it('can construct a PreviewFunctionClient', () => {
    const client = new PreviewFunctionClient({
      configuration,
      credentialProvider,
    });
    client.close();
  });

  it('returns an error on putFunction with an invalid cache name', async () => {
    const client = new PreviewFunctionClient({
      configuration,
      credentialProvider,
    });
    const response = await client.putFunction(
      '   ',
      'my-function',
      new Uint8Array([0, 1, 2]),
      {environmentVariables: {GREETING: 'hello'}}
    );
    expect(response).toBeInstanceOf(PutFunction.Error);
    if (response instanceof PutFunction.Error) {
      expect(response.innerException()).toBeInstanceOf(InvalidArgumentError);
    }
    client.close();
  });

  it('returns an error on deleteFunction with an invalid cache name', async () => {
    const client = new PreviewFunctionClient({
      configuration,
      credentialProvider,
    });
    const response = await client.deleteFunction('   ', 'my-function');
    expect(response).toBeInstanceOf(DeleteFunction.Error);
    if (response instanceof DeleteFunction.Error) {
      expect(response.innerException()).toBeInstanceOf(InvalidArgumentError);
    }
    client.close();
  });

  it('returns an error on listFunctions with an invalid cache name', async () => {
    const client = new PreviewFunctionClient({
      configuration,
      credentialProvider,
    });
    const response = await client.listFunctions('   ');
    expect(response).toBeInstanceOf(ListFunctions.Error);
    if (response instanceof ListFunctions.Error) {
      expect(response.innerException()).toBeInstanceOf(InvalidArgumentError);
    }
    client.close();
  });

  it('returns an error on listFunctionVersions with an empty function id', async () => {
    const client = new PreviewFunctionClient({
      configuration,
      credentialProvider,
    });
    const response = await client.listFunctionVersions('   ');
    expect(response).toBeInstanceOf(ListFunctionVersions.Error);
    if (response instanceof ListFunctionVersions.Error) {
      expect(response.innerException()).toBeInstanceOf(InvalidArgumentError);
    }
    client.close();
  });

  it('returns an error on putFunction with an empty function name', async () => {
    const client = new PreviewFunctionClient({
      configuration,
      credentialProvider,
    });
    const response = await client.putFunction(
      'a-cache',
      '   ',
      new Uint8Array([0, 1, 2])
    );
    expect(response).toBeInstanceOf(PutFunction.Error);
    if (response instanceof PutFunction.Error) {
      expect(response.innerException()).toBeInstanceOf(InvalidArgumentError);
    }
    client.close();
  });

  it('returns an error on putFunction with empty wasm bytes', async () => {
    const client = new PreviewFunctionClient({
      configuration,
      credentialProvider,
    });
    const response = await client.putFunction(
      'a-cache',
      'my-function',
      new Uint8Array([])
    );
    expect(response).toBeInstanceOf(PutFunction.Error);
    if (response instanceof PutFunction.Error) {
      expect(response.innerException()).toBeInstanceOf(InvalidArgumentError);
    }
    client.close();
  });

  it('returns an error on deleteFunction with an empty function name', async () => {
    const client = new PreviewFunctionClient({
      configuration,
      credentialProvider,
    });
    const response = await client.deleteFunction('a-cache', '   ');
    expect(response).toBeInstanceOf(DeleteFunction.Error);
    if (response instanceof DeleteFunction.Error) {
      expect(response.innerException()).toBeInstanceOf(InvalidArgumentError);
    }
    client.close();
  });
});
