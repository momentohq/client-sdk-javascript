import { useEffect, useState } from "react";
import { getItemFromCache } from "../utils/momento-web.ts";
import { toastInfo } from "../utils/toast.tsx";

type DescribeCacheProps = {
  gameId: string;
  gamerTag: string;
};

const DescribeCache = (props: DescribeCacheProps) => {
  const [cacheName, setCacheName] = useState<string>(props.gameId);
  const [searchKey, setSearchKey] = useState<string>(props.gamerTag);
  const [cacheResult, setCacheResult] = useState<string | null>(null);

  useEffect(() => {
    setCacheName(props.gameId);
    setCacheResult(null);
  }, [props.gameId]);

  useEffect(() => {
    setSearchKey(props.gamerTag);
    setCacheResult(null);
  }, [props.gamerTag]);

  const handleFindClick = async () => {
    const getItemFromCacheResp = await getItemFromCache(cacheName, searchKey);
    if (getItemFromCacheResp === undefined) {
      setCacheResult("No data found");
      toastInfo("Cache miss. No data found.");
      return;
    }
    setCacheResult(getItemFromCacheResp);
  };

  return (
    <>
      <div className="mb-4 flex flex-row items-center">
        <label
          htmlFor="cache-name-input"
          className="text-sm font-medium text-gray-600 mr-2 w-24"
        >
          Cache Name
        </label>
        <input
          type="text"
          id="cache-name-input"
          value={cacheName}
          onChange={(e) => setCacheName(e.target.value)}
          required
          className="flex-1 rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500"
          placeholder="Enter Cache Name (Game ID)"
        />
      </div>
      <div className="mb-4 flex flex-row items-center">
        <label
          htmlFor="find-cache-key-input"
          className="text-sm font-medium text-gray-600 mr-2 w-24"
        >
          Cache Key
        </label>
        <div className="flex flex-1">
          <input
            data-automation-id="find-cache-key-input"
            autoFocus={true}
            value={searchKey}
            onChange={(e) => setSearchKey(e.target.value)}
            type="text"
            id="find-key-input"
            placeholder="Enter Key (Gamer Tag)"
            className="flex-1 rounded-l-lg border px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500"
          />
          <button
            onClick={handleFindClick}
            className="rounded-r-lg bg-teal-500 px-3 py-1 font-bold text-white hover:bg-teal-600 focus:outline-none focus:ring-blue-500"
          >
            Find
          </button>
        </div>
      </div>
      <div className="h-72 flex-grow justify-start rounded-lg border bg-gray-50 p-4 text-left">
        <code
          className="break-words break-all text-gray-500"
          data-automation-id="find-cache-value-div"
        >
          {cacheResult ? cacheResult : "No data to display"}
        </code>
      </div>
    </>
  );
};

export default DescribeCache;
