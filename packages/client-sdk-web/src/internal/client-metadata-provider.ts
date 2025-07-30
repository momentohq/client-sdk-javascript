import {ReadConcern} from '@gomomento/sdk-core';
import {version} from '../../package.json';
import {UAParser} from 'ua-parser-js';

export interface ClientMetadataProps {
  authToken?: string;
  readConcern?: ReadConcern;
  clientType: string;
}

/**
 * Provider for metadata about a client.
 */
export class ClientMetadataProvider {
  private static readonly agentName: string = 'js-web';
  private readonly authToken?: string;
  private readonly clientType: string;
  private areFirstTimeHeadersSent = false;
  private readConcern?: ReadConcern;
  constructor(props: ClientMetadataProps) {
    this.authToken = props.authToken;
    this.readConcern = props.readConcern;
    this.clientType = props.clientType ?? 'unknown';
  }

  /**
   * Creates a client metadata header map. Provides an authorization header if an auth token is present. Provides an
   * agent string on the first call.
   */
  public createClientMetadata(): {[key: string]: string} {
    const metadata: {[key: string]: string} = {};
    const {browser, device, os} = UAParser(navigator.userAgent);
    if (this.authToken) {
      metadata['authorization'] = this.authToken;
    }
    if (!this.areFirstTimeHeadersSent) {
      this.areFirstTimeHeadersSent = true;
      metadata[
        'agent'
      ] = `${ClientMetadataProvider.agentName}:${this.clientType}:${version}`;
      metadata['runtime-version'] = [
        `${ClientMetadataProvider.agentName}`,
        browser.name ?? 'unknown-browser',
        os.name ?? 'unknown-os',
        device.model ?? 'unknown-device',
      ].join(':');
    }
    // Not sending a head concern header is treated the same as sending a BALANCED read concern header
    if (this.readConcern && this.readConcern !== ReadConcern.BALANCED) {
      metadata['read-concern'] = this.readConcern;
    }
    return metadata;
  }
}

// Each browser uses its own JS engine, the best we can do is detect the browser name.
// Source: https://developer.mozilla.org/en-US/docs/Web/API/Window/navigator
// function getBrowserName(userAgent: string): string {
//   // Check for empty string, null, or undefined.
//   if (!userAgent) {
//     return 'unknown-browser';
//   }
//   // The order matters here, and this may report false positives for unlisted browsers.
//   if (userAgent.includes('Firefox')) {
//     // "Mozilla/5.0 (X11; Linux i686; rv:104.0) Gecko/20100101 Firefox/104.0"
//     return 'Mozilla-Firefox';
//   } else if (userAgent.includes('SamsungBrowser')) {
//     // "Mozilla/5.0 (Linux; Android 9; SAMSUNG SM-G955F Build/PPR1.180610.011) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/9.4 Chrome/67.0.3396.87 Mobile Safari/537.36"
//     return 'Samsung-Internet';
//   } else if (userAgent.includes('Opera') || userAgent.includes('OPR')) {
//     // "Mozilla/5.0 (Macintosh; Intel Mac OS X 12_5_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/104.0.0.0 Safari/537.36 OPR/90.0.4480.54"
//     return 'Opera';
//   } else if (userAgent.includes('Edge')) {
//     // "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36 Edge/16.16299"
//     return 'Microsoft-Edge-(Legacy)';
//   } else if (userAgent.includes('Edg')) {
//     // "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/104.0.0.0 Safari/537.36 Edg/104.0.1293.70"
//     return 'Microsoft-Edge-(Chromium)';
//   } else if (userAgent.includes('Chrome')) {
//     // "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/104.0.0.0 Safari/537.36"
//     return 'Google-Chrome-or-Chromium';
//   } else if (userAgent.includes('Safari')) {
//     // "Mozilla/5.0 (iPhone; CPU iPhone OS 15_6_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.6 Mobile/15E148 Safari/604.1"
//     return 'Apple-Safari';
//   } else {
//     return 'unknown-browser';
//   }
// }
