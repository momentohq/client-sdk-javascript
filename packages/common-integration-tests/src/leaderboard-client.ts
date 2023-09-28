import {
  ILeaderboardClient,
  LeaderboardFetch,
  LeaderboardUpsert,
  LeaderboardOrder,
  MomentoErrorCode,
} from '@gomomento/sdk-core';
import {expectWithMessage} from './common-int-test-utils';
import {v4} from 'uuid';

export function runLeaderboardClientTests(
  leaderboardClient: ILeaderboardClient,
  integrationTestCacheName: string
) {
  describe('#Upsert elements', () => {
    const leaderboardName = `leaderboard-${v4()}`;

    it('validates the cache name', async () => {
      const elements = new Map([
        [123n, 100],
        [456n, 200],
        [789n, 300],
      ]);
      const response = await leaderboardClient.leaderboardUpsert(
        '   ',
        leaderboardName,
        elements
      );
      expectWithMessage(() => {
        expect(response).toBeInstanceOf(LeaderboardUpsert.Error);
      }, `expected ERROR but got ${response.toString()}`);
    });

    it('validates the leaderboard name', async () => {
      const elements = new Map([
        [123n, 100],
        [456n, 200],
        [789n, 300],
      ]);
      const response = await leaderboardClient.leaderboardUpsert(
        integrationTestCacheName,
        '   ',
        elements
      );
      expectWithMessage(() => {
        expect(response).toBeInstanceOf(LeaderboardUpsert.Error);
      }, `expected ERROR but got ${response.toString()}`);
    });

    it('creates new leaderboard to insert elements into', async () => {
      const elements = new Map([
        [123n, 100.0],
        [456n, 200.0],
        [789n, 300.0],
      ]);
      const response = await leaderboardClient.leaderboardUpsert(
        integrationTestCacheName,
        leaderboardName,
        elements
      );
      expectWithMessage(() => {
        expect(response).toBeInstanceOf(LeaderboardUpsert.Success);
      }, `expected SUCCESS but got ${response.toString()}`);

      const fetchResponse = await leaderboardClient.leaderboardFetchByRank(
        integrationTestCacheName,
        leaderboardName
      );
      expectWithMessage(() => {
        expect(fetchResponse).toBeInstanceOf(LeaderboardFetch.Found);
      }, `expected HIT but got ${fetchResponse.toString()}`);
      const receivedElements = (
        fetchResponse as LeaderboardFetch.Found
      ).valueArray();
      const expectedElements = [
        {
          id: 123n,
          score: 100,
          rank: 0n,
        },
        {
          id: 456n,
          score: 200,
          rank: 1n,
        },
        {
          id: 789n,
          score: 300,
          rank: 2n,
        },
      ];
      expect(receivedElements).toEqual(expectedElements);
    });

    it('inserts new elements into an existing leaderboard', async () => {
      const elements = new Map([
        [1234n, 800],
        [5678n, 900],
      ]);
      const response = await leaderboardClient.leaderboardUpsert(
        integrationTestCacheName,
        leaderboardName,
        elements
      );
      expectWithMessage(() => {
        expect(response).toBeInstanceOf(LeaderboardUpsert.Success);
      }, `expected SUCCESS but got ${response.toString()}`);

      const fetchResponse = await leaderboardClient.leaderboardFetchByRank(
        integrationTestCacheName,
        leaderboardName
      );
      expectWithMessage(() => {
        expect(fetchResponse).toBeInstanceOf(LeaderboardFetch.Found);
      }, `expected HIT but got ${fetchResponse.toString()}`);
      const receivedElements = (
        fetchResponse as LeaderboardFetch.Found
      ).valueArray();
      const expectedElements = [
        {
          id: 123n,
          score: 100,
          rank: 0n,
        },
        {
          id: 456n,
          score: 200,
          rank: 1n,
        },
        {
          id: 789n,
          score: 300,
          rank: 2n,
        },
        {
          id: 1234n,
          score: 800,
          rank: 3n,
        },
        {
          id: 5678n,
          score: 900,
          rank: 4n,
        },
      ];
      expect(receivedElements).toEqual(expectedElements);
    });

    it('updates elements when they already exist in the leaderboard', async () => {
      const elements = new Map([
        [123n, 500],
        [456n, 600],
        [789n, 700],
      ]);
      const response = await leaderboardClient.leaderboardUpsert(
        integrationTestCacheName,
        leaderboardName,
        elements
      );
      expectWithMessage(() => {
        expect(response).toBeInstanceOf(LeaderboardUpsert.Success);
      }, `expected SUCCESS but got ${response.toString()}`);

      const fetchResponse = await leaderboardClient.leaderboardFetchByRank(
        integrationTestCacheName,
        leaderboardName
      );
      expectWithMessage(() => {
        expect(fetchResponse).toBeInstanceOf(LeaderboardFetch.Found);
      }, `expected HIT but got ${fetchResponse.toString()}`);
      const receivedElements = (
        fetchResponse as LeaderboardFetch.Found
      ).valueArray();
      const expectedElements = [
        {
          id: 123n,
          score: 500,
          rank: 0n,
        },
        {
          id: 456n,
          score: 600,
          rank: 1n,
        },
        {
          id: 789n,
          score: 700,
          rank: 2n,
        },
        {
          id: 1234n,
          score: 800,
          rank: 3n,
        },
        {
          id: 5678n,
          score: 900,
          rank: 4n,
        },
      ];
      expect(receivedElements).toEqual(expectedElements);
    });
  });

  // describe('#Fetch by score', () => {
  //   it('', async () => {});
  // });

  describe('#Fetch by rank', () => {
    const leaderboardName = `leaderboard-${v4()}`;

    it('validates the cache name', async () => {
      const response = await leaderboardClient.leaderboardFetchByRank(
        '   ',
        leaderboardName
      );
      expectWithMessage(() => {
        expect(response).toBeInstanceOf(LeaderboardFetch.Error);
      }, `expected ERROR but got ${response.toString()}`);
    });

    it('validates the leaderboard name', async () => {
      const response = await leaderboardClient.leaderboardFetchByRank(
        integrationTestCacheName,
        '   '
      );
      expectWithMessage(() => {
        expect(response).toBeInstanceOf(LeaderboardFetch.Error);
      }, `expected ERROR but got ${response.toString()}`);
    });

    it('validates the rank range', async () => {
      const negativeStartRank = await leaderboardClient.leaderboardFetchByRank(
        integrationTestCacheName,
        leaderboardName,
        {startRank: -10}
      );
      expectWithMessage(() => {
        expect(negativeStartRank).toBeInstanceOf(LeaderboardFetch.Error);
      }, `expected ERROR but got ${negativeStartRank.toString()}`);
      const negativeStartRankError =
        negativeStartRank as LeaderboardFetch.Error;
      expectWithMessage(() => {
        expect(negativeStartRankError.errorCode()).toEqual(
          MomentoErrorCode.INVALID_ARGUMENT_ERROR
        );
      }, `expected INVALID_ARGUMENT_ERROR but got ${negativeStartRankError.errorCode()} ${negativeStartRankError.message()}`);

      const negativeEndRank = await leaderboardClient.leaderboardFetchByRank(
        integrationTestCacheName,
        leaderboardName,
        {endRank: -10}
      );
      expectWithMessage(() => {
        expect(negativeEndRank).toBeInstanceOf(LeaderboardFetch.Error);
      }, `expected ERROR but got ${negativeEndRank.toString()}`);
      const negativeEndRankError = negativeEndRank as LeaderboardFetch.Error;
      expectWithMessage(() => {
        expect(negativeEndRankError.errorCode()).toEqual(
          MomentoErrorCode.INVALID_ARGUMENT_ERROR
        );
      }, `expected INVALID_ARGUMENT_ERROR but got ${negativeEndRankError.errorCode()} ${negativeEndRankError.message()}`);

      const noRange = await leaderboardClient.leaderboardFetchByRank(
        integrationTestCacheName,
        leaderboardName,
        {startRank: 0, endRank: 0}
      );
      expectWithMessage(() => {
        expect(noRange).toBeInstanceOf(LeaderboardFetch.Error);
      }, `expected ERROR but got ${noRange.toString()}`);
      const noRangeError = noRange as LeaderboardFetch.Error;
      expectWithMessage(() => {
        expect(noRangeError.errorCode()).toEqual(
          MomentoErrorCode.INVALID_ARGUMENT_ERROR
        );
      }, `expected INVALID_ARGUMENT_ERROR but got ${noRangeError.errorCode()} ${noRangeError.message()}`);

      const reverseRange = await leaderboardClient.leaderboardFetchByRank(
        integrationTestCacheName,
        leaderboardName,
        {startRank: 10, endRank: 5}
      );
      expectWithMessage(() => {
        expect(reverseRange).toBeInstanceOf(LeaderboardFetch.Error);
      }, `expected ERROR but got ${reverseRange.toString()}`);
      const reverseRangeError = reverseRange as LeaderboardFetch.Error;
      expectWithMessage(() => {
        expect(reverseRangeError.errorCode()).toEqual(
          MomentoErrorCode.INVALID_ARGUMENT_ERROR
        );
      }, `expected INVALID_ARGUMENT_ERROR but got ${reverseRangeError.errorCode()} ${reverseRangeError.message()}`);

      const overLimit = await leaderboardClient.leaderboardFetchByRank(
        integrationTestCacheName,
        leaderboardName,
        {startRank: 0, endRank: 8193}
      );
      expectWithMessage(() => {
        expect(overLimit).toBeInstanceOf(LeaderboardFetch.Error);
      }, `expected ERROR but got ${overLimit.toString()}`);
      const overLimitError = overLimit as LeaderboardFetch.Error;
      expectWithMessage(() => {
        expect(overLimitError.errorCode()).toEqual(
          MomentoErrorCode.INVALID_ARGUMENT_ERROR
        );
      }, `expected INVALID_ARGUMENT_ERROR but got ${overLimitError.errorCode()} ${overLimitError.message()}`);

      const okayRange = await leaderboardClient.leaderboardFetchByRank(
        integrationTestCacheName,
        leaderboardName,
        {startRank: 0, endRank: 8000}
      );
      expectWithMessage(() => {
        expect(okayRange).toBeInstanceOf(LeaderboardFetch.Found);
      }, `expected FOUND but got ${okayRange.toString()}`);
    });

    it('fetches elements given a variety of rank ranges', async () => {
      // upsert some values first
      const elements = new Map([
        [123n, 100],
        [456n, 200],
        [789n, 300],
      ]);
      const response = await leaderboardClient.leaderboardUpsert(
        integrationTestCacheName,
        leaderboardName,
        elements
      );
      expectWithMessage(() => {
        expect(response).toBeInstanceOf(LeaderboardUpsert.Success);
      }, `expected SUCCESS but got ${response.toString()}`);

      // fetch them in various ways
      const ascendingOrder = await leaderboardClient.leaderboardFetchByRank(
        integrationTestCacheName,
        leaderboardName,
        {order: LeaderboardOrder.Ascending}
      );
      expectWithMessage(() => {
        expect(ascendingOrder).toBeInstanceOf(LeaderboardFetch.Found);
      }, `expected FOUND but got ${ascendingOrder.toString()}`);
      const receivedAscending = (
        ascendingOrder as LeaderboardFetch.Found
      ).valueArray();
      const expectedAscending = [
        {
          id: 123n,
          score: 100,
          rank: 0n,
        },
        {
          id: 456n,
          score: 200,
          rank: 1n,
        },
        {
          id: 789n,
          score: 300,
          rank: 2n,
        },
      ];
      expect(receivedAscending).toEqual(expectedAscending);

      const descendingOrder = await leaderboardClient.leaderboardFetchByRank(
        integrationTestCacheName,
        leaderboardName,
        {order: LeaderboardOrder.Descending}
      );
      expectWithMessage(() => {
        expect(descendingOrder).toBeInstanceOf(LeaderboardFetch.Found);
      }, `expected FOUND but got ${descendingOrder.toString()}`);
      const receivedDescending = (
        descendingOrder as LeaderboardFetch.Found
      ).valueArray();
      const expectedDescending = [
        {
          id: 789n,
          score: 300,
          rank: 0n,
        },
        {
          id: 456n,
          score: 200,
          rank: 1n,
        },
        {
          id: 123n,
          score: 100,
          rank: 2n,
        },
      ];
      expect(receivedDescending).toEqual(expectedDescending);

      const topTwo = await leaderboardClient.leaderboardFetchByRank(
        integrationTestCacheName,
        leaderboardName,
        {
          startRank: 0,
          endRank: 2,
          order: LeaderboardOrder.Ascending,
        }
      );
      expectWithMessage(() => {
        expect(topTwo).toBeInstanceOf(LeaderboardFetch.Found);
      }, `expected FOUND but got ${topTwo.toString()}`);
      const receivedTopTwo = (topTwo as LeaderboardFetch.Found).valueArray();
      const expectedTopTwo = [
        {
          id: 123n,
          score: 100,
          rank: 0n,
        },
        {
          id: 456n,
          score: 200,
          rank: 1n,
        },
      ];
      expect(receivedTopTwo).toEqual(expectedTopTwo);
    });
  });

  // describe('#Get element rank', () => {
  //   it('', async () => {});
  // });

  // describe('#Get leaderboard length', () => {
  //   it('', async () => {});
  // });

  // describe('#Remove elements', () => {
  //   it('', async () => {});
  // });

  // describe('#Delete leaderboard', () => {
  //   it('', async () => {});
  // });
}
