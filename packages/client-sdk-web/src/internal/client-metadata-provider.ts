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
