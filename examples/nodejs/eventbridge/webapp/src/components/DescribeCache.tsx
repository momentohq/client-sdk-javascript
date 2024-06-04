import {useEffect, useState} from "react";
import {cacheName, getItemFromCache, getRemainingTtl} from "../utils/momento-web.ts";
import {toastInfo} from "../utils/toast.tsx";

type DescribeCacheProps = {
  location: string;
};

const DescribeCache = (props: DescribeCacheProps) => {
  const [searchKey, setSearchKey] = useState<string>(props.location);
  const [cacheResult, setCacheResult] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [ttlRemaining, setTtlRemaining] = useState<number | null>(null);
  const [latency, setLatency] = useState<number | null>(null);

  useEffect(() => {
    setSearchKey(props.location);
    setCacheResult(null);
  }, [props.location]);

  const handleFindClick = async () => {
    setIsLoading(true);
    try {
      const startTime = performance.now();
      const getItemFromCacheResp = await getItemFromCache(searchKey);
      const endTime = performance.now();
      setLatency(endTime - startTime);
      if (getItemFromCacheResp === undefined) {
        setCacheResult("No data to display");
        setTtlRemaining(null);
        toastInfo("Cache miss. No data found.");
      } else {
        setCacheResult(JSON.stringify(JSON.parse(getItemFromCacheResp), null, 2));
        const ttlMillis = await getRemainingTtl(searchKey);
        if (ttlMillis != null) {
          const ttlSeconds = ttlMillis / 1000;
          setTtlRemaining(ttlSeconds);
        }
      }
    } catch (error) {
      console.error("Error fetching cache:", error);
      toastInfo("Error fetching cache");
    }
    setIsLoading(false);
  };

  return (
    <>
      <div className="mb-4 flex items-center bg-yellow-100 p-2 rounded-lg">
        <h2 className="font-semibold">Cache Name:</h2>
        <span className="text-gray-600 ml-2">{cacheName}</span>
      </div>
      <div className="mb-4 flex items-center">
        <label
          htmlFor="find-cache-key-input"
          className="text-sm font-medium text-gray-600 mr-2 w-24"
        >
          Cache Key (Location)
        </label>
        <div className="flex flex-1">
          <input
            data-automation-id="find-cache-key-input"
            autoFocus={true}
            value={searchKey}
            onChange={(e) => setSearchKey(e.target.value)}
            type="text"
            id="find-key-input"
            placeholder="Enter Location"
            className="flex-1 rounded-l-lg border px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500"
          />
          <button
            onClick={handleFindClick}
            className="rounded-r-lg bg-teal-500 px-3 py-1 font-bold text-white hover:bg-teal-600 focus:outline-none focus:ring-blue-500"
            disabled={isLoading}
          >
            {isLoading ? "Finding..." : "Find"}
          </button>
        </div>
      </div>
      <div className="h-56 overflow-auto rounded-lg border bg-white p-4 text-gray-500">
        <pre className="whitespace-pre-wrap">
          {cacheResult ? cacheResult : "No data to display"}
        </pre>
      </div>
      {(cacheResult != "No data to display" && cacheResult != null) && (
        <div className="flex flex-col items-center justify-center mt-4 p-4 bg-white rounded-lg shadow-lg">
          <div className="text-lg font-semibold text-gray-700">Cache Information</div>
          <div className="mt-2 text-sm text-gray-500">
            Expires In: <span className="text-blue-500 font-bold">{ttlRemaining} s</span>
          </div>
          <div className="mt-2 text-sm text-gray-500">
            Latency: <span className="text-blue-500 font-bold">{latency?.toFixed(2)} ms</span>
          </div>
        </div>
      )}
    </>
  );
};

export default DescribeCache;
