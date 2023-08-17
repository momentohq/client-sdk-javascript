import {
  AuthClient,
  CredentialProvider,
  GenerateAuthToken,
} from "@gomomento/sdk";
import {
  tokenPermissions,
  tokenExpiresIn,
  authenticationMethod,
  AuthenticationMethod,
} from "./config";
import { authOptions } from "../../auth/[...nextauth]/route";
import { getServerSession } from "next-auth";

const authClient = new AuthClient({
  credentialProvider: CredentialProvider.fromString({
    authToken: process.env.MOMENTO_AUTH_TOKEN,
  }),
});

export const revalidate = 0;
export async function GET(_request: Request) {
  let generateAuthTokenResponse;
  switch (authenticationMethod) {
    case AuthenticationMethod.Open:
      generateAuthTokenResponse = await fetchTokenWithOpenAuth();
      break;
    case AuthenticationMethod.Credentials:
      generateAuthTokenResponse = await fetchTokenWithAuthCredentials();
      break;
    default:
      throw new Error("Unimplemented authentication method");
  }

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

async function fetchTokenWithOpenAuth() {
  return await authClient.generateAuthToken(tokenPermissions, tokenExpiresIn);
}

async function fetchTokenWithAuthCredentials() {
  const session = await getServerSession(authOptions);

  if (!session) {
    throw new Error("Unauthorized to request Momento token");
  }

  return await authClient.generateAuthToken(tokenPermissions, tokenExpiresIn);
}
