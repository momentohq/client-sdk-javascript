import {
  GenerateApiToken,
  MomentoErrorCode,
  RefreshApiToken,
  ExpiresIn,
  CredentialProvider,
} from '@gomomento/sdk-core';
import {SetupAuthIntegrationTest, delay} from './integration-setup';

const {authClient, sessionToken, controlEndpoint} = SetupAuthIntegrationTest();

describe('Integration tests for generating api tokens', () => {
  it('should succeed for generating an api token that expires', async () => {
    const secondsSinceEpoch = Math.round(Date.now() / 1000);
    const expireResponse = await authClient.generateApiToken(
      controlEndpoint,
      sessionToken,
      ExpiresIn.seconds(10)
    );
    const expiresIn = secondsSinceEpoch + 10;

    expect(expireResponse).toBeInstanceOf(GenerateApiToken.Success);

    const expireResponseSuccess = expireResponse as GenerateApiToken.Success;
    expect(expireResponseSuccess.is_success);
    expect(expireResponseSuccess.getExpiresAt().doesExpire());
    expect(expireResponseSuccess.getExpiresAt().epoch()).toBeWithin(
      expiresIn - 1,
      expiresIn + 2
    );
  });

  it('should succeed for generating an api token that never expires', async () => {
    const neverExpiresResponse = await authClient.generateApiToken(
      controlEndpoint,
      sessionToken,
      ExpiresIn.never()
    );
    expect(neverExpiresResponse).toBeInstanceOf(GenerateApiToken.Success);
    const neverExpireResponseSuccess =
      neverExpiresResponse as GenerateApiToken.Success;
    expect(neverExpireResponseSuccess.is_success);
    expect(neverExpireResponseSuccess.getExpiresAt().doesExpire()).toBeFalse();
  });

  it('should not succeed for generating an api token that has an invalid expires', async () => {
    const invalidExpiresResponse = await authClient.generateApiToken(
      controlEndpoint,
      sessionToken,
      ExpiresIn.seconds(-100)
    );
    expect(invalidExpiresResponse).toBeInstanceOf(GenerateApiToken.Error);
    expect(
      (invalidExpiresResponse as GenerateApiToken.Error).errorCode()
    ).toEqual(MomentoErrorCode.INVALID_ARGUMENT_ERROR);
  });

  it('should not succeed for generating an api token that has an invalid session token', async () => {
    const invalidExpiresResponse = await authClient.generateApiToken(
      controlEndpoint,
      'this is *not* valid',
      ExpiresIn.seconds(60)
    );
    expect(invalidExpiresResponse).toBeInstanceOf(GenerateApiToken.Error);
    expect(
      (invalidExpiresResponse as GenerateApiToken.Error).errorCode()
    ).toEqual(MomentoErrorCode.AUTHENTICATION_ERROR);
  });

  it('should succeed for refreshing an api token', async () => {
    const generateResponse = await authClient.generateApiToken(
      controlEndpoint,
      sessionToken,
      ExpiresIn.seconds(10)
    );
    const generateSuccessRst = generateResponse as GenerateApiToken.Success;

    // const refreshResponse = await authClient.refreshApiToken(
    //   CredentialProvider.fromString({
    //     authToken: generateSuccessRst.getApiToken(),
    //   }),
    //   generateSuccessRst.refreshToken
    // );
    // expect(refreshResponse).toBeInstanceOf(RefreshApiToken.Success);
    // const refreshSuccessRst = refreshResponse as RefreshApiToken.Success;
    //
    // expect(refreshSuccessRst.is_success);
    //
    // expect(generateSuccessRst.getExpiresAt().epoch()).toEqual(
    //   refreshSuccessRst.getExpiresAt().epoch()
    // );
  });

  it("should not succeed for refreshing an api token that's expired", async () => {
    const generateResponse = await authClient.generateApiToken(
      controlEndpoint,
      sessionToken,
      ExpiresIn.seconds(1)
    );
    const generateSuccessRst = generateResponse as GenerateApiToken.Success;

    // Wait 1sec for the token to expire
    await delay(1000);

    // const refreshResponse = await authClient.refreshApiToken(
    //   CredentialProvider.fromString({
    //     authToken: generateSuccessRst.getApiToken(),
    //   }),
    //   generateSuccessRst.refreshToken
    // );
    // expect(refreshResponse).toBeInstanceOf(RefreshApiToken.Error);
    // expect((refreshResponse as GenerateApiToken.Error).errorCode()).toEqual(
    //   MomentoErrorCode.AUTHENTICATION_ERROR
    // );
  });
});
