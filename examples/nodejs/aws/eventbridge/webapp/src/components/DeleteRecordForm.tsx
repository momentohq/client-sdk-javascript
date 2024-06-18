import React from "react";
import { toastSuccess, toastError } from "../utils/toast";
import { deleteRecord } from "../utils/dynamodb";

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
    <form onSubmit={handleSubmit} className="flex flex-col items-start space-y-2 w-full">
      <label htmlFor="location-input" className="text-sm font-medium text-gray-600">
        Location
      </label>
      <div className="flex w-full items-center space-x-2">
        <input
          type="text"
          id="location-input"
          value={props.location}
          onChange={props.handleChange}
          required
          className="flex-1 rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500"
          placeholder="Enter Location"
        />
        <button
          type="submit"
          className="rounded-lg bg-red-500 px-4 py-2 font-bold text-white hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Delete
        </button>
      </div>
    </form>
  );
};

export default DeleteRecordForm;
