import {
  AuthClient,
  CredentialProvider,
  GenerateAuthToken,
} from "@gomomento/sdk";
import { tokenPermissions, tokenExpiresIn } from "./config";

const authClient = new AuthClient({
  credentialProvider: CredentialProvider.fromString({
    authToken: process.env.MOMENTO_AUTH_TOKEN,
  }),
});

export const revalidate = 0;
export async function GET(_request: Request) {
  const generateAuthTokenResponse = await authClient.generateAuthToken(
    tokenPermissions,
    tokenExpiresIn,
  );

  if (generateAuthTokenResponse instanceof GenerateAuthToken.Success) {
    return new Response(generateAuthTokenResponse.authToken, {
      headers: {
        "Cache-Control": "no-cache",
      },
    });
  } else if (generateAuthTokenResponse instanceof GenerateAuthToken.Error) {
    throw new Error(generateAuthTokenResponse.message());
  }
  throw new Error("Unable to get token from momento");
}
