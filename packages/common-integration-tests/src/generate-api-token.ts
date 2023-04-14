import {GenerateApiToken} from '@gomomento/core';
import {IAuthClient} from '@gomomento/core/dist/src/internal/clients/auth/IAuthClient';

export function runGenerateApiTokenTest(client: IAuthClient) {
  // skipping test for now until we decide how to feed a session token here
  describe('generate api token', () => {
    it.skip('should return success and generate auth token', async () => {
      const sessionToken = process.env.TEST_SESSION_TOKEN as string;
      const resp = await client.generateApiToken(sessionToken);
      expect(resp).toBeInstanceOf(GenerateApiToken.Success);
    });
  });
}
