import {
  GenerateApiToken,
  MomentoErrorCode,
  RefreshApiToken,
} from '@gomomento/core';
import {SetupAuthIntegrationTest} from './integration-setup';

const {Momento, SessionToken} = SetupAuthIntegrationTest();

describe('Integration tests for generting api tokens', () => {
  it('should succeed for generating an api token that expires', async () => {
    const secondsSinceEpoch = Math.round(Date.now() / 1000);
    const expireResponse = await Momento.generateApiToken(SessionToken, 10);
    const expiresIn = secondsSinceEpoch + 10;

    expect(expireResponse).toBeInstanceOf(GenerateApiToken.Success);

    const expireResponseSuccess = expireResponse as GenerateApiToken.Success;
    expect(expireResponseSuccess.is_success);

    expect(expireResponseSuccess.validUntil).toBeWithin(
      expiresIn,
      expiresIn + 1
    );
  });

  it('should succeed for generating an api token that never expires', async () => {
    const neverExpiresResponse = await Momento.generateApiToken(
      SessionToken,
      undefined
    );
    expect(neverExpiresResponse).toBeInstanceOf(GenerateApiToken.Success);
    const neverExpireResponseSuccess =
      neverExpiresResponse as GenerateApiToken.Success;
    expect(neverExpireResponseSuccess.is_success);
    expect(neverExpireResponseSuccess.validUntil).toEqual(undefined);
  });

  it('should not succeed for generating an api token that has an invalid expires', async () => {
    const invalidExpiresResponse = await Momento.generateApiToken(
      SessionToken,
      -100
    );
    expect(invalidExpiresResponse).toBeInstanceOf(GenerateApiToken.Error);
    expect(
      (invalidExpiresResponse as GenerateApiToken.Error).errorCode()
    ).toEqual(MomentoErrorCode.INVALID_ARGUMENT_ERROR);
  });

  it('should not succeed for generating an api token that has an invalid session token', async () => {
    const invalidExpiresResponse = await Momento.generateApiToken(
      'this is *not* valid',
      60
    );
    expect(invalidExpiresResponse).toBeInstanceOf(GenerateApiToken.Error);
    expect(
      (invalidExpiresResponse as GenerateApiToken.Error).errorCode()
    ).toEqual(MomentoErrorCode.AUTHENTICATION_ERROR);
  });

  it('should succeed for refreshing an api token', async () => {
    const generateResponse = await Momento.generateApiToken(SessionToken, 10);
    const generateSuccessRst = generateResponse as GenerateApiToken.Success;

    const refreshResponse = await Momento.refreshApiToken(
      generateSuccessRst.apiToken,
      generateSuccessRst.refreshToken
    );
    expect(refreshResponse).toBeInstanceOf(RefreshApiToken.Success);
    const refreshSuccessRst = refreshResponse as RefreshApiToken.Success;

    expect(refreshSuccessRst.is_success);
    expect(refreshSuccessRst.validUntil).toEqual(refreshSuccessRst.validUntil);
  });

  it("should not succeed for refreshing an api token that's expired", async () => {
    const generateResponse = await Momento.generateApiToken(SessionToken, 1);
    const generateSuccessRst = generateResponse as GenerateApiToken.Success;

    await new Promise(r => setTimeout(r, 1000));

    const refreshResponse = await Momento.refreshApiToken(
      generateSuccessRst.apiToken,
      generateSuccessRst.refreshToken
    );
    expect(refreshResponse).toBeInstanceOf(RefreshApiToken.Error);
    expect((refreshResponse as GenerateApiToken.Error).errorCode()).toEqual(
      MomentoErrorCode.AUTHENTICATION_ERROR
    );
  });

  it("should not succeed for refreshing an api token that's invalid", async () => {
    const generateResponse = await Momento.generateApiToken(SessionToken, 1);
    const generateSuccessRst = generateResponse as GenerateApiToken.Success;

    const refreshResponse = await Momento.refreshApiToken(
      'not valid',
      generateSuccessRst.refreshToken
    );
    expect(refreshResponse).toBeInstanceOf(RefreshApiToken.Error);
    expect((refreshResponse as GenerateApiToken.Error).errorCode()).toEqual(
      MomentoErrorCode.AUTHENTICATION_ERROR
    );
  });
});
