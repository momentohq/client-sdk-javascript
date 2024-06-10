import React, { useEffect, useState } from "react";
import { getItemFromCache, getRemainingTtl } from "../utils/momento-web";
import { toastInfo } from "../utils/toast";
import {getRecord} from "../utils/dynamodb";
import {parseDynamoRecord} from "../utils/helper";

type DescribeCacheProps = {
  location: string;
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
};

const DescribeCache = (props: DescribeCacheProps) => {
  const [searchKey, setSearchKey] = useState<string>(props.location);
  const [cacheResult, setCacheResult] = useState<string | null>(null);
  const [dynamoResult, setDynamoResult] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [ttlRemaining, setTtlRemaining] = useState<number | null>(null);

  useEffect(() => {
    setSearchKey(props.location);
    setCacheResult(null);
    setDynamoResult(null);
  }, [props.location]);

  const handleLocationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchKey(e.target.value);
    props.handleChange(e);
  }

  const handleFindClick = async () => {
    setIsLoading(true);
    try {
      // Fetch from cache
      const getItemFromCacheResp = await getItemFromCache(searchKey);
      if (getItemFromCacheResp === undefined) {
        setCacheResult("No data to display");
        setTtlRemaining(null);
        toastInfo("Cache miss. No data found.");
        setIsLoading(false);
      } else {
        setCacheResult(JSON.stringify(JSON.parse(getItemFromCacheResp), null, 2));
        const ttlMillis = await getRemainingTtl(searchKey);
        if (ttlMillis != null) {
          const ttlSeconds = ttlMillis / 1000;
          setTtlRemaining(ttlSeconds);
        }
      }

      // Fetch from DynamoDB
      const getRecordFromDynamoDBResp = await getRecord(searchKey);
      if (getRecordFromDynamoDBResp === undefined) {
        setDynamoResult("No data to display");
      } else {
        const weatherData = parseDynamoRecord(getRecordFromDynamoDBResp);
        if (weatherData) {
          const formattedResult = JSON.stringify(weatherData, null, 2);
          setDynamoResult(formattedResult);
        } else {
          setDynamoResult("No data to display");
        }
      }
    } catch (error) {
      console.error("Error fetching cache or DynamoDB:", error);
      toastInfo("Error fetching cache or DynamoDB");
    }
    setIsLoading(false);
  };

  return (
    <>
      <div className="mb-4 flex items-center">
        <label
          htmlFor="find-cache-key-input"
          className="text-sm font-medium text-gray-600 mr-2 w-24"
        >
          Cache Key (Location)
        </label>
        <div className="flex flex-1">
          <input
            data-automation-id="location-input"
            value={searchKey}
            onChange={handleLocationChange}
            type="text"
            id="location-input"
            placeholder="Enter Location"
            className="flex-1 rounded-l-lg border px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500"
          />
          <button
            onClick={handleFindClick}
            className="rounded-r-lg bg-teal-500 px-3 py-1 font-bold text-white hover:bg-teal-600 focus:outline-none focus:ring-blue-500"
            disabled={isLoading}
          >
            {isLoading ? "Loading..." : "Get Item"}
          </button>
          {(cacheResult !== "No data to display" && cacheResult != null) && (
            <div className=" ml-2 p-2 bg-gray-100 flex flex-row space-x-2 items-center rounded-lg shadow-lg">
              <div className="text-sm font-semibold text-gray-700">Cache Information: </div>
              <div className="text-sm text-gray-500">
                Expires In: <span className="text-blue-500 font-bold"> {ttlRemaining} s</span>
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 h-56 text-sm overflow-auto rounded-lg border bg-gray-50 p-4 text-gray-500">
          <h3 className="font-bold mb-2">Cache Result:</h3>
          <pre className="whitespace-pre-wrap">
            {cacheResult ? cacheResult : "No data to display"}
          </pre>
        </div>
        <div className="flex-1 text-sm h-56 overflow-auto rounded-lg border bg-gray-50 p-4 text-gray-500">
          <h3 className="font-bold mb-2">DynamoDB Result:</h3>
          <pre className="whitespace-pre-wrap">
            {dynamoResult ? dynamoResult : "No data to display"}
          </pre>
        </div>
      </div>
    </>
  );
};

export default DescribeCache;
