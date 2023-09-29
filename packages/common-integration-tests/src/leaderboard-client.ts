import {
  ILeaderboardClient,
  LeaderboardDelete,
  LeaderboardFetch,
  LeaderboardOrder,
  LeaderboardRemoveElements,
  LeaderboardUpsert,
  MomentoErrorCode,
  LeaderboardLength,
  LeaderboardGetRank,
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
      const responseError = response as LeaderboardUpsert.Error;
      expectWithMessage(() => {
        expect(responseError.errorCode()).toEqual(
          MomentoErrorCode.INVALID_ARGUMENT_ERROR
        );
      }, `expected INVALID_ARGUMENT_ERROR but got ${responseError.errorCode()} ${responseError.message()}`);
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
      const responseError = response as LeaderboardUpsert.Error;
      expectWithMessage(() => {
        expect(responseError.errorCode()).toEqual(
          MomentoErrorCode.INVALID_ARGUMENT_ERROR
        );
      }, `expected INVALID_ARGUMENT_ERROR but got ${responseError.errorCode()} ${responseError.message()}`);
    });

    it('validates the number of elements', async () => {
      const elements = new Map<bigint, number>();
      const response = await leaderboardClient.leaderboardUpsert(
        integrationTestCacheName,
        leaderboardName,
        elements
      );
      expectWithMessage(() => {
        expect(response).toBeInstanceOf(LeaderboardUpsert.Error);
      }, `expected ERROR but got ${response.toString()}`);
      const responseError = response as LeaderboardUpsert.Error;
      expectWithMessage(() => {
        expect(responseError.errorCode()).toEqual(
          MomentoErrorCode.INVALID_ARGUMENT_ERROR
        );
      }, `expected INVALID_ARGUMENT_ERROR but got ${responseError.errorCode()} ${responseError.message()}`);
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

  describe('#Fetch by score', () => {
    const leaderboardName = `leaderboard-${v4()}`;

    it('validates the cache name', async () => {
      const response = await leaderboardClient.leaderboardFetchByScore(
        '   ',
        leaderboardName
      );
      expectWithMessage(() => {
        expect(response).toBeInstanceOf(LeaderboardFetch.Error);
      }, `expected ERROR but got ${response.toString()}`);
      const responseError = response as LeaderboardFetch.Error;
      expectWithMessage(() => {
        expect(responseError.errorCode()).toEqual(
          MomentoErrorCode.INVALID_ARGUMENT_ERROR
        );
      }, `expected INVALID_ARGUMENT_ERROR but got ${responseError.errorCode()} ${responseError.message()}`);
    });

    it('validates the leaderboard name', async () => {
      const response = await leaderboardClient.leaderboardFetchByScore(
        integrationTestCacheName,
        '   '
      );
      expectWithMessage(() => {
        expect(response).toBeInstanceOf(LeaderboardFetch.Error);
      }, `expected ERROR but got ${response.toString()}`);
      const responseError = response as LeaderboardFetch.Error;
      expectWithMessage(() => {
        expect(responseError.errorCode()).toEqual(
          MomentoErrorCode.INVALID_ARGUMENT_ERROR
        );
      }, `expected INVALID_ARGUMENT_ERROR but got ${responseError.errorCode()} ${responseError.message()}`);
    });

    it('validates the offset', async () => {
      const negativeOffset = await leaderboardClient.leaderboardFetchByScore(
        integrationTestCacheName,
        leaderboardName,
        {offset: -10n}
      );
      expectWithMessage(() => {
        expect(negativeOffset).toBeInstanceOf(LeaderboardFetch.Error);
      }, `expected ERROR but got ${negativeOffset.toString()}`);
      const negativeOffsetError = negativeOffset as LeaderboardFetch.Error;
      expectWithMessage(() => {
        expect(negativeOffsetError.errorCode()).toEqual(
          MomentoErrorCode.INVALID_ARGUMENT_ERROR
        );
      }, `expected INVALID_ARGUMENT_ERROR but got ${negativeOffsetError.errorCode()} ${negativeOffsetError.message()}`);

      const positiveOffset = await leaderboardClient.leaderboardFetchByScore(
        integrationTestCacheName,
        leaderboardName,
        {offset: 10}
      );
      expectWithMessage(() => {
        expect(positiveOffset).toBeInstanceOf(LeaderboardFetch.NotFound);
      }, `expected NotFound but got ${positiveOffset.toString()}`);
    });

    it('validates the count', async () => {
      const negativeCount = await leaderboardClient.leaderboardFetchByScore(
        integrationTestCacheName,
        leaderboardName,
        {count: -10}
      );
      expectWithMessage(() => {
        expect(negativeCount).toBeInstanceOf(LeaderboardFetch.Error);
      }, `expected ERROR but got ${negativeCount.toString()}`);
      const negativeCountError = negativeCount as LeaderboardFetch.Error;
      expectWithMessage(() => {
        expect(negativeCountError.errorCode()).toEqual(
          MomentoErrorCode.INVALID_ARGUMENT_ERROR
        );
      }, `expected INVALID_ARGUMENT_ERROR but got ${negativeCountError.errorCode()} ${negativeCountError.message()}`);

      const positiveCount = await leaderboardClient.leaderboardFetchByScore(
        integrationTestCacheName,
        leaderboardName,
        {count: 10}
      );
      expectWithMessage(() => {
        expect(positiveCount).toBeInstanceOf(LeaderboardFetch.NotFound);
      }, `expected NotFound but got ${positiveCount.toString()}`);
    });

    it('validates the score range', async () => {
      // min should not be greater than max
      const badRange = await leaderboardClient.leaderboardFetchByScore(
        integrationTestCacheName,
        leaderboardName,
        {
          minScore: 100,
          maxScore: 50,
        }
      );
      expectWithMessage(() => {
        expect(badRange).toBeInstanceOf(LeaderboardFetch.Error);
      }, `expected ERROR but got ${badRange.toString()}`);
      const badRangeError = badRange as LeaderboardFetch.Error;
      expectWithMessage(() => {
        expect(badRangeError.errorCode()).toEqual(
          MomentoErrorCode.INVALID_ARGUMENT_ERROR
        );
      }, `expected INVALID_ARGUMENT_ERROR but got ${badRangeError.errorCode()} ${badRangeError.message()}`);

      // undefined min and max are acceptable
      const undefinedRange = await leaderboardClient.leaderboardFetchByScore(
        integrationTestCacheName,
        leaderboardName
      );
      expectWithMessage(() => {
        expect(undefinedRange).toBeInstanceOf(LeaderboardFetch.NotFound);
      }, `expected NotFound but got ${undefinedRange.toString()}`);
    });

    it('fetches elements given a variety of score ranges', async () => {
      // Insert some elements
      const elements = new Map([
        [123n, 10.0],
        [234n, 100.0],
        [345n, 250.0],
        [456n, 500.0],
        [567n, 750.0],
        [678n, 1000.0],
        [789n, 1500.0],
        [890n, 2000.0],
      ]);
      const response = await leaderboardClient.leaderboardUpsert(
        integrationTestCacheName,
        leaderboardName,
        elements
      );
      expectWithMessage(() => {
        expect(response).toBeInstanceOf(LeaderboardUpsert.Success);
      }, `expected SUCCESS but got ${response.toString()}`);

      // Fetch using offset and count
      const fetchWithOffsetAndCount =
        await leaderboardClient.leaderboardFetchByScore(
          integrationTestCacheName,
          leaderboardName,
          {
            offset: 2,
            count: 2,
          }
        );
      expectWithMessage(() => {
        expect(fetchWithOffsetAndCount).toBeInstanceOf(LeaderboardFetch.Found);
      }, `expected HIT but got ${fetchWithOffsetAndCount.toString()}`);
      const receivedWithOffsetAndCount = (
        fetchWithOffsetAndCount as LeaderboardFetch.Found
      ).valueArray();
      const expectedWithOffsetAndCount = [
        {
          id: 345n,
          score: 250.0,
          rank: 2n,
        },
        {
          id: 456n,
          score: 500.0,
          rank: 3n,
        },
      ];
      expect(receivedWithOffsetAndCount).toEqual(expectedWithOffsetAndCount);

      // Fetch using score range
      const fetchWithScoreRange =
        await leaderboardClient.leaderboardFetchByScore(
          integrationTestCacheName,
          leaderboardName,
          {
            minScore: 750, // inclusive
            maxScore: 1500, // exclusive
          }
        );
      expectWithMessage(() => {
        expect(fetchWithScoreRange).toBeInstanceOf(LeaderboardFetch.Found);
      }, `expected HIT but got ${fetchWithScoreRange.toString()}`);
      const receivedWithScoreRange = (
        fetchWithScoreRange as LeaderboardFetch.Found
      ).valueArray();
      const expectedWithScoreRange = [
        {
          id: 567n,
          score: 750.0,
          rank: 4n,
        },
        {
          id: 678n,
          score: 1000.0,
          rank: 5n,
        },
      ];
      expect(receivedWithScoreRange).toEqual(expectedWithScoreRange);

      // Fetch using all options
      const fetchWithAllOptions =
        await leaderboardClient.leaderboardFetchByScore(
          integrationTestCacheName,
          leaderboardName,
          {
            offset: 2,
            count: 10,
            minScore: 0,
            maxScore: 800,
            order: LeaderboardOrder.Descending,
          }
        );
      expectWithMessage(() => {
        expect(fetchWithAllOptions).toBeInstanceOf(LeaderboardFetch.Found);
      }, `expected HIT but got ${fetchWithAllOptions.toString()}`);
      const receivedWithAllOptions = (
        fetchWithAllOptions as LeaderboardFetch.Found
      ).valueArray();
      // [123n, 10.0], rank 7,
      // [234n, 100.0], rank 6
      // [345n, 250.0], rank 5, offset 2
      // [456n, 500.0], rank 4, offset 1
      // [567n, 750.0], rank 3, offset 0
      // is the expected correct?
      const expectedWithAllOptions = [
        {
          id: 123n,
          score: 10.0,
          rank: 7n,
        },
        {
          id: 234n,
          score: 100.0,
          rank: 6n,
        },
        {
          id: 345n,
          score: 250,
          rank: 5n,
        },
      ];
      expect(receivedWithAllOptions).toEqual(expectedWithAllOptions);
    });
  });

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
      const responseError = response as LeaderboardFetch.Error;
      expectWithMessage(() => {
        expect(responseError.errorCode()).toEqual(
          MomentoErrorCode.INVALID_ARGUMENT_ERROR
        );
      }, `expected INVALID_ARGUMENT_ERROR but got ${responseError.errorCode()} ${responseError.message()}`);
    });

    it('validates the leaderboard name', async () => {
      const response = await leaderboardClient.leaderboardFetchByRank(
        integrationTestCacheName,
        '   '
      );
      expectWithMessage(() => {
        expect(response).toBeInstanceOf(LeaderboardFetch.Error);
      }, `expected ERROR but got ${response.toString()}`);
      const responseError = response as LeaderboardFetch.Error;
      expectWithMessage(() => {
        expect(responseError.errorCode()).toEqual(
          MomentoErrorCode.INVALID_ARGUMENT_ERROR
        );
      }, `expected INVALID_ARGUMENT_ERROR but got ${responseError.errorCode()} ${responseError.message()}`);
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

  describe('#Get element rank', () => {
    const leaderboardName = `leaderboard-${v4()}`;

    it('validates the cache name', async () => {
      const response = await leaderboardClient.leaderboardGetRank(
        '   ',
        leaderboardName,
        123n
      );
      expectWithMessage(() => {
        expect(response).toBeInstanceOf(LeaderboardGetRank.Error);
      }, `expected ERROR but got ${response.toString()}`);
      const responseError = response as LeaderboardGetRank.Error;
      expectWithMessage(() => {
        expect(responseError.errorCode()).toEqual(
          MomentoErrorCode.INVALID_ARGUMENT_ERROR
        );
      }, `expected INVALID_ARGUMENT_ERROR but got ${responseError.errorCode()} ${responseError.message()}`);
    });

    it('validates the leaderboard name', async () => {
      const response = await leaderboardClient.leaderboardGetRank(
        integrationTestCacheName,
        '   ',
        123n
      );
      expectWithMessage(() => {
        expect(response).toBeInstanceOf(LeaderboardGetRank.Error);
      }, `expected ERROR but got ${response.toString()}`);
      const responseError = response as LeaderboardGetRank.Error;
      expectWithMessage(() => {
        expect(responseError.errorCode()).toEqual(
          MomentoErrorCode.INVALID_ARGUMENT_ERROR
        );
      }, `expected INVALID_ARGUMENT_ERROR but got ${responseError.errorCode()} ${responseError.message()}`);
    });

    it('returns NotFound when leaderboard does not exist', async () => {
      const response = await leaderboardClient.leaderboardGetRank(
        integrationTestCacheName,
        leaderboardName,
        123n
      );
      expectWithMessage(() => {
        expect(response).toBeInstanceOf(LeaderboardGetRank.NotFound);
      }, `expected NotFound but got ${response.toString()}`);
    });

    it('rank changes given ascending vs descending order', async () => {
      // Insert some elements
      const elements = new Map([
        [123n, 100.0],
        [456n, 200.0],
        [789n, 300.0],
      ]);
      const upsertResponse = await leaderboardClient.leaderboardUpsert(
        integrationTestCacheName,
        leaderboardName,
        elements
      );
      expectWithMessage(() => {
        expect(upsertResponse).toBeInstanceOf(LeaderboardUpsert.Success);
      }, `expected SUCCESS but got ${upsertResponse.toString()}`);

      // Get rank of an element when leaderboard is in ascending order
      const getRankAscending = await leaderboardClient.leaderboardGetRank(
        integrationTestCacheName,
        leaderboardName,
        123n,
        {order: LeaderboardOrder.Ascending}
      );
      expectWithMessage(() => {
        expect(getRankAscending).toBeInstanceOf(LeaderboardGetRank.Found);
      }, `expected Found but got ${getRankAscending.toString()}`);
      const receivedRankAsc = getRankAscending as LeaderboardGetRank.Found;
      expect(receivedRankAsc.rank()).toEqual(0n);

      // Get rank of an element when leaderboard is in descending order
      const getRankDescending = await leaderboardClient.leaderboardGetRank(
        integrationTestCacheName,
        leaderboardName,
        123n,
        {order: LeaderboardOrder.Descending}
      );
      expectWithMessage(() => {
        expect(getRankDescending).toBeInstanceOf(LeaderboardGetRank.Found);
      }, `expected Found but got ${getRankDescending.toString()}`);
      const receivedRankDesc = getRankDescending as LeaderboardGetRank.Found;
      expect(receivedRankDesc.rank()).toEqual(2n);
    });
  });

  describe('#Get leaderboard length', () => {
    const leaderboardName = `leaderboard-${v4()}`;

    it('validates the cache name', async () => {
      const response = await leaderboardClient.leaderboardLength(
        '   ',
        leaderboardName
      );
      expectWithMessage(() => {
        expect(response).toBeInstanceOf(LeaderboardLength.Error);
      }, `expected ERROR but got ${response.toString()}`);
      const responseError = response as LeaderboardLength.Error;
      expectWithMessage(() => {
        expect(responseError.errorCode()).toEqual(
          MomentoErrorCode.INVALID_ARGUMENT_ERROR
        );
      }, `expected INVALID_ARGUMENT_ERROR but got ${responseError.errorCode()} ${responseError.message()}`);
    });

    it('validates the leaderboard name', async () => {
      const response = await leaderboardClient.leaderboardLength(
        integrationTestCacheName,
        '   '
      );
      expectWithMessage(() => {
        expect(response).toBeInstanceOf(LeaderboardLength.Error);
      }, `expected ERROR but got ${response.toString()}`);
      const responseError = response as LeaderboardLength.Error;
      expectWithMessage(() => {
        expect(responseError.errorCode()).toEqual(
          MomentoErrorCode.INVALID_ARGUMENT_ERROR
        );
      }, `expected INVALID_ARGUMENT_ERROR but got ${responseError.errorCode()} ${responseError.message()}`);
    });

    it('returns NotFound when leaderboard does not exist', async () => {
      const response = await leaderboardClient.leaderboardLength(
        integrationTestCacheName,
        leaderboardName
      );
      expectWithMessage(() => {
        expect(response).toBeInstanceOf(LeaderboardLength.NotFound);
      }, `expected NotFound but got ${response.toString()}`);
    });

    it('returns Found when leaderboard does exist', async () => {
      // Insert some elements
      const elements = new Map([
        [123n, 100.0],
        [456n, 200.0],
        [789n, 300.0],
      ]);
      const upsertResponse = await leaderboardClient.leaderboardUpsert(
        integrationTestCacheName,
        leaderboardName,
        elements
      );
      expectWithMessage(() => {
        expect(upsertResponse).toBeInstanceOf(LeaderboardUpsert.Success);
      }, `expected SUCCESS but got ${upsertResponse.toString()}`);

      // Length should match number of elements inserted
      const lengthResponse = await leaderboardClient.leaderboardLength(
        integrationTestCacheName,
        leaderboardName
      );
      expectWithMessage(() => {
        expect(lengthResponse).toBeInstanceOf(LeaderboardLength.Found);
      }, `expected Found but got ${lengthResponse.toString()}`);
      const receivedLength = lengthResponse as LeaderboardLength.Found;
      expect(receivedLength.length()).toEqual(BigInt(elements.size));
    });
  });

  describe('#Remove elements', () => {
    const leaderboardName = `leaderboard-${v4()}`;

    it('validates the cache name', async () => {
      const response = await leaderboardClient.leaderboardRemoveElements(
        '   ',
        leaderboardName,
        [123n, 456n, 789n]
      );
      expectWithMessage(() => {
        expect(response).toBeInstanceOf(LeaderboardRemoveElements.Error);
      }, `expected ERROR but got ${response.toString()}`);
      const responseError = response as LeaderboardRemoveElements.Error;
      expectWithMessage(() => {
        expect(responseError.errorCode()).toEqual(
          MomentoErrorCode.INVALID_ARGUMENT_ERROR
        );
      }, `expected INVALID_ARGUMENT_ERROR but got ${responseError.errorCode()} ${responseError.message()}`);
    });

    it('validates the leaderboard name', async () => {
      const response = await leaderboardClient.leaderboardRemoveElements(
        integrationTestCacheName,
        '   ',
        [123n, 456n, 789n]
      );
      expectWithMessage(() => {
        expect(response).toBeInstanceOf(LeaderboardRemoveElements.Error);
      }, `expected ERROR but got ${response.toString()}`);
      const responseError = response as LeaderboardRemoveElements.Error;
      expectWithMessage(() => {
        expect(responseError.errorCode()).toEqual(
          MomentoErrorCode.INVALID_ARGUMENT_ERROR
        );
      }, `expected INVALID_ARGUMENT_ERROR but got ${responseError.errorCode()} ${responseError.message()}`);
    });

    it('validates the number of elements', async () => {
      const response = await leaderboardClient.leaderboardRemoveElements(
        integrationTestCacheName,
        leaderboardName,
        []
      );
      expectWithMessage(() => {
        expect(response).toBeInstanceOf(LeaderboardRemoveElements.Error);
      }, `expected ERROR but got ${response.toString()}`);
      const responseError = response as LeaderboardRemoveElements.Error;
      expectWithMessage(() => {
        expect(responseError.errorCode()).toEqual(
          MomentoErrorCode.INVALID_ARGUMENT_ERROR
        );
      }, `expected INVALID_ARGUMENT_ERROR but got ${responseError.errorCode()} ${responseError.message()}`);
    });

    it('successfully removes elements', async () => {
      // Insert some elements first
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

      // Remove some elements
      const removeResponse = await leaderboardClient.leaderboardRemoveElements(
        integrationTestCacheName,
        leaderboardName,
        [123n, 789n]
      );
      expectWithMessage(() => {
        expect(removeResponse).toBeInstanceOf(
          LeaderboardRemoveElements.Success
        );
      }, `expected SUCCESS but got ${removeResponse.toString()}`);

      // Check that the remaining elements are as expected
      const fetchResponse = await leaderboardClient.leaderboardFetchByScore(
        integrationTestCacheName,
        leaderboardName
      );
      expectWithMessage(() => {
        expect(fetchResponse).toBeInstanceOf(LeaderboardFetch.Found);
      }, `expected Found but got ${fetchResponse.toString()}`);
      const receivedElements = (
        fetchResponse as LeaderboardFetch.Found
      ).valueArray();
      const expectedElements = [
        {
          id: 123n,
          score: 100,
          rank: 0n,
        },
      ];
      expect(receivedElements).toEqual(expectedElements);
    });
  });

  describe('#Delete leaderboard', () => {
    const leaderboardName = `leaderboard-${v4()}`;

    it('validates the cache name', async () => {
      const response = await leaderboardClient.leaderboardDelete(
        '   ',
        leaderboardName
      );
      expectWithMessage(() => {
        expect(response).toBeInstanceOf(LeaderboardDelete.Error);
      }, `expected ERROR but got ${response.toString()}`);
      const responseError = response as LeaderboardDelete.Error;
      expectWithMessage(() => {
        expect(responseError.errorCode()).toEqual(
          MomentoErrorCode.INVALID_ARGUMENT_ERROR
        );
      }, `expected INVALID_ARGUMENT_ERROR but got ${responseError.errorCode()} ${responseError.message()}`);
    });

    it('validates the leaderboard name', async () => {
      const response = await leaderboardClient.leaderboardDelete(
        integrationTestCacheName,
        '   '
      );
      expectWithMessage(() => {
        expect(response).toBeInstanceOf(LeaderboardDelete.Error);
      }, `expected ERROR but got ${response.toString()}`);
      const responseError = response as LeaderboardDelete.Error;
      expectWithMessage(() => {
        expect(responseError.errorCode()).toEqual(
          MomentoErrorCode.INVALID_ARGUMENT_ERROR
        );
      }, `expected INVALID_ARGUMENT_ERROR but got ${responseError.errorCode()} ${responseError.message()}`);
    });

    it('successfully deletes a leaderboard', async () => {
      // Create a leaderboard by upserting some elements
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

      // Verify the leaderboard exists
      const verifyExists = await leaderboardClient.leaderboardLength(
        integrationTestCacheName,
        leaderboardName
      );
      expectWithMessage(() => {
        expect(verifyExists).toBeInstanceOf(LeaderboardLength.Found);
      }, `expected Found but got ${verifyExists.toString()}`);
      const receivedLength = verifyExists as LeaderboardLength.Found;
      expect(receivedLength.length()).toEqual(BigInt(elements.size));

      // Delete the leaderboard
      const deleteResponse = await leaderboardClient.leaderboardDelete(
        integrationTestCacheName,
        '   '
      );
      expectWithMessage(() => {
        expect(deleteResponse).toBeInstanceOf(LeaderboardDelete.Success);
      }, `expected SUCCESS but got ${deleteResponse.toString()}`);

      // Verify it no longer exists
      const notExists = await leaderboardClient.leaderboardLength(
        integrationTestCacheName,
        leaderboardName
      );
      expectWithMessage(() => {
        expect(notExists).toBeInstanceOf(LeaderboardLength.NotFound);
      }, `expected NotFound but got ${notExists.toString()}`);
    });
  });
}
