import {
  TopicClient,
  CacheClient,
  Configurations,
  CredentialProvider
} from '@gomomento/sdk';

import {
  SecretsManagerClient,
  GetSecretValueCommand,
  GetSecretValueCommandOutput,
} from '@aws-sdk/client-secrets-manager';

/* A function that gets the Momento auth token stored in AWS Secrets Manager.
The secret was stored as a plaintext format in Secrets Manager to avoid parsing JSON.

You don't have to store the Momento auth token in something like AWS Secrets Manager,
but it is best practice. You could pass the Momento auth token in from an environment variable.

For the moment, this code does not take into Momento auth tokens that need refreshing. You
would have to do that in an out of band process, like a customer Lambda Function.

*/
export async function GetToken(
  secretName: string,
  regionName: string = "us-west-2"
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
 Momento client connection to Momento Cache and returns that object for later use. */
export default async function CreateCacheClient(
  ttl:number = 600,
  tokenName:string = "Momento_Auth_Token",
  ): Promise<CacheClient> {
  // Call the Get Token function to get a Momento auth token from AWS Secrets Manager.
  const token: string = await GetToken(tokenName);
  // Get a new cache connection with the token and set a default TTL for the connection.
  return new CacheClient({
    configuration: Configurations.Laptop.latest(),
    credentialProvider: CredentialProvider.fromString({ authToken : token }),
    defaultTtlSeconds: ttl,
  });
}

export default async function CreateTopicClient(
  tokenName:string = "Momento_Auth_Token",
): Promise<TopicClient> {
  // Call the Get Token function to get a Momento auth token from AWS Secrets Manager.
  const token: string = await GetToken(tokenName);
  // Get a new cache connection with the token and set a default TTL for the connection.
  return new TopicClient({
    configuration: Configurations.Laptop.latest(),
    credentialProvider: CredentialProvider.fromString({ authToken : token }),
  });
}
