import {
  TopicClient,
  CacheClient,
  Configurations,
  CredentialProvider,
  AuthClient
} from '@gomomento/sdk';

import {
  SecretsManagerClient,
  GetSecretValueCommand,
  GetSecretValueCommandOutput,
} from '@aws-sdk/client-secrets-manager';

// Import configurations for region and secrets name info.
// @ts-ignore
import config from './config.json';

/* A function that gets the Momento auth token stored in AWS Secrets Manager.
The secret was stored as a plaintext format in Secrets Manager to avoid parsing JSON.

You don't have to store the Momento auth token in something like AWS Secrets Manager,
but it is best practice. You could pass the Momento auth token in from an environment variable.

For the moment, this code does not take into Momento auth tokens that need refreshing. You
would have to do that in an out of band process, like a customer Lambda Function.

*/
export async function GetToken(
  secretName: string,
  regionName: string
): Promise<string> {
  try {
    // Get connection client to AWS Secrets Manager.
    const client = new SecretsManagerClient({ region: regionName});
    // Get Momento auth token.
    const response: GetSecretValueCommandOutput = await client.send(
      new GetSecretValueCommand({
        SecretId: secretName,
        VersionStage: "AWSCURRENT",
      })
    );
    return response.SecretString || '';
  } catch(err) {
    console.error(`Error fetching secret value for "${secretName}":`);
    // For a list of exceptions thrown, see
    // https://docs.aws.amazon.com/secretsmanager/latest/apireference/API_GetSecretValue.html
    throw err;
  }
}

/* This function calls to the GetToken function, uses the Momento auth token to create a
 Momento client connection to Momento Cache and returns that object for later use.

 It requires two values (secretname and region) from the local config.json file in the same directory. */
export async function CreateCacheClient(
  ttl:number = 600
  ): Promise<CacheClient> {
  // Call the Get Token function to get a Momento auth token from AWS Secrets Manager.
  const token: string = await GetToken(config.secretname, config.region);
  // Get a new cache connection with the token and set a default TTL for the connection.
  return new CacheClient({
    configuration: Configurations.Laptop.latest(),
    credentialProvider: CredentialProvider.fromString({ authToken : token }),
    defaultTtlSeconds: ttl,
  });
}

/* This function calls to the GetToken function, uses the Momento auth token to create a
 Momento topics client connection to Momento Topics and returns that object for later use.

 It requires two values (secretname and region) from the local config.json file in the same directory. */
export async function CreateTopicClient(): Promise<TopicClient> {
  // Call the Get Token function to get a Momento auth token from AWS Secrets Manager.
  const token: string = await GetToken(config.secretname, config.region);
  // Get a new cache connection with the token and set a default TTL for the connection.
  return new TopicClient({
    configuration: Configurations.Laptop.latest(),
    credentialProvider: CredentialProvider.fromString({ authToken : token }),
  });
}

/* This function calls to the GetToken function, uses that Momento auth token to create a
 Momento auth client connection and returns the client necessary to get an temporary auth token to use in a browser.*/
export async function CreateAuthClient(): Promise<AuthClient> {
  // Call the GetToken function to get a Momento auth token from AWS Secrets Manager.
  const token: string = await GetToken(config.secretname, config.region);
  // Return an auth client connection with the token.
  return new AuthClient({
    credentialProvider: CredentialProvider.fromString({ authToken : token }),
  });
}
