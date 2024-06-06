import React from "react";
import { getItemFromCache } from "../utils/momento-web";
import { toastSuccess, toastError } from "../utils/toast";
import { createRecord } from "../utils/dynamodb";

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
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      await createRecord(props.location, props.maxTemp, props.minTemp, props.precipitation, props.ttl);
      await getItemFromCache(props.location);
      toastSuccess("Item created successfully");
    } catch (error) {
      console.error("Error creating item", error);
      toastError("Error creating item");
    }
  };

  const formFields = [
    { id: "location-input", label: "Location", value: props.location, placeholder: "Enter Location", suffix: " " },
    { id: "max-temp-input", label: "Max Temp", value: props.maxTemp, placeholder: "Enter Max Temp", suffix: "°F" },
    { id: "min-temp-input", label: "Min Temp", value: props.minTemp, placeholder: "Enter Min Temp", suffix: "°F" },
    { id: "precipitation-input", label: "Chances of Precipitation", value: props.precipitation, placeholder: "Enter Precipitation", suffix: "%" },
    { id: "ttl-input", label: "TTL for Cache", value: props.ttl, placeholder: "Enter TTL", suffix: "Seconds" }
  ];

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-4 space-y-4">
        {formFields.map(({ id, label, value, placeholder, suffix }) => (
          <div key={id} className="flex flex-row items-center">
            <label htmlFor={id} className="text-sm font-medium text-gray-600 mr-2 w-24">
              {label}
            </label>
            <input
              type="text"
              id={id}
              value={value}
              onChange={props.handleChange}
              required
              className="flex-1 rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder={placeholder}
            />
            {suffix && (
              <label htmlFor={id} className="text-sm font-medium text-gray-600 ml-2 w-24">
                {suffix}
              </label>
            )}
          </div>
        ))}
      </div>
      <button
        type="submit"
        className="mt-2 w-full rounded-lg bg-teal-500 px-4 py-2 font-bold text-white hover:bg-teal-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        Submit
      </button>
    </form>
  );
};

export default CreateRecordForm;
