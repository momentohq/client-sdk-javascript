import {InvalidArgumentError} from '@gomomento/sdk-core';
import {
  AbstractLeaderboard,
  ILeaderboard,
} from '@gomomento/sdk-core/dist/src/internal/clients/leaderboard';
import {
  validateCacheName,
  validateLeaderboardName,
} from '@gomomento/sdk-core/dist/src/internal/utils';
import {ILeaderboardDataClient} from '@gomomento/sdk-core/dist/src/internal/clients/leaderboard/ILeaderboardDataClient';

export class Leaderboard extends AbstractLeaderboard implements ILeaderboard {
  constructor(
    dataClient: ILeaderboardDataClient,
    cacheName: string,
    leaderboardName: string
  ) {
    try {
      validateCacheName(cacheName);
      validateLeaderboardName(leaderboardName);
    } catch (err) {
      throw new InvalidArgumentError(
        'cache name and leaderboard name must not be empty strings'
      );
    }
    super(cacheName, leaderboardName, dataClient);
  }
}
