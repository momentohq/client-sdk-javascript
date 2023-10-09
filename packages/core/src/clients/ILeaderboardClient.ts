import {ILeaderboard} from './ILeaderboard';

export interface ILeaderboardClient {
  leaderboard(cacheName: string, leaderboardName: string): ILeaderboard;
}
