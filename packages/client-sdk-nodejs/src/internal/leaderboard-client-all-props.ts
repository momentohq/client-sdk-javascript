import {LeaderboardClientProps} from '../leaderboard-client-props';
import {LeaderboardConfiguration} from '../config/leaderboard-configuration';
import {CredentialProvider} from '@gomomento/sdk-core';

export interface LeaderboardClientAllProps extends LeaderboardClientProps {
  configuration: LeaderboardConfiguration;
  credentialProvider: CredentialProvider;
}
