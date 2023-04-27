import {PingClient} from '../../src/ping-client';
import {NoopMomentoLoggerFactory} from '@gomomento/sdk-core';

describe('ping service', () => {
  it('ping should work', async () => {
    const client = new PingClient({
      endpoint: 'cell-alpha-dev.preprod.a.momentohq.com',
      configuration: {
        getLoggerFactory: () => new NoopMomentoLoggerFactory(),
      },
    });
    await client.ping();
  });
});
