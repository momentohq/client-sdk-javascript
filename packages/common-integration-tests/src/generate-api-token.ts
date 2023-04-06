import {GenerateApiToken, IAuthClient} from '@gomomento/common';

export function runGenerateApiTokenTest(Momento: IAuthClient) {
  // skipping test for now until we decide how to feed a session token here
  describe('generate api token', () => {
    it.skip('should return success and generate auth token', async () => {
      const sessionToken = process.env.TEST_SESSION_TOKEN as string;
      const resp = await Momento.generateApiToken(sessionToken);
      expect(resp).toBeInstanceOf(GenerateApiToken.Success);
    });
  });
}
