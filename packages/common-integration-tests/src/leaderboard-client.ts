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
    const leaderboardName = `test-leaderboard-${v4()}`;

    it('validates the cache name', () => {
      expect(() =>
        leaderboardClient.leaderboard('   ', leaderboardName)
      ).toThrowError(InvalidArgumentError);
    });

    it('validates the leaderboard name', () => {
      expect(() =>
        leaderboardClient.leaderboard(integrationTestCacheName, '   ')
      ).toThrowError(InvalidArgumentError);
    });

    it('creates a new leaderboard', () => {
      expect(() =>
        leaderboardClient.leaderboard(integrationTestCacheName, leaderboardName)
      ).not.toThrow();
    });
  });

  describe('#Upsert elements', () => {
    const leaderboardName = `test-leaderboard-${v4()}`;
    const leaderboard = leaderboardClient.leaderboard(
      integrationTestCacheName,
      leaderboardName
    );

    it('validates the number of elements', async () => {
      const elements = new Map<number, number>();
      const response = await leaderboard.upsert(elements);
      expectWithMessage(() => {
        expect(response).toBeInstanceOf(LeaderboardUpsert.Error);
      }, `expected Error but got ${response.toString()}`);
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
      const response1 = await leaderboard.upsert(elements1);
      expectWithMessage(() => {
        expect(response1).toBeInstanceOf(LeaderboardUpsert.Success);
      }, `expected Success but got ${response1.toString()}`);

      const fetchResponse1 = await leaderboard.fetchByScore();
      expectWithMessage(() => {
        expect(fetchResponse1).toBeInstanceOf(LeaderboardFetch.Success);
      }, `expected HIT but got ${fetchResponse1.toString()}`);
      const receivedElements1 = (
        fetchResponse1 as LeaderboardFetch.Success
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
      const response2 = await leaderboard.upsert(elements2);
      expectWithMessage(() => {
        expect(response2).toBeInstanceOf(LeaderboardUpsert.Success);
      }, `expected Success but got ${response2.toString()}`);

      const fetchResponse2 = await leaderboard.fetchByScore();
      expectWithMessage(() => {
        expect(fetchResponse2).toBeInstanceOf(LeaderboardFetch.Success);
      }, `expected HIT but got ${fetchResponse2.toString()}`);
      const receivedElements2 = (
        fetchResponse2 as LeaderboardFetch.Success
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
      const response3 = await leaderboard.upsert(elements3);
      expectWithMessage(() => {
        expect(response3).toBeInstanceOf(LeaderboardUpsert.Success);
      }, `expected Success but got ${response3.toString()}`);
      const fetchResponse3 = await leaderboard.fetchByScore();
      expectWithMessage(() => {
        expect(fetchResponse3).toBeInstanceOf(LeaderboardFetch.Success);
      }, `expected HIT but got ${fetchResponse3.toString()}`);
      const receivedElements3 = (
        fetchResponse3 as LeaderboardFetch.Success
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

      // Inserts elements using Record type as well
      const elements4 = {
        4321: 1000,
        9876: 2000,
      };
      const response4 = await leaderboard.upsert(elements4);
      expectWithMessage(() => {
        expect(response4).toBeInstanceOf(LeaderboardUpsert.Success);
      }, `expected Success but got ${response4.toString()}`);

      const fetchResponse4 = await leaderboard.fetchByScore();
      expectWithMessage(() => {
        expect(fetchResponse4).toBeInstanceOf(LeaderboardFetch.Success);
      }, `expected HIT but got ${fetchResponse4.toString()}`);
      const receivedElements4 = (
        fetchResponse4 as LeaderboardFetch.Success
      ).values();
      const expectedElements4 = [
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
        {
          id: 4321,
          score: 1000,
          rank: 5,
        },
        {
          id: 9876,
          score: 2000,
          rank: 6,
        },
      ];
      expect(receivedElements4).toEqual(expectedElements4);
    });

    it('deletes the leaderboard when done testing', async () => {
      const response = await leaderboard.delete();
      expectWithMessage(() => {
        expect(response).toBeInstanceOf(LeaderboardDelete.Success);
      }, `expected Success but got ${response.toString()}`);
    });
  });

  describe('#Fetch by score', () => {
    const leaderboardName = `test-leaderboard-${v4()}`;
    const leaderboard = leaderboardClient.leaderboard(
      integrationTestCacheName,
      leaderboardName
    );

    it('validates the offset', async () => {
      const negativeOffset = await leaderboard.fetchByScore({
        offset: -10,
      });
      expectWithMessage(() => {
        expect(negativeOffset).toBeInstanceOf(LeaderboardFetch.Error);
      }, `expected Error but got ${negativeOffset.toString()}`);
      const negativeOffsetError = negativeOffset as LeaderboardFetch.Error;
      expectWithMessage(() => {
        expect(negativeOffsetError.errorCode()).toEqual(
          MomentoErrorCode.INVALID_ARGUMENT_ERROR
        );
      }, `expected INVALID_ARGUMENT_ERROR but got ${negativeOffsetError.errorCode()} ${negativeOffsetError.message()}`);

      // Request should go through but finds no elements
      const positiveOffset = await leaderboard.fetchByScore({
        offset: 10,
      });
      expectWithMessage(() => {
        expect(positiveOffset).toBeInstanceOf(LeaderboardFetch.Success);
      }, `expected Success but got ${positiveOffset.toString()}`);
      const positiveOffsetElements = (
        positiveOffset as LeaderboardFetch.Success
      ).values();
      expectWithMessage(() => {
        expect(positiveOffsetElements).toBeArrayOfSize(0);
      }, `expected array of size 0 but got ${positiveOffsetElements.length}`);
    });

    it('validates the count', async () => {
      const negativeCount = await leaderboard.fetchByScore({
        count: -10,
      });
      expectWithMessage(() => {
        expect(negativeCount).toBeInstanceOf(LeaderboardFetch.Error);
      }, `expected Error but got ${negativeCount.toString()}`);
      const negativeCountError = negativeCount as LeaderboardFetch.Error;
      expectWithMessage(() => {
        expect(negativeCountError.errorCode()).toEqual(
          MomentoErrorCode.INVALID_ARGUMENT_ERROR
        );
      }, `expected INVALID_ARGUMENT_ERROR but got ${negativeCountError.errorCode()} ${negativeCountError.message()}`);

      // Request should go through but finds no elements
      const positiveCount = await leaderboard.fetchByScore({
        count: 10,
      });
      expectWithMessage(() => {
        expect(positiveCount).toBeInstanceOf(LeaderboardFetch.Success);
      }, `expected Success but got ${positiveCount.toString()}`);
      const positiveCountElements = (
        positiveCount as LeaderboardFetch.Success
      ).values();
      expectWithMessage(() => {
        expect(positiveCountElements).toBeArrayOfSize(0);
      }, `expected array of size 0 but got ${positiveCountElements.length}`);
    });

    it('validates the score range', async () => {
      // min should not be greater than max
      const badRange = await leaderboard.fetchByScore({
        minScore: 100,
        maxScore: 50,
      });
      expectWithMessage(() => {
        expect(badRange).toBeInstanceOf(LeaderboardFetch.Error);
      }, `expected Error but got ${badRange.toString()}`);
      const badRangeError = badRange as LeaderboardFetch.Error;
      expectWithMessage(() => {
        expect(badRangeError.errorCode()).toEqual(
          MomentoErrorCode.INVALID_ARGUMENT_ERROR
        );
      }, `expected INVALID_ARGUMENT_ERROR but got ${badRangeError.errorCode()} ${badRangeError.message()}`);

      // undefined min and max are acceptable, request should go through but finds no elements
      const undefinedRange = await leaderboard.fetchByScore();
      expectWithMessage(() => {
        expect(undefinedRange).toBeInstanceOf(LeaderboardFetch.Success);
      }, `expected Success but got ${undefinedRange.toString()}`);
      const undefinedRangeElements = (
        undefinedRange as LeaderboardFetch.Success
      ).values();
      expectWithMessage(() => {
        expect(undefinedRangeElements).toBeArrayOfSize(0);
      }, `expected array of size 0 but got ${undefinedRangeElements.length}`);
    });

    it('returns Success with no values when leaderboard does not exist', async () => {
      const response = await leaderboard.fetchByScore();
      expectWithMessage(() => {
        expect(response).toBeInstanceOf(LeaderboardFetch.Success);
      }, `expected Success but got ${response.toString()}`);
      const elements = (response as LeaderboardFetch.Success).values();
      expectWithMessage(() => {
        expect(elements).toBeArrayOfSize(0);
      }, `expected array of size 0 but got ${elements.length}`);
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
      const response = await leaderboard.upsert(elements);
      expectWithMessage(() => {
        expect(response).toBeInstanceOf(LeaderboardUpsert.Success);
      }, `expected Success but got ${response.toString()}`);

      // Fetch using unbounded score range and specifc offset and count
      const fetchWithOffsetAndCount = await leaderboard.fetchByScore({
        offset: 2,
        count: 2,
      });
      expectWithMessage(() => {
        expect(fetchWithOffsetAndCount).toBeInstanceOf(
          LeaderboardFetch.Success
        );
      }, `expected HIT but got ${fetchWithOffsetAndCount.toString()}`);
      const receivedWithOffsetAndCount = (
        fetchWithOffsetAndCount as LeaderboardFetch.Success
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
      const fetchWithScoreRange = await leaderboard.fetchByScore({
        minScore: 750, // inclusive
        maxScore: 1500, // exclusive
      });
      expectWithMessage(() => {
        expect(fetchWithScoreRange).toBeInstanceOf(LeaderboardFetch.Success);
      }, `expected HIT but got ${fetchWithScoreRange.toString()}`);
      const receivedWithScoreRange = (
        fetchWithScoreRange as LeaderboardFetch.Success
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
      const fetchWithAllOptions = await leaderboard.fetchByScore({
        offset: 2,
        count: 10,
        minScore: 0,
        maxScore: 800,
        order: LeaderboardOrder.Descending,
      });
      expectWithMessage(() => {
        expect(fetchWithAllOptions).toBeInstanceOf(LeaderboardFetch.Success);
      }, `expected HIT but got ${fetchWithAllOptions.toString()}`);
      const receivedWithAllOptions = (
        fetchWithAllOptions as LeaderboardFetch.Success
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

    it('deletes the leaderboard when done testing', async () => {
      const response = await leaderboard.delete();
      expectWithMessage(() => {
        expect(response).toBeInstanceOf(LeaderboardDelete.Success);
      }, `expected Success but got ${response.toString()}`);
    });
  });

  describe('#Fetch by rank', () => {
    const leaderboardName = `test-leaderboard-${v4()}`;
    const leaderboard = leaderboardClient.leaderboard(
      integrationTestCacheName,
      leaderboardName
    );

    it('validates the rank range', async () => {
      const negativeRankRange = await leaderboard.fetchByRank(-10, -5);
      expectWithMessage(() => {
        expect(negativeRankRange).toBeInstanceOf(LeaderboardFetch.Error);
      }, `expected Error but got ${negativeRankRange.toString()}`);
      const negativeRankRangeError =
        negativeRankRange as LeaderboardFetch.Error;
      expectWithMessage(() => {
        expect(negativeRankRangeError.errorCode()).toEqual(
          MomentoErrorCode.INVALID_ARGUMENT_ERROR
        );
      }, `expected INVALID_ARGUMENT_ERROR but got ${negativeRankRangeError.errorCode()} ${negativeRankRangeError.message()}`);

      const noRange = await leaderboard.fetchByRank(0, 0);
      expectWithMessage(() => {
        expect(noRange).toBeInstanceOf(LeaderboardFetch.Error);
      }, `expected Error but got ${noRange.toString()}`);
      const noRangeError = noRange as LeaderboardFetch.Error;
      expectWithMessage(() => {
        expect(noRangeError.errorCode()).toEqual(
          MomentoErrorCode.INVALID_ARGUMENT_ERROR
        );
      }, `expected INVALID_ARGUMENT_ERROR but got ${noRangeError.errorCode()} ${noRangeError.message()}`);

      const reverseRange = await leaderboard.fetchByRank(10, 5);
      expectWithMessage(() => {
        expect(reverseRange).toBeInstanceOf(LeaderboardFetch.Error);
      }, `expected Error but got ${reverseRange.toString()}`);
      const reverseRangeError = reverseRange as LeaderboardFetch.Error;
      expectWithMessage(() => {
        expect(reverseRangeError.errorCode()).toEqual(
          MomentoErrorCode.INVALID_ARGUMENT_ERROR
        );
      }, `expected INVALID_ARGUMENT_ERROR but got ${reverseRangeError.errorCode()} ${reverseRangeError.message()}`);

      const overLimit = await leaderboard.fetchByRank(0, 8193);
      expectWithMessage(() => {
        expect(overLimit).toBeInstanceOf(LeaderboardFetch.Error);
      }, `expected Error but got ${overLimit.toString()}`);
      const overLimitError = overLimit as LeaderboardFetch.Error;
      expectWithMessage(() => {
        expect(overLimitError.errorCode()).toEqual(
          MomentoErrorCode.INVALID_ARGUMENT_ERROR
        );
      }, `expected INVALID_ARGUMENT_ERROR but got ${overLimitError.errorCode()} ${overLimitError.message()}`);
    });

    it('returns Success with no values when leaderboard does not exist', async () => {
      const response = await leaderboard.fetchByRank(0, 100);
      expectWithMessage(() => {
        expect(response).toBeInstanceOf(LeaderboardFetch.Success);
      }, `expected Success but got ${response.toString()}`);
      const elements = (response as LeaderboardFetch.Success).values();
      expectWithMessage(() => {
        expect(elements).toBeArrayOfSize(0);
      }, `expected array of size 0 but got ${elements.length}`);
    });

    it('fetches elements given a variety of rank ranges', async () => {
      // upsert some values first
      const elements = new Map([
        [123, 100],
        [456, 200],
        [789, 300],
      ]);
      const response = await leaderboard.upsert(elements);
      expectWithMessage(() => {
        expect(response).toBeInstanceOf(LeaderboardUpsert.Success);
      }, `expected Success but got ${response.toString()}`);

      // fetch them in various ways
      const ascendingOrder = await leaderboard.fetchByRank(0, 10, {
        order: LeaderboardOrder.Ascending,
      });
      expectWithMessage(() => {
        expect(ascendingOrder).toBeInstanceOf(LeaderboardFetch.Success);
      }, `expected FOUND but got ${ascendingOrder.toString()}`);
      const receivedAscending = (
        ascendingOrder as LeaderboardFetch.Success
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

      const descendingOrder = await leaderboard.fetchByRank(0, 10, {
        order: LeaderboardOrder.Descending,
      });
      expectWithMessage(() => {
        expect(descendingOrder).toBeInstanceOf(LeaderboardFetch.Success);
      }, `expected FOUND but got ${descendingOrder.toString()}`);
      const receivedDescending = (
        descendingOrder as LeaderboardFetch.Success
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

      const topTwo = await leaderboard.fetchByRank(0, 2, {
        order: LeaderboardOrder.Ascending,
      });
      expectWithMessage(() => {
        expect(topTwo).toBeInstanceOf(LeaderboardFetch.Success);
      }, `expected FOUND but got ${topTwo.toString()}`);
      const receivedTopTwo = (topTwo as LeaderboardFetch.Success).values();
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

    it('deletes the leaderboard when done testing', async () => {
      const response = await leaderboard.delete();
      expectWithMessage(() => {
        expect(response).toBeInstanceOf(LeaderboardDelete.Success);
      }, `expected Success but got ${response.toString()}`);
    });
  });

  describe('#Get element rank', () => {
    const leaderboardName = `test-leaderboard-${v4()}`;
    const leaderboard = leaderboardClient.leaderboard(
      integrationTestCacheName,
      leaderboardName
    );

    it('returns Success with no values when leaderboard does not exist', async () => {
      const response = await leaderboard.getRank([123]);
      expectWithMessage(() => {
        expect(response).toBeInstanceOf(LeaderboardFetch.Success);
      }, `expected Success but got ${response.toString()}`);
      const elements = (response as LeaderboardFetch.Success).values();
      expectWithMessage(() => {
        expect(elements).toBeArrayOfSize(0);
      }, `expected array of size 0 but got ${elements.length}`);
    });

    it('rank changes given ascending vs descending order', async () => {
      // Insert some elements
      const elements = new Map([
        [123, 100.0],
        [456, 200.0],
        [789, 300.0],
      ]);
      const upsertResponse = await leaderboard.upsert(elements);
      expectWithMessage(() => {
        expect(upsertResponse).toBeInstanceOf(LeaderboardUpsert.Success);
      }, `expected Success but got ${upsertResponse.toString()}`);

      // Get rank of an element when leaderboard is in ascending order
      const getRankAscending = await leaderboard.getRank([123, 789], {
        order: LeaderboardOrder.Ascending,
      });
      expectWithMessage(() => {
        expect(getRankAscending).toBeInstanceOf(LeaderboardFetch.Success);
      }, `expected Found but got ${getRankAscending.toString()}`);
      const receivedAscending = (
        getRankAscending as LeaderboardFetch.Success
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
      const getRankDescending = await leaderboard.getRank([123, 789], {
        order: LeaderboardOrder.Descending,
      });
      expectWithMessage(() => {
        expect(getRankDescending).toBeInstanceOf(LeaderboardFetch.Success);
      }, `expected Found but got ${getRankDescending.toString()}`);
      const receivedDescending = (
        getRankDescending as LeaderboardFetch.Success
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

    it('deletes the leaderboard when done testing', async () => {
      const response = await leaderboard.delete();
      expectWithMessage(() => {
        expect(response).toBeInstanceOf(LeaderboardDelete.Success);
      }, `expected Success but got ${response.toString()}`);
    });
  });

  describe('#Get leaderboard length', () => {
    const leaderboardName = `test-leaderboard-${v4()}`;
    const leaderboard = leaderboardClient.leaderboard(
      integrationTestCacheName,
      leaderboardName
    );

    it('returns Success with length 0 when leaderboard does not exist', async () => {
      const response = await leaderboard.length();
      expectWithMessage(() => {
        expect(response).toBeInstanceOf(LeaderboardLength.Success);
      }, `expected Found but got ${response.toString()}`);
      const receivedLength = (response as LeaderboardLength.Success).length();
      expect(receivedLength).toEqual(0);
    });

    it('returns length when leaderboard contains elements', async () => {
      // Insert some elements
      const elements = new Map([
        [123, 100.0],
        [456, 200.0],
        [789, 300.0],
      ]);
      const upsertResponse = await leaderboard.upsert(elements);
      expectWithMessage(() => {
        expect(upsertResponse).toBeInstanceOf(LeaderboardUpsert.Success);
      }, `expected Success but got ${upsertResponse.toString()}`);

      // Length should match number of elements inserted
      const lengthResponse = await leaderboard.length();
      expectWithMessage(() => {
        expect(lengthResponse).toBeInstanceOf(LeaderboardLength.Success);
      }, `expected Found but got ${lengthResponse.toString()}`);
      const receivedLength = lengthResponse as LeaderboardLength.Success;
      expect(receivedLength.length()).toEqual(elements.size);
    });

    it('deletes the leaderboard when done testing', async () => {
      const response = await leaderboard.delete();
      expectWithMessage(() => {
        expect(response).toBeInstanceOf(LeaderboardDelete.Success);
      }, `expected Success but got ${response.toString()}`);
    });
  });

  describe('#Remove elements', () => {
    const leaderboardName = `test-leaderboard-${v4()}`;
    const leaderboard = leaderboardClient.leaderboard(
      integrationTestCacheName,
      leaderboardName
    );

    it('validates the number of elements', async () => {
      const response = await leaderboard.removeElements([]);
      expectWithMessage(() => {
        expect(response).toBeInstanceOf(LeaderboardRemoveElements.Error);
      }, `expected Error but got ${response.toString()}`);
      const responseError = response as LeaderboardRemoveElements.Error;
      expectWithMessage(() => {
        expect(responseError.errorCode()).toEqual(
          MomentoErrorCode.INVALID_ARGUMENT_ERROR
        );
      }, `expected INVALID_ARGUMENT_ERROR but got ${responseError.errorCode()} ${responseError.message()}`);
    });

    it('returns Success (no-op) when leaderboard does not exist', async () => {
      const response = await leaderboard.removeElements([123]);
      expectWithMessage(() => {
        expect(response).toBeInstanceOf(LeaderboardRemoveElements.Success);
      }, `expected Success but got ${response.toString()}`);
    });

    it('successfully removes elements', async () => {
      // Insert some elements first
      const elements = new Map([
        [123, 100.0],
        [456, 200.0],
        [789, 300.0],
      ]);
      const response = await leaderboard.upsert(elements);
      expectWithMessage(() => {
        expect(response).toBeInstanceOf(LeaderboardUpsert.Success);
      }, `expected Success but got ${response.toString()}`);

      // Remove some elements
      const removeResponse = await leaderboard.removeElements([123, 789]);
      expectWithMessage(() => {
        expect(removeResponse).toBeInstanceOf(
          LeaderboardRemoveElements.Success
        );
      }, `expected Success but got ${removeResponse.toString()}`);

      // Check that the remaining elements are as expected
      const fetchResponse = await leaderboard.fetchByScore();
      expectWithMessage(() => {
        expect(fetchResponse).toBeInstanceOf(LeaderboardFetch.Success);
      }, `expected Found but got ${fetchResponse.toString()}`);
      const receivedElements = (
        fetchResponse as LeaderboardFetch.Success
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

    it('deletes the leaderboard when done testing', async () => {
      const response = await leaderboard.delete();
      expectWithMessage(() => {
        expect(response).toBeInstanceOf(LeaderboardDelete.Success);
      }, `expected Success but got ${response.toString()}`);
    });
  });

  describe('#Delete leaderboard', () => {
    const leaderboardName = `test-leaderboard-${v4()}`;
    const leaderboard = leaderboardClient.leaderboard(
      integrationTestCacheName,
      leaderboardName
    );

    it('returns Success (no-op) when leaderboard does not exist', async () => {
      const response = await leaderboard.delete();
      expectWithMessage(() => {
        expect(response).toBeInstanceOf(LeaderboardDelete.Success);
      }, `expected Success but got ${response.toString()}`);
    });

    it('successfully deletes a leaderboard', async () => {
      // Create a leaderboard by upserting some elements
      const elements = new Map([
        [123, 100.0],
        [456, 200.0],
        [789, 300.0],
      ]);
      const response = await leaderboard.upsert(elements);
      expectWithMessage(() => {
        expect(response).toBeInstanceOf(LeaderboardUpsert.Success);
      }, `expected Success but got ${response.toString()}`);

      // Verify the leaderboard exists
      const verifyExists = await leaderboard.length();
      expectWithMessage(() => {
        expect(verifyExists).toBeInstanceOf(LeaderboardLength.Success);
      }, `expected Found but got ${verifyExists.toString()}`);
      const receivedLength = (
        verifyExists as LeaderboardLength.Success
      ).length();
      expectWithMessage(() => {
        expect(receivedLength).toEqual(elements.size);
      }, `expected array of size 0 but got ${receivedLength}`);

      // Delete the leaderboard
      const deleteResponse = await leaderboard.delete();
      expectWithMessage(() => {
        expect(deleteResponse).toBeInstanceOf(LeaderboardDelete.Success);
      }, `expected Success but got ${deleteResponse.toString()}`);

      // Verify it no longer exists
      const deleted = await leaderboard.length();
      expectWithMessage(() => {
        expect(deleted).toBeInstanceOf(LeaderboardLength.Success);
      }, `expected Found but got ${deleted.toString()}`);
      const deletedLength = (deleted as LeaderboardLength.Success).length();
      expectWithMessage(() => {
        expect(deletedLength).toEqual(0);
      }, `expected array of size 0 but got ${deletedLength}`);
    });

    it('deletes the leaderboard when done testing', async () => {
      const response = await leaderboard.delete();
      expectWithMessage(() => {
        expect(response).toBeInstanceOf(LeaderboardDelete.Success);
      }, `expected Success but got ${response.toString()}`);
    });
  });
}
