import { useEffect, useState } from "react";
import { toastInfo } from "../utils/toast.tsx";
import {getRecord, tableName} from "../utils/dynamodb.ts";

type GetRecordProps = {
  location: string;
};

const GetRecord = (props: GetRecordProps) => {
  const [recordToFind, setRecordToFind] = useState<string>(props.location);
  const [result, setResult] = useState<string | null>(null);
  const [latency, setLatency] = useState<number | null>(null);

  useEffect(() => {
    setRecordToFind(props.location);
    setResult(null);
  }, [props.location]);

  const handleFindClick = async () => {
    try {
      const startTime = performance.now();
      const res = await getRecord(recordToFind);
      const endTime = performance.now();
      setLatency(endTime - startTime);

      if (res === undefined) {
        setResult("No data found");
        toastInfo("No data found");
        return;
      }
      const { Item } = res;
      const location = Item?.Location?.S ;
      const maxTemp = Item?.MaxTemp?.N;
      const minTemp = Item?.MinTemp?.N;
      const chancesOfPrecipitation = Item?.ChancesOfPrecipitation?.N;

      if (!location || !maxTemp || !minTemp || !chancesOfPrecipitation) {
        setResult("No data to display");
        toastInfo("The record does not exist.");
        return;
      }
      const formattedResult = `Location: ${location}\nMax Temp: ${maxTemp}\nMin Temp: ${minTemp}\nChances of Precipitation: ${chancesOfPrecipitation}`;

      setResult(formattedResult);
    } catch (error) {
      console.error("Error:", error);
      setResult(null);
      toastInfo("Error: " + (error as Error).message);
    }
  };

  return (
    <>
      <div className="mb-4 flex items-center bg-yellow-100 p-2 rounded-lg">
        <h2 className="font-semibold">Table Name:</h2>
        <span className="text-gray-600 ml-2">{tableName}</span>
      </div>
      <div className="mb-4 flex flex-row items-center">
        <label
          htmlFor="find-cache-key-input"
          className="text-sm font-medium text-gray-600 mr-2 w-24"
        >
          Primary Key (Location)
        </label>
        <div className="flex flex-1">
          <input
            data-automation-id="find-cache-key-input"
            autoFocus={true}
            value={recordToFind}
            onChange={(e) => setRecordToFind(e.target.value)}
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
      <div className="h-56 flex-grow justify-start rounded-lg border bg-gray-50 p-4 text-left">
        <pre
          className="break-words break-all text-gray-500"
          data-automation-id="find-cache-value-div"
        >
          {result ? result : "No data to display"}
        </pre>
      </div>
      {result != null && result != "No data to display" && (
        <div className="flex flex-col items-center justify-center mt-4 p-4 bg-white rounded-lg shadow-lg">
          <div className="text-lg font-semibold text-gray-700">Record Information</div>
          <div className="mt-2 text-sm text-gray-500">
            Latency: <span className="text-blue-500 font-bold">{latency?.toFixed(2)} ms</span>
          </div>
        </div>
      )}
    </>
  );
};

export default GetRecord;
