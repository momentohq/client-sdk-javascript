import {BasicConfigOptions, BrowserConfigOptions} from '../utils/config';
import {Browser} from '../browser-topics';

describe('load-test', () => {
  it('publish simulator', async () => {
    // export BROWSER_CONFIG='{"numberOfBrowserInstances": 1, "publishRatePerSecond": 10}'
    const browserConfigEnv = process.env.BROWSER_CONFIG;
    if (!browserConfigEnv) {
      throw new Error('Missing environment variable(s). Please set BROWSER_CONFIG.');
    }
    let browserConfig: BrowserConfigOptions;
    try {
      browserConfig = JSON.parse(browserConfigEnv) as BrowserConfigOptions;
    } catch (error) {
      throw new Error('Error parsing JSON configuration');
    }

    const basicConfig: BasicConfigOptions = {
      cacheName: 'topicLoadTestCache',
      topicName: 'topicLoadTestTopic',
    };

    for (let i = 0; i < browserConfig.numberOfBrowserInstances; i++) {
      const browser = new Browser(browserConfig, basicConfig);
      await browser.startSimulating();
    }
  });
});
