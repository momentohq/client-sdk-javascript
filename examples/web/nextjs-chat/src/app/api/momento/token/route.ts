import {
  AuthClient,
  CredentialProvider,
  GenerateDisposableToken,
} from "@gomomento/sdk";
import {
  tokenPermissions,
  tokenExpiresIn,
  authenticationMethod,
  AuthenticationMethod,
} from "./config";
import { authOptions } from "../../auth/[...nextauth]/route";
import { getServerSession } from "next-auth";
import { type NextRequest } from "next/server";

const authClient = new AuthClient({
  credentialProvider: CredentialProvider.fromString({
    apiKey: process.env.MOMENTO_API_KEY,
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

  if (
    generateDisposableTokenResponse instanceof GenerateDisposableToken.Success
  ) {
    return new Response(generateDisposableTokenResponse.authToken, {
      headers: {
        "Cache-Control": "no-cache",
      },
    });
  } else if (
    generateDisposableTokenResponse instanceof GenerateDisposableToken.Error
  ) {
    throw new Error(generateDisposableTokenResponse.message());
  }
  throw new Error("Unable to get token from momento");
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
