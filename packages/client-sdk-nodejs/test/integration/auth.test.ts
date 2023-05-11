import {
  GenerateAuthToken,
  MomentoErrorCode,
  RefreshAuthToken,
  ExpiresIn,
  CredentialProvider,
} from '@gomomento/sdk-core';
import {SetupAuthIntegrationTest, delay} from './integration-setup';

const {authClient, sessionToken, controlEndpoint} = SetupAuthIntegrationTest();

describe('Integration tests for generating api tokens', () => {
  it('should succeed for generating an api token that expires', async () => {
    const secondsSinceEpoch = Math.round(Date.now() / 1000);
    const expireResponse = await authClient.generateAuthToken(
      controlEndpoint,
      sessionToken,
      ExpiresIn.seconds(10)
    );
    const expiresIn = secondsSinceEpoch + 10;

    expect(expireResponse).toBeInstanceOf(GenerateAuthToken.Success);

    const expireResponseSuccess = expireResponse as GenerateAuthToken.Success;
    expect(expireResponseSuccess.is_success);
    expect(expireResponseSuccess.getExpiresAt().doesExpire());
    expect(expireResponseSuccess.getExpiresAt().epoch()).toBeWithin(
      expiresIn - 1,
      expiresIn + 2
    );
  });

  it('should succeed for generating an api token that never expires', async () => {
    const neverExpiresResponse = await authClient.generateAuthToken(
      controlEndpoint,
      sessionToken,
      ExpiresIn.never()
    );
    expect(neverExpiresResponse).toBeInstanceOf(GenerateAuthToken.Success);
    const neverExpireResponseSuccess =
      neverExpiresResponse as GenerateAuthToken.Success;
    expect(neverExpireResponseSuccess.is_success);
    expect(neverExpireResponseSuccess.getExpiresAt().doesExpire()).toBeFalse();
  });

  it('should not succeed for generating an api token that has an invalid expires', async () => {
    const invalidExpiresResponse = await authClient.generateAuthToken(
      controlEndpoint,
      sessionToken,
      ExpiresIn.seconds(-100)
    );
    expect(invalidExpiresResponse).toBeInstanceOf(GenerateAuthToken.Error);
    expect(
      (invalidExpiresResponse as GenerateAuthToken.Error).errorCode()
    ).toEqual(MomentoErrorCode.INVALID_ARGUMENT_ERROR);
  });

  it('should not succeed for generating an api token that has an invalid session token', async () => {
    const invalidExpiresResponse = await authClient.generateAuthToken(
      controlEndpoint,
      'this is *not* valid',
      ExpiresIn.seconds(60)
    );
    expect(invalidExpiresResponse).toBeInstanceOf(GenerateAuthToken.Error);
    expect(
      (invalidExpiresResponse as GenerateAuthToken.Error).errorCode()
    ).toEqual(MomentoErrorCode.AUTHENTICATION_ERROR);
  });

  it('should succeed for refreshing an api token', async () => {
    const generateResponse = await authClient.generateAuthToken(
      controlEndpoint,
      sessionToken,
      ExpiresIn.seconds(10)
    );
    const generateSuccessRst = generateResponse as GenerateAuthToken.Success;

    const refreshResponse = await authClient.refreshAuthToken(
      CredentialProvider.fromString({
        authToken: generateSuccessRst.getAuthToken(),
      }),
      generateSuccessRst.refreshToken
    );
    expect(refreshResponse).toBeInstanceOf(RefreshAuthToken.Success);
    const refreshSuccessRst = refreshResponse as RefreshAuthToken.Success;

    expect(refreshSuccessRst.is_success);

    expect(generateSuccessRst.getExpiresAt().epoch()).toEqual(
      refreshSuccessRst.getExpiresAt().epoch()
    );
  });

  it("should not succeed for refreshing an api token that's expired", async () => {
    const generateResponse = await authClient.generateAuthToken(
      controlEndpoint,
      sessionToken,
      ExpiresIn.seconds(1)
    );
    const generateSuccessRst = generateResponse as GenerateAuthToken.Success;

    // Wait 1sec for the token to expire
    await delay(1000);

    const refreshResponse = await authClient.refreshAuthToken(
      CredentialProvider.fromString({
        authToken: generateSuccessRst.getAuthToken(),
      }),
      generateSuccessRst.refreshToken
    );
    expect(refreshResponse).toBeInstanceOf(RefreshAuthToken.Error);
    expect((refreshResponse as RefreshAuthToken.Error).errorCode()).toEqual(
      MomentoErrorCode.AUTHENTICATION_ERROR
    );
  });
});
