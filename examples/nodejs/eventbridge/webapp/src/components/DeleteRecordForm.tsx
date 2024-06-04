import React from "react";
import {toastSuccess, toastError} from "../utils/toast.tsx";
import {deleteRecord} from "../utils/dynamodb.ts";

type DeleteRecordFormProps = {
  location: string;
  handleChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
};

const DeleteRecordForm = (props: DeleteRecordFormProps) => {
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      await deleteRecord(props.location);
      toastSuccess("Item deleted successfully");
    } catch (error) {
      console.error("Error deleting item", error);
      toastError("Error deleting item");
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="flex flex-col h-full">
        <div className="flex-1 flex flex-col justify-between items-center">
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
          </div>
          <button
            type="submit"
            className="w-full rounded-lg bg-red-500 px-4 py-2 font-bold text-white hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Delete
          </button>
        </div>
      </form>
    </>
  )
    ;
};

export default DeleteRecordForm;
