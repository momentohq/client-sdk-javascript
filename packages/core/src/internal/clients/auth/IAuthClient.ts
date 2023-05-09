import {
  CredentialProvider,
  ExpiresIn,
  GenerateApiToken,
  RefreshApiToken,
} from '../../../index';

export interface IAuthClient {
  generateApiToken(
    controlEndpoint: string,
    sessionToken: string,
    expiresIn: ExpiresIn
  ): Promise<GenerateApiToken.Response>;
  //
  // refreshApiToken(
  //   credentialProvider: CredentialProvider,
  //   refreshToken: string
  // ): Promise<RefreshApiToken.Response>;
}
