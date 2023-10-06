import {
  ILeaderboardClient,
  LeaderboardDelete,
  LeaderboardFetch,
  LeaderboardOrder,
  LeaderboardRemoveElements,
  LeaderboardUpsert,
  MomentoErrorCode,
  LeaderboardLength,
  InvalidArgumentError,
} from '@gomomento/sdk-core';
import {expectWithMessage} from './common-int-test-utils';
import {v4} from 'uuid';

export function runLeaderboardClientTests(
  leaderboardClient: ILeaderboardClient,
  integrationTestCacheName: string
) {
  describe('#Creates leaderboard client', () => {
    const leaderboardName = `leaderboard-${v4()}`;

    it('validates the cache name', () => {
      expect(() =>
        leaderboardClient.createLeaderboard('   ', leaderboardName)
      ).toThrowError(InvalidArgumentError);
    });

    it('validates the leaderboard name', () => {
      expect(() =>
        leaderboardClient.createLeaderboard(integrationTestCacheName, '   ')
      ).toThrowError(InvalidArgumentError);
    });

    it('creates a new leaderboard', () => {
      expect(() =>
        leaderboardClient.createLeaderboard(
          integrationTestCacheName,
          leaderboardName
        )
      ).not.toThrow();
    });
  });

  describe('#Upsert elements', () => {
    const leaderboardName = `leaderboard-${v4()}`;
    const leaderboard = leaderboardClient.createLeaderboard(
      integrationTestCacheName,
      leaderboardName
    );

    it('validates the number of elements', async () => {
      const elements = new Map<number, number>();
      const response = await leaderboard.leaderboardUpsert(elements);
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

    it('creates new leaderboard and inserts elements', async () => {
      // Insert the first three elements
      const elements1 = new Map([
        [123, 100.0],
        [456, 200.0],
        [789, 300.0],
      ]);
      const response1 = await leaderboard.leaderboardUpsert(elements1);
      expectWithMessage(() => {
        expect(response1).toBeInstanceOf(LeaderboardUpsert.Success);
      }, `expected SUCCESS but got ${response1.toString()}`);

      const fetchResponse1 = await leaderboard.leaderboardFetchByRank();
      expectWithMessage(() => {
        expect(fetchResponse1).toBeInstanceOf(LeaderboardFetch.Found);
      }, `expected HIT but got ${fetchResponse1.toString()}`);
      const receivedElements1 = (
        fetchResponse1 as LeaderboardFetch.Found
      ).values();
      const expectedElements1 = [
        {
          id: 123,
          score: 100,
          rank: 0,
        },
        {
          id: 456,
          score: 200,
          rank: 1,
        },
        {
          id: 789,
          score: 300,
          rank: 2,
        },
      ];
      expect(receivedElements1).toEqual(expectedElements1);

      // Inserts two more elements into the existing leaderboard
      const elements2 = new Map([
        [1234, 800],
        [5678, 900],
      ]);
      const response2 = await leaderboard.leaderboardUpsert(elements2);
      expectWithMessage(() => {
        expect(response2).toBeInstanceOf(LeaderboardUpsert.Success);
      }, `expected SUCCESS but got ${response2.toString()}`);

      const fetchResponse2 = await leaderboard.leaderboardFetchByRank();
      expectWithMessage(() => {
        expect(fetchResponse2).toBeInstanceOf(LeaderboardFetch.Found);
      }, `expected HIT but got ${fetchResponse2.toString()}`);
      const receivedElements2 = (
        fetchResponse2 as LeaderboardFetch.Found
      ).values();
      const expectedElements2 = [
        {
          id: 123,
          score: 100,
          rank: 0,
        },
        {
          id: 456,
          score: 200,
          rank: 1,
        },
        {
          id: 789,
          score: 300,
          rank: 2,
        },
        {
          id: 1234,
          score: 800,
          rank: 3,
        },
        {
          id: 5678,
          score: 900,
          rank: 4,
        },
      ];
      expect(receivedElements2).toEqual(expectedElements2);

      // Updates elements that already exist in the leaderboard
      const elements3 = new Map([
        [123, 500],
        [456, 600],
        [789, 700],
      ]);
      const response3 = await leaderboard.leaderboardUpsert(elements3);
      expectWithMessage(() => {
        expect(response3).toBeInstanceOf(LeaderboardUpsert.Success);
      }, `expected SUCCESS but got ${response3.toString()}`);
      const fetchResponse3 = await leaderboard.leaderboardFetchByRank();
      expectWithMessage(() => {
        expect(fetchResponse3).toBeInstanceOf(LeaderboardFetch.Found);
      }, `expected HIT but got ${fetchResponse3.toString()}`);
      const receivedElements3 = (
        fetchResponse3 as LeaderboardFetch.Found
      ).values();
      const expectedElements3 = [
        {
          id: 123,
          score: 500,
          rank: 0,
        },
        {
          id: 456,
          score: 600,
          rank: 1,
        },
        {
          id: 789,
          score: 700,
          rank: 2,
        },
        {
          id: 1234,
          score: 800,
          rank: 3,
        },
        {
          id: 5678,
          score: 900,
          rank: 4,
        },
      ];
      expect(receivedElements3).toEqual(expectedElements3);
    });
  });

  describe('#Fetch by score', () => {
    const leaderboardName = `leaderboard-${v4()}`;
    const leaderboard = leaderboardClient.createLeaderboard(
      integrationTestCacheName,
      leaderboardName
    );

    it('validates the offset', async () => {
      const negativeOffset = await leaderboard.leaderboardFetchByScore({
        offset: -10,
      });
      expectWithMessage(() => {
        expect(negativeOffset).toBeInstanceOf(LeaderboardFetch.Error);
      }, `expected ERROR but got ${negativeOffset.toString()}`);
      const negativeOffsetError = negativeOffset as LeaderboardFetch.Error;
      expectWithMessage(() => {
        expect(negativeOffsetError.errorCode()).toEqual(
          MomentoErrorCode.INVALID_ARGUMENT_ERROR
        );
      }, `expected INVALID_ARGUMENT_ERROR but got ${negativeOffsetError.errorCode()} ${negativeOffsetError.message()}`);

      // Request should go through but finds no elements
      const positiveOffset = await leaderboard.leaderboardFetchByScore({
        offset: 10,
      });
      expectWithMessage(() => {
        expect(positiveOffset).toBeInstanceOf(LeaderboardFetch.NotFound);
      }, `expected NotFound but got ${positiveOffset.toString()}`);
    });

    it('validates the count', async () => {
      const negativeCount = await leaderboard.leaderboardFetchByScore({
        count: -10,
      });
      expectWithMessage(() => {
        expect(negativeCount).toBeInstanceOf(LeaderboardFetch.Error);
      }, `expected ERROR but got ${negativeCount.toString()}`);
      const negativeCountError = negativeCount as LeaderboardFetch.Error;
      expectWithMessage(() => {
        expect(negativeCountError.errorCode()).toEqual(
          MomentoErrorCode.INVALID_ARGUMENT_ERROR
        );
      }, `expected INVALID_ARGUMENT_ERROR but got ${negativeCountError.errorCode()} ${negativeCountError.message()}`);

      // Request should go through but finds no elements
      const positiveCount = await leaderboard.leaderboardFetchByScore({
        count: 10,
      });
      expectWithMessage(() => {
        expect(positiveCount).toBeInstanceOf(LeaderboardFetch.NotFound);
      }, `expected NotFound but got ${positiveCount.toString()}`);
    });

    it('validates the score range', async () => {
      // min should not be greater than max
      const badRange = await leaderboard.leaderboardFetchByScore({
        minScore: 100,
        maxScore: 50,
      });
      expectWithMessage(() => {
        expect(badRange).toBeInstanceOf(LeaderboardFetch.Error);
      }, `expected ERROR but got ${badRange.toString()}`);
      const badRangeError = badRange as LeaderboardFetch.Error;
      expectWithMessage(() => {
        expect(badRangeError.errorCode()).toEqual(
          MomentoErrorCode.INVALID_ARGUMENT_ERROR
        );
      }, `expected INVALID_ARGUMENT_ERROR but got ${badRangeError.errorCode()} ${badRangeError.message()}`);

      // undefined min and max are acceptable, request should go through but finds no elements
      const undefinedRange = await leaderboard.leaderboardFetchByScore();
      expectWithMessage(() => {
        expect(undefinedRange).toBeInstanceOf(LeaderboardFetch.NotFound);
      }, `expected NotFound but got ${undefinedRange.toString()}`);
    });

    it('returns NotFound when leaderboard is empty', async () => {
      const response = await leaderboard.leaderboardFetchByScore();
      expectWithMessage(() => {
        expect(response).toBeInstanceOf(LeaderboardFetch.NotFound);
      }, `expected NotFound but got ${response.toString()}`);
    });

    it('fetches elements given a variety of score ranges', async () => {
      // Insert some elements
      const elements = new Map([
        [123, 10.0],
        [234, 100.0],
        [345, 250.0],
        [456, 500.0],
        [567, 750.0],
        [678, 1000.0],
        [789, 1500.0],
        [890, 2000.0],
      ]);
      const response = await leaderboard.leaderboardUpsert(elements);
      expectWithMessage(() => {
        expect(response).toBeInstanceOf(LeaderboardUpsert.Success);
      }, `expected SUCCESS but got ${response.toString()}`);

      // Fetch using unbounded score range and specifc offset and count
      const fetchWithOffsetAndCount = await leaderboard.leaderboardFetchByScore(
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
      ).values();
      const expectedWithOffsetAndCount = [
        {
          id: 345,
          score: 250.0,
          rank: 2,
        },
        {
          id: 456,
          score: 500.0,
          rank: 3,
        },
      ];
      expect(receivedWithOffsetAndCount).toEqual(expectedWithOffsetAndCount);

      // Fetch using score range
      const fetchWithScoreRange = await leaderboard.leaderboardFetchByScore({
        minScore: 750, // inclusive
        maxScore: 1500, // exclusive
      });
      expectWithMessage(() => {
        expect(fetchWithScoreRange).toBeInstanceOf(LeaderboardFetch.Found);
      }, `expected HIT but got ${fetchWithScoreRange.toString()}`);
      const receivedWithScoreRange = (
        fetchWithScoreRange as LeaderboardFetch.Found
      ).values();
      const expectedWithScoreRange = [
        {
          id: 567,
          score: 750.0,
          rank: 4,
        },
        {
          id: 678,
          score: 1000.0,
          rank: 5,
        },
      ];
      expect(receivedWithScoreRange).toEqual(expectedWithScoreRange);

      // Fetch using all options
      const fetchWithAllOptions = await leaderboard.leaderboardFetchByScore({
        offset: 2,
        count: 10,
        minScore: 0,
        maxScore: 800,
        order: LeaderboardOrder.Descending,
      });
      expectWithMessage(() => {
        expect(fetchWithAllOptions).toBeInstanceOf(LeaderboardFetch.Found);
      }, `expected HIT but got ${fetchWithAllOptions.toString()}`);
      const receivedWithAllOptions = (
        fetchWithAllOptions as LeaderboardFetch.Found
      ).values();
      const expectedWithAllOptions = [
        {
          id: 345,
          score: 250,
          rank: 5,
        },
        {
          id: 234,
          score: 100.0,
          rank: 6,
        },
        {
          id: 123,
          score: 10.0,
          rank: 7,
        },
      ];
      expect(receivedWithAllOptions).toEqual(expectedWithAllOptions);
    });
  });

  describe('#Fetch by rank', () => {
    const leaderboardName = `leaderboard-${v4()}`;
    const leaderboard = leaderboardClient.createLeaderboard(
      integrationTestCacheName,
      leaderboardName
    );

    it('validates the rank range', async () => {
      const negativeStartRank = await leaderboard.leaderboardFetchByRank({
        startRank: -10,
      });
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

      const negativeEndRank = await leaderboard.leaderboardFetchByRank({
        endRank: -10,
      });
      expectWithMessage(() => {
        expect(negativeEndRank).toBeInstanceOf(LeaderboardFetch.Error);
      }, `expected ERROR but got ${negativeEndRank.toString()}`);
      const negativeEndRankError = negativeEndRank as LeaderboardFetch.Error;
      expectWithMessage(() => {
        expect(negativeEndRankError.errorCode()).toEqual(
          MomentoErrorCode.INVALID_ARGUMENT_ERROR
        );
      }, `expected INVALID_ARGUMENT_ERROR but got ${negativeEndRankError.errorCode()} ${negativeEndRankError.message()}`);

      const noRange = await leaderboard.leaderboardFetchByRank({
        startRank: 0,
        endRank: 0,
      });
      expectWithMessage(() => {
        expect(noRange).toBeInstanceOf(LeaderboardFetch.Error);
      }, `expected ERROR but got ${noRange.toString()}`);
      const noRangeError = noRange as LeaderboardFetch.Error;
      expectWithMessage(() => {
        expect(noRangeError.errorCode()).toEqual(
          MomentoErrorCode.INVALID_ARGUMENT_ERROR
        );
      }, `expected INVALID_ARGUMENT_ERROR but got ${noRangeError.errorCode()} ${noRangeError.message()}`);

      const reverseRange = await leaderboard.leaderboardFetchByRank({
        startRank: 10,
        endRank: 5,
      });
      expectWithMessage(() => {
        expect(reverseRange).toBeInstanceOf(LeaderboardFetch.Error);
      }, `expected ERROR but got ${reverseRange.toString()}`);
      const reverseRangeError = reverseRange as LeaderboardFetch.Error;
      expectWithMessage(() => {
        expect(reverseRangeError.errorCode()).toEqual(
          MomentoErrorCode.INVALID_ARGUMENT_ERROR
        );
      }, `expected INVALID_ARGUMENT_ERROR but got ${reverseRangeError.errorCode()} ${reverseRangeError.message()}`);

      const overLimit = await leaderboard.leaderboardFetchByRank({
        startRank: 0,
        endRank: 8193,
      });
      expectWithMessage(() => {
        expect(overLimit).toBeInstanceOf(LeaderboardFetch.Error);
      }, `expected ERROR but got ${overLimit.toString()}`);
      const overLimitError = overLimit as LeaderboardFetch.Error;
      expectWithMessage(() => {
        expect(overLimitError.errorCode()).toEqual(
          MomentoErrorCode.INVALID_ARGUMENT_ERROR
        );
      }, `expected INVALID_ARGUMENT_ERROR but got ${overLimitError.errorCode()} ${overLimitError.message()}`);

      // Request should go through but finds no elements
      const okayRange = await leaderboard.leaderboardFetchByRank({
        startRank: 0,
        endRank: 8000,
      });
      expectWithMessage(() => {
        expect(okayRange).toBeInstanceOf(LeaderboardFetch.NotFound);
      }, `expected NotFound but got ${okayRange.toString()}`);
    });

    it('returns NotFound when leaderboard is empty', async () => {
      const response = await leaderboard.leaderboardFetchByRank();
      expectWithMessage(() => {
        expect(response).toBeInstanceOf(LeaderboardFetch.NotFound);
      }, `expected NotFound but got ${response.toString()}`);
    });

    it('fetches elements given a variety of rank ranges', async () => {
      // upsert some values first
      const elements = new Map([
        [123, 100],
        [456, 200],
        [789, 300],
      ]);
      const response = await leaderboard.leaderboardUpsert(elements);
      expectWithMessage(() => {
        expect(response).toBeInstanceOf(LeaderboardUpsert.Success);
      }, `expected SUCCESS but got ${response.toString()}`);

      // fetch them in various ways
      const ascendingOrder = await leaderboard.leaderboardFetchByRank({
        order: LeaderboardOrder.Ascending,
      });
      expectWithMessage(() => {
        expect(ascendingOrder).toBeInstanceOf(LeaderboardFetch.Found);
      }, `expected FOUND but got ${ascendingOrder.toString()}`);
      const receivedAscending = (
        ascendingOrder as LeaderboardFetch.Found
      ).values();
      const expectedAscending = [
        {
          id: 123,
          score: 100,
          rank: 0,
        },
        {
          id: 456,
          score: 200,
          rank: 1,
        },
        {
          id: 789,
          score: 300,
          rank: 2,
        },
      ];
      expect(receivedAscending).toEqual(expectedAscending);

      const descendingOrder = await leaderboard.leaderboardFetchByRank({
        order: LeaderboardOrder.Descending,
      });
      expectWithMessage(() => {
        expect(descendingOrder).toBeInstanceOf(LeaderboardFetch.Found);
      }, `expected FOUND but got ${descendingOrder.toString()}`);
      const receivedDescending = (
        descendingOrder as LeaderboardFetch.Found
      ).values();
      const expectedDescending = [
        {
          id: 789,
          score: 300,
          rank: 0,
        },
        {
          id: 456,
          score: 200,
          rank: 1,
        },
        {
          id: 123,
          score: 100,
          rank: 2,
        },
      ];
      expect(receivedDescending).toEqual(expectedDescending);

      const topTwo = await leaderboard.leaderboardFetchByRank({
        startRank: 0,
        endRank: 2,
        order: LeaderboardOrder.Ascending,
      });
      expectWithMessage(() => {
        expect(topTwo).toBeInstanceOf(LeaderboardFetch.Found);
      }, `expected FOUND but got ${topTwo.toString()}`);
      const receivedTopTwo = (topTwo as LeaderboardFetch.Found).values();
      const expectedTopTwo = [
        {
          id: 123,
          score: 100,
          rank: 0,
        },
        {
          id: 456,
          score: 200,
          rank: 1,
        },
      ];
      expect(receivedTopTwo).toEqual(expectedTopTwo);
    });
  });

  describe('#Get element rank', () => {
    const leaderboardName = `leaderboard-${v4()}`;
    const leaderboard = leaderboardClient.createLeaderboard(
      integrationTestCacheName,
      leaderboardName
    );

    it('returns NotFound when leaderboard is empty', async () => {
      const response = await leaderboard.leaderboardGetRank([123]);
      expectWithMessage(() => {
        expect(response).toBeInstanceOf(LeaderboardFetch.NotFound);
      }, `expected NotFound but got ${response.toString()}`);
    });

    it('rank changes given ascending vs descending order', async () => {
      // Insert some elements
      const elements = new Map([
        [123, 100.0],
        [456, 200.0],
        [789, 300.0],
      ]);
      const upsertResponse = await leaderboard.leaderboardUpsert(elements);
      expectWithMessage(() => {
        expect(upsertResponse).toBeInstanceOf(LeaderboardUpsert.Success);
      }, `expected SUCCESS but got ${upsertResponse.toString()}`);

      // Get rank of an element when leaderboard is in ascending order
      const getRankAscending = await leaderboard.leaderboardGetRank(
        [123, 789],
        {order: LeaderboardOrder.Ascending}
      );
      expectWithMessage(() => {
        expect(getRankAscending).toBeInstanceOf(LeaderboardFetch.Found);
      }, `expected Found but got ${getRankAscending.toString()}`);
      const receivedAscending = (
        getRankAscending as LeaderboardFetch.Found
      ).values();
      const expectedAscending = [
        {
          id: 123,
          score: 100,
          rank: 0,
        },
        {
          id: 789,
          score: 300,
          rank: 2,
        },
      ];
      expect(receivedAscending).toEqual(expectedAscending);

      // Get rank of an element when leaderboard is in descending order
      const getRankDescending = await leaderboard.leaderboardGetRank(
        [123, 789],
        {order: LeaderboardOrder.Descending}
      );
      expectWithMessage(() => {
        expect(getRankDescending).toBeInstanceOf(LeaderboardFetch.Found);
      }, `expected Found but got ${getRankDescending.toString()}`);
      const receivedDescending = (
        getRankDescending as LeaderboardFetch.Found
      ).values();
      const expectedDescending = [
        {
          id: 123,
          score: 100,
          rank: 2,
        },
        {
          id: 789,
          score: 300,
          rank: 0,
        },
      ];
      expect(receivedDescending).toEqual(expectedDescending);
    });
  });

  describe('#Get leaderboard length', () => {
    const leaderboardName = `leaderboard-${v4()}`;
    const leaderboard = leaderboardClient.createLeaderboard(
      integrationTestCacheName,
      leaderboardName
    );

    it('returns length 0 when leaderboard does not contain elements', async () => {
      const response = await leaderboard.leaderboardLength();
      expectWithMessage(() => {
        expect(response).toBeInstanceOf(LeaderboardLength.Found);
      }, `expected Found but got ${response.toString()}`);
      const receivedLength = response as LeaderboardLength.Found;
      expect(receivedLength.length()).toEqual(0);
    });

    it('returns length when leaderboard contains elements', async () => {
      // Insert some elements
      const elements = new Map([
        [123, 100.0],
        [456, 200.0],
        [789, 300.0],
      ]);
      const upsertResponse = await leaderboard.leaderboardUpsert(elements);
      expectWithMessage(() => {
        expect(upsertResponse).toBeInstanceOf(LeaderboardUpsert.Success);
      }, `expected SUCCESS but got ${upsertResponse.toString()}`);

      // Length should match number of elements inserted
      const lengthResponse = await leaderboard.leaderboardLength();
      expectWithMessage(() => {
        expect(lengthResponse).toBeInstanceOf(LeaderboardLength.Found);
      }, `expected Found but got ${lengthResponse.toString()}`);
      const receivedLength = lengthResponse as LeaderboardLength.Found;
      expect(receivedLength.length()).toEqual(elements.size);
    });
  });

  describe('#Remove elements', () => {
    const leaderboardName = `leaderboard-${v4()}`;
    const leaderboard = leaderboardClient.createLeaderboard(
      integrationTestCacheName,
      leaderboardName
    );

    it('validates the number of elements', async () => {
      const response = await leaderboard.leaderboardRemoveElements([]);
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
        [123, 100.0],
        [456, 200.0],
        [789, 300.0],
      ]);
      const response = await leaderboard.leaderboardUpsert(elements);
      expectWithMessage(() => {
        expect(response).toBeInstanceOf(LeaderboardUpsert.Success);
      }, `expected SUCCESS but got ${response.toString()}`);

      // Remove some elements
      const removeResponse = await leaderboard.leaderboardRemoveElements([
        123, 789,
      ]);
      expectWithMessage(() => {
        expect(removeResponse).toBeInstanceOf(
          LeaderboardRemoveElements.Success
        );
      }, `expected SUCCESS but got ${removeResponse.toString()}`);

      // Check that the remaining elements are as expected
      const fetchResponse = await leaderboard.leaderboardFetchByRank();
      expectWithMessage(() => {
        expect(fetchResponse).toBeInstanceOf(LeaderboardFetch.Found);
      }, `expected Found but got ${fetchResponse.toString()}`);
      const receivedElements = (
        fetchResponse as LeaderboardFetch.Found
      ).values();
      const expectedElements = [
        {
          id: 456,
          score: 200.0,
          rank: 0,
        },
      ];
      expect(receivedElements).toEqual(expectedElements);
    });
  });

  describe('#Delete leaderboard', () => {
    const leaderboardName = `leaderboard-${v4()}`;
    const leaderboard = leaderboardClient.createLeaderboard(
      integrationTestCacheName,
      leaderboardName
    );

    it('successfully deletes a leaderboard', async () => {
      // Create a leaderboard by upserting some elements
      const elements = new Map([
        [123, 100.0],
        [456, 200.0],
        [789, 300.0],
      ]);
      const response = await leaderboard.leaderboardUpsert(elements);
      expectWithMessage(() => {
        expect(response).toBeInstanceOf(LeaderboardUpsert.Success);
      }, `expected SUCCESS but got ${response.toString()}`);

      // Verify the leaderboard exists
      const verifyExists = await leaderboard.leaderboardLength();
      expectWithMessage(() => {
        expect(verifyExists).toBeInstanceOf(LeaderboardLength.Found);
      }, `expected Found but got ${verifyExists.toString()}`);
      const receivedLength = verifyExists as LeaderboardLength.Found;
      expect(receivedLength.length()).toEqual(elements.size);

      // Delete the leaderboard
      const deleteResponse = await leaderboard.leaderboardDelete();
      expectWithMessage(() => {
        expect(deleteResponse).toBeInstanceOf(LeaderboardDelete.Success);
      }, `expected SUCCESS but got ${deleteResponse.toString()}`);

      // Verify it no longer exists
      const deleted = await leaderboard.leaderboardLength();
      expectWithMessage(() => {
        expect(deleted).toBeInstanceOf(LeaderboardLength.Found);
      }, `expected Found but got ${deleted.toString()}`);
      const deletedLength = deleted as LeaderboardLength.Found;
      expect(deletedLength.length()).toEqual(0);
    });
  });
}
