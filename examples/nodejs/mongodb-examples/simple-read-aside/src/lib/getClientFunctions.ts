import {
  CacheClient,
  Configurations,
  CredentialProvider
} from '@gomomento/sdk';

import {
  SecretsManagerClient,
  GetSecretValueCommand,
  GetSecretValueCommandOutput,
} from '@aws-sdk/client-secrets-manager';

/* A function that gets the Momento API key stored in AWS Secrets Manager.
The secret was stored as a plaintext format in Secrets Manager to avoid parsing JSON.

You don't have to store the Momento API key in something like AWS Secrets Manager,
but it is best practice. You could pass the Momento API key in from an environment variable.

For the moment, this code does not take into Momento API keys that need refreshing. You
would have to do that in an out of band process, like a customer Lambda Function.

*/
export async function GetApiKey(
  secretName: string,
  regionName: string = "us-west-2"
  ): Promise<string> {
    try {
      // Get connection client to AWS Secrets Manager.
      const client = new SecretsManagerClient({ region: regionName});
      // Get Momento API key.
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

/* This function calls to the GetApiKey function, uses the Momento API key to create a
 Momento client connection to Momento Cache and returns that object for later use. */
export default async function CreateCacheClient(
  ttl:number = 600,
  apiKeySecretName:string = "Momento_Api_Key",
  ): Promise<CacheClient> {
  // Call the GetApiKey function to get a Momento API key from AWS Secrets Manager.
  const apiKey: string = await GetApiKey(apiKeySecretName);
  // Get a new cache connection with the API key and set a default TTL for the connection.
  return await CacheClient.create({
      configuration: Configurations.Laptop.latest(),
      credentialProvider: CredentialProvider.fromString({ apiKey : apiKey }),
      defaultTtlSeconds: ttl,
  });
}
