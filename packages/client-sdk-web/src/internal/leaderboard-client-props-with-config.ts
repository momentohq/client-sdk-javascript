import {LeaderboardClientProps} from '../leaderboard-client-props';
import {LeaderboardConfiguration} from '../config/leaderboard-configuration';

export interface LeaderboardClientPropsWithConfig
  extends LeaderboardClientProps {
  configuration: LeaderboardConfiguration;
}
