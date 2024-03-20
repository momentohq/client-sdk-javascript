import {ReadConcern} from '@gomomento/sdk-core';
import {version} from '../../package.json';

export interface ClientMetadataProps {
  authToken?: string;
  readConcern?: ReadConcern;
}

/**
 * Provider for metadata about a client.
 */
export class ClientMetadataProvider {
  private static readonly agentName: string = 'js-web';
  private readonly authToken?: string;
  private isAgentSent = false;
  private readConcern?: ReadConcern;
  constructor(props: ClientMetadataProps) {
    this.authToken = props.authToken;
    this.readConcern = props.readConcern;
  }

  /**
   * Creates a client metadata header map. Provides an authorization header if an auth token is present. Provides an
   * agent string on the first call.
   */
  public createClientMetadata(): {[key: string]: string} {
    const metadata: {[key: string]: string} = {};
    if (this.authToken) {
      metadata['authorization'] = this.authToken;
    }
    if (!this.isAgentSent) {
      this.isAgentSent = true;
      metadata['Agent'] = `${ClientMetadataProvider.agentName}:${version}`;
    }
    if (this.readConcern) {
      metadata['read-concern'] = this.readConcern;
    }
    return metadata;
  }
}
