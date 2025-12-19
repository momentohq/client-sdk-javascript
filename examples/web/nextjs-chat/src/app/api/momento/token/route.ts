import {
  AuthClient,
  CredentialProvider,
  GenerateDisposableTokenResponse,
} from "@gomomento/sdk";
import {
  tokenPermissions,
  tokenExpiresIn,
  authenticationMethod,
  AuthenticationMethod,
} from "./config";
import { authOptions } from "../../auth/[...nextauth]/auth-options";
import { getServerSession } from "next-auth";
import { type NextRequest } from "next/server";

const authClient = new AuthClient({
  credentialProvider: CredentialProvider.fromString({
    apiKey: process.env.V1_API_KEY,
  }),
});

export const revalidate = 0;

export async function GET(_request: NextRequest) {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  let usernameValue: undefined | string =
    _request.nextUrl.searchParams.get("username");
  usernameValue = usernameValue === null ? undefined : usernameValue;

  if (usernameValue === undefined) {
    console.error(`Username is undefined`);
  }

  let generateDisposableTokenResponse;
  switch (authenticationMethod) {
    case AuthenticationMethod.Open:
      generateDisposableTokenResponse = await fetchTokenWithOpenAuth(
        usernameValue,
      );
      break;
    case AuthenticationMethod.Credentials:
      generateDisposableTokenResponse = await fetchTokenWithAuthCredentials(
        usernameValue,
      );
      break;
    default:
      throw new Error("Unimplemented authentication method");
  }

  switch (generateDisposableTokenResponse.type) {
    case GenerateDisposableTokenResponse.Success:
      return new Response(generateDisposableTokenResponse.authToken, {
        headers: {
          "Cache-Control": "no-cache",
        },
      });
    case GenerateDisposableTokenResponse.Error:
      throw new Error(generateDisposableTokenResponse.message());
  }
}

async function fetchTokenWithOpenAuth(username: string | undefined) {
  return await authClient.generateDisposableToken(
    tokenPermissions,
    tokenExpiresIn,
    { tokenId: username },
  );
}

async function fetchTokenWithAuthCredentials(username: string | undefined) {
  const session = await getServerSession(authOptions);

  if (!session) {
    throw new Error("Unauthorized to request Momento token");
  }

  return await authClient.generateDisposableToken(
    tokenPermissions,
    tokenExpiresIn,
    { tokenId: username },
  );
}
