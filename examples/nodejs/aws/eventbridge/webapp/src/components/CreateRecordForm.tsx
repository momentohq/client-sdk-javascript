import React, {useEffect, useState} from "react";
import { getItemFromCache } from "../utils/momento-web";
import { toastSuccess, toastError } from "../utils/toast";
import { createRecord } from "../utils/dynamodb";
import {generateRandomData} from "../utils/helper";

type CreateRecordFormProps = {
  location: string;
  setLocation: (value: string) => void;
  maxTemp: string;
  setMaxTemp: (value: string) => void;
  minTemp: string;
  setMinTemp: (value: string) => void;
  precipitation: string;
  setPrecipitation: (value: string) => void;
  ttl: string;
  setTtl: (value: string) => void;
  handleChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
};

const CreateRecordForm = (props: CreateRecordFormProps) => {
  const [populateRandomData, setPopulateRandomData] = useState(true);

  const handleCheckboxChange = () => {
    setPopulateRandomData(!populateRandomData);
  }

  const handlePopulateRandomData = () => {
    const randomData = generateRandomData();
    if (populateRandomData) {
      props.setLocation(randomData.location);
      props.setMaxTemp(randomData.maxTemp);
      props.setMinTemp(randomData.minTemp);
      props.setPrecipitation(randomData.precipitation);
      props.setTtl(randomData.ttl);
    }
  };

  useEffect(() => {
    if (populateRandomData) {
      handlePopulateRandomData();
    } else {
      props.setLocation("");
      props.setMaxTemp("");
      props.setMinTemp("");
      props.setPrecipitation("");
      props.setTtl("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [populateRandomData]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      await createRecord(props.location, props.maxTemp, props.minTemp, props.precipitation, props.ttl);
      await getItemFromCache(props.location);
      toastSuccess("Item created successfully");
    } catch (error) {
      console.error("Error creating item", error);
      toastError(`Error creating item: ${(error as Error).message}`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4 text-sm">
        <div className="flex flex-col">
          <label htmlFor="location-input" className="text-sm font-medium text-gray-600 mb-1">
            Location
          </label>
          <input
            type="text"
            id="location-input"
            value={props.location}
            onChange={props.handleChange}
            required
            className="rounded-lg border px-3 py-2 text-sm   focus:border-blue-500 focus:ring-blue-500"
            placeholder="Enter Location"
          />
        </div>
        <div className="flex flex-col">
          <label htmlFor="max-temp-input" className="text-sm font-medium text-gray-600 mb-1">
            Max Temp (°F)
          </label>
          <input
            type="text"
            id="max-temp-input"
            value={props.maxTemp}
            onChange={props.handleChange}
            required
            className="rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500"
            placeholder="Enter Max Temp"
          />
        </div>
        <div className="flex flex-col">
          <label htmlFor="min-temp-input" className="text-sm font-medium text-gray-600 mb-1">
            Min Temp (°F)
          </label>
          <input
            type="text"
            id="min-temp-input"
            value={props.minTemp}
            onChange={props.handleChange}
            required
            className="rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500"
            placeholder="Enter Min Temp"
          />
        </div>
        <div className="flex flex-col">
          <label htmlFor="precipitation-input" className="text-sm font-medium text-gray-600 mb-1">
            Precipitation (%)
          </label>
          <input
            type="text"
            id="precipitation-input"
            value={props.precipitation}
            onChange={props.handleChange}
            required
            className="rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500"
            placeholder="Enter Precipitation"
          />
        </div>
        <div className="flex flex-col">
          <label htmlFor="ttl-input" className="text-sm font-medium text-gray-600 mb-1">
            TTL (Seconds)
          </label>
          <input
            type="text"
            id="ttl-input"
            value={props.ttl}
            onChange={props.handleChange}
            required
            className="rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500"
            placeholder="Enter TTL"
          />
        </div>
        <div className="flex items-end">
          <button
            type="submit"
            className="rounded-lg bg-teal-500 px-4 w-full py-2 font-bold text-white hover:bg-teal-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Submit
          </button>
        </div>
      </div>
      <div className={"flex items-center"}>
          <input
            type="checkbox"
            id="populate-random-data-checkbox"
            checked={populateRandomData}
            onChange={handleCheckboxChange}
            className="mr-2"
          />
          <label htmlFor="populate-random-data-checkbox" className="text-sm text-gray-600">
            Populate with random data
          </label>
      </div>
    </form>
  );
};

export default CreateRecordForm;
