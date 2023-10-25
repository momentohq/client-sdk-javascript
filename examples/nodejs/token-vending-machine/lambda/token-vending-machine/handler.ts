import {APIGatewayProxyEvent, APIGatewayProxyEventHeaders, APIGatewayProxyResult} from 'aws-lambda';
import {GetSecretValueCommand, SecretsManagerClient} from '@aws-sdk/client-secrets-manager';
import {AllTopics, AuthClient, CredentialProvider, GenerateDisposableToken, TokenScopes} from '@gomomento/sdk';
import {tokenPermissions, tokenExpiresIn, authenticationMethod, AuthenticationMethod} from './config';

const _secretsClient = new SecretsManagerClient({});
const _cachedSecrets = new Map<string, string>();
let _momentoAuthClient: AuthClient | undefined = undefined;

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const vendorApiKeySecretName = process.env.MOMENTO_API_KEY_SECRET_NAME;
    if (vendorApiKeySecretName === undefined) {
      throw new Error("Missing required env var 'MOMENTO_API_KEY_SECRET_NAME");
    }
    console.log('headers in handler:', event.headers);
    const tokenId = event.queryStringParameters?.name;
    console.log('tokenID inferred from queryStringParameters: ', tokenId);
    const vendedApiKey = await vendDisposableToken(vendorApiKeySecretName, event.headers, tokenId);
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify(vendedApiKey),
    };
  } catch (err) {
    console.log(err);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'An error occurred!',
      }),
    };
  }
};

interface VendedToken {
  authToken: string;
  expiresAt: number;
}

async function vendDisposableToken(
  vendorApiKeySecretName: string,
  headers: APIGatewayProxyEventHeaders,
  tokenId: string | undefined
): Promise<VendedToken> {
  const momentoAuthClient = await getMomentoAuthClient(vendorApiKeySecretName);

  let generateTokenResponse;
  if (authenticationMethod === AuthenticationMethod.AmazonCognito) {
    const cognitoUserTokenPermissions = determineCognitoUserTokenScope(headers);
    generateTokenResponse = await momentoAuthClient.generateDisposableToken(
      cognitoUserTokenPermissions,
      tokenExpiresIn,
      {
        tokenId: tokenId,
      }
    );
  } else {
    generateTokenResponse = await momentoAuthClient.generateDisposableToken(tokenPermissions, tokenExpiresIn, {
      tokenId: tokenId,
    });
  }

  if (generateTokenResponse instanceof GenerateDisposableToken.Success) {
    return {
      authToken: generateTokenResponse.authToken,
      expiresAt: generateTokenResponse.expiresAt.epoch(),
    };
  } else {
    throw new Error(`An error occurred while attempting to generate the token: ${generateTokenResponse.toString()}`);
  }
}

function determineCognitoUserTokenScope(headers: APIGatewayProxyEventHeaders) {
  if (!('cachename' in headers) || !('usergroup' in headers)) {
    throw new Error("Could not find expected headers 'cachename' and 'usergroup'");
  }

  if (headers['cachename'] && headers['usergroup'] === 'ReadWriteUserGroup') {
    return TokenScopes.topicPublishSubscribe(headers['cachename'], AllTopics);
  } else if (headers['cachename'] && headers['usergroup'] === 'ReadOnlyUserGroup') {
    return TokenScopes.topicSubscribeOnly(headers['cachename'], AllTopics);
  } else {
    throw new Error(`Unrecognized Cognito user group: ${headers['usergroup']}`);
  }
}

async function getMomentoAuthClient(apiKeySecretName: string): Promise<AuthClient> {
  if (_momentoAuthClient === undefined) {
    const momentoApiKey = await getSecret(apiKeySecretName);
    console.log('Retrieved secret!');
    _momentoAuthClient = new AuthClient({
      credentialProvider: CredentialProvider.fromString({apiKey: momentoApiKey}),
    });
  }
  return _momentoAuthClient;
}

async function getSecret(secretName: string): Promise<string> {
  if (!_cachedSecrets.has(secretName)) {
    const secretResponse = await _secretsClient.send(new GetSecretValueCommand({SecretId: secretName}));
    if (secretResponse) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      _cachedSecrets.set(secretName, secretResponse.SecretString!);
    } else {
      throw new Error(`Unable to retrieve secret: ${secretName}`);
    }
  }
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  return _cachedSecrets.get(secretName)!;
}
