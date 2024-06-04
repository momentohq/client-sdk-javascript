import React from "react";
import { getItemFromCache } from "../utils/momento-web.ts";
import { toastSuccess, toastError } from "../utils/toast.tsx";
import {createRecord} from "../utils/dynamodb.ts";

type CreateRecordFormProps = {
  location: string;
  setLocation: (value: string) => void;
  maxTemp: string;
  setMaxTemp: (value: string) => void;
  minTemp: string;
  setMinTemp: (value: string) => void;
  precipitation: string;
  setPrecipitation: (value: string) => void;
  handleChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
};

const CreateRecordForm = (props: CreateRecordFormProps) => {
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      await createRecord(props.location, props.maxTemp, props.minTemp, props.precipitation);
      await getItemFromCache(props.location);
      toastSuccess("Item created successfully");
    } catch (error) {
      console.error("Error creating item", error);
      toastError("Error creating item");
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit}>
        <div className="mb-4 space-y-4">
          <div className="flex flex-row items-center">
            <label htmlFor="location-input" className="text-sm font-medium text-gray-600 mr-2 w-24">
              Location
            </label>
            <input
              type="text"
              id="location-input"
              value={props.location}
              onChange={props.handleChange}
              required
              className="flex-1 rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="Enter Location"
            />
            <label htmlFor="precipitation-input" className="text-sm font-medium text-gray-600 ml-2 w-24">
            </label>
          </div>
          <div className="flex flex-row items-center">
            <label htmlFor="max-temp-input" className="text-sm font-medium text-gray-600 mr-2 w-24">
              Max Temp
            </label>
            <input
              type="number"
              id="max-temp-input"
              value={props.maxTemp}
              onChange={props.handleChange}
              required
              className="flex-1 rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="Enter Max Temp"
            />
            <label htmlFor="precipitation-input" className="text-sm font-medium text-gray-600 ml-2 w-24">
              °F
            </label>
          </div>
          <div className="flex flex-row items-center">
            <label htmlFor="min-temp-input" className="text-sm font-medium text-gray-600 mr-2 w-24">
              Min Temp
            </label>
            <input
              type="number"
              id="min-temp-input"
              value={props.minTemp}
              onChange={props.handleChange}
              required
              className="flex-1 rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="Enter Min Temp"
            />
            <label htmlFor="precipitation-input" className="text-sm font-medium text-gray-600 ml-2 w-24">
              °F
            </label>
          </div>
          <div className="flex flex-row items-center">
            <label htmlFor="precipitation-input" className="text-sm font-medium text-gray-600 mr-2 w-24">
              Chances of Precipitation
            </label>
            <input
              type="number"
              id="precipitation-input"
              value={props.precipitation}
              onChange={props.handleChange}
              required
              className="flex-1 rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="Enter Precipitation"
            />
            <label htmlFor="precipitation-input" className="text-sm font-medium text-gray-600 ml-2 w-24">
              %
            </label>
          </div>
        </div>
        <button
          type="submit"
          className="mt-2 w-full rounded-lg bg-teal-500 px-4 py-2 font-bold text-white hover:bg-teal-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Submit
        </button>
      </form>
</>
)
  ;
};

export default CreateRecordForm;
