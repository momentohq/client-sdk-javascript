import {ExpiresIn, GenerateApiToken} from '@gomomento/sdk-core';
import {IAuthClient} from '@gomomento/sdk-core/dist/src/internal/clients/auth/IAuthClient';

export function runGenerateApiTokenTest(client: IAuthClient) {
  // skipping test for now until we decide how to feed a session token here
  describe('generate api token', () => {
    it.skip('should return success and generate auth token', async () => {
      const sessionToken = process.env.TEST_SESSION_TOKEN as string;
      const resp = await client.generateApiToken(
        "place-control-plane-endpoint-here",
        sessionToken,
        ExpiresIn.seconds(10)
      );
      expect(resp).toBeInstanceOf(GenerateApiToken.Success);
    });
  });
}
