import { ToastContainer } from "react-toastify";
import React, { useState } from "react";
import AWS from "aws-sdk";
import { getItemFromCache } from "../utils/momento-web.ts";
import { toastSuccess, toastError } from "../utils/toast.tsx";

const awsAccesskeyId = import.meta.env.VITE_APP_AWS_ACCESS_KEY_ID;
const awsSecretAccessKey = import.meta.env.VITE_APP_AWS_SECRET_ACCESS_KEY;

type DbFormProps = {
  gameId: string;
  gamerTag: string;
  score: string;
  level: string;
  setGameId: (value: string) => void;
  setGamerTag: (value: string) => void;
  setScore: (value: string) => void;
  setLevel: (value: string) => void;
  handleChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
};

const DbForm = (props: DbFormProps) => {
  const [deleteGameId, setDeleteGameId] = useState("");
  const [deleteGamerTag, setDeleteGamerTag] = useState("");
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    AWS.config.update({
      region: "us-west-2",
      credentials: {
        accessKeyId: awsAccesskeyId,
        secretAccessKey: awsSecretAccessKey,
      },
    });
    const dynamoDB = new AWS.DynamoDB();
    const item = {
      GameId: { S: props.gameId },
      GamerTag: { S: props.gamerTag },
      Score: { N: props.score },
      Level: { N: props.level },
    };
    const params = {
      TableName: "game-scores-demo",
      Item: item,
    };

    try {
      await dynamoDB.putItem(params).promise();
      await getItemFromCache(props.gameId, props.gamerTag);
      toastSuccess("Item created successfully");
    } catch (error) {
      console.error("Error creating item", error);
      toastError("Error creating item");
    }
  };

  const handleDelete = async () => {
    AWS.config.update({
      region: "us-west-2",
      credentials: {
        accessKeyId: awsAccesskeyId,
        secretAccessKey: awsSecretAccessKey,
      },
    });
    const dynamoDB = new AWS.DynamoDB();

    const item = {
      GameId: { S: deleteGameId },
      GamerTag: { S: deleteGamerTag },
    };
    const params = {
      TableName: "game-scores-demo",
      Key: item,
    };

    try {
      await dynamoDB.deleteItem(params).promise();
      toastSuccess("Item deleted successfully");
    } catch (error) {
      console.error("Error deleting item", error);
      toastError("Error deleting item");
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit}>
        <div className="mb-4 space-y-4">
          <div className="flex flex-row items-center">
            <label htmlFor="game-id-input" className="text-sm font-medium text-gray-600 mr-2 w-24">
              Game ID
            </label>
            <input
              type="text"
              id="game-id-input"
              value={props.gameId}
              onChange={props.handleChange}
              required
              className="flex-1 rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="Enter Game ID"
            />
          </div>
          <div className="flex flex-row items-center">
            <label htmlFor="gamer-tag-input" className="text-sm font-medium text-gray-600 mr-2 w-24">
              Gamer Tag
            </label>
            <input
              type="text"
              id="gamer-tag-input"
              value={props.gamerTag}
              onChange={props.handleChange}
              required
              className="flex-1 rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="Enter Gamer Tag"
            />
          </div>
          <div className="flex flex-row items-center">
            <label htmlFor="level-input" className="text-sm font-medium text-gray-600 mr-2 w-24">
              Level
            </label>
            <input
              type="number"
              id="level-input"
              value={props.level}
              onChange={props.handleChange}
              required
              className="flex-1 rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="Enter Level"
            />
          </div>
          <div className="flex flex-row items-center">
            <label htmlFor="score-input" className="text-sm font-medium text-gray-600 mr-2 w-24">
              Score
            </label>
            <input
              type="number"
              id="score-input"
              value={props.score}
              onChange={props.handleChange}
              required
              className="flex-1 rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="Enter Score"
            />
          </div>
        </div>
        <button
          type="submit"
          className="mt-2 w-full rounded-lg bg-teal-500 px-4 py-2 font-bold text-white hover:bg-teal-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Submit
        </button>
      </form>
      <div className="mt-4 text-center text-gray-400">-------------------------OR-------------------------</div>
      <div className="mt-4">
        <div className="mb-4 space-y-4">
          <div className="flex flex-row items-center">
            <label htmlFor="delete-game-id-input" className="text-sm font-medium text-gray-600 mr-2 w-24">
              Game ID
            </label>
            <input
              type="text"
              id="delete-game-id-input"
              value={deleteGameId}
              onChange={(e) => setDeleteGameId(e.target.value)}
              required
              className="flex-1 rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="Enter Game ID"
            />
          </div>
          <div className="flex flex-row items-center">
            <label htmlFor="delete-gamer-tag-input" className="text-sm font-medium text-gray-600 mr-2 w-24">
              Gamer Tag
            </label>
            <input
              type="text"
              id="delete-gamer-tag-input"
              value={deleteGamerTag}
              onChange={(e) => setDeleteGamerTag(e.target.value)}
              required
              className="flex-1 rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="Enter Gamer Tag"
            />
          </div>
      </div>
      <button
        type="button"
        onClick={handleDelete}
        className="mt-2 w-full rounded-lg bg-red-500 px-4 py-2 font-bold text-white hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500"
      >
        Delete
      </button>
    </div>
  <ToastContainer />
</>
)
  ;
};

export default DbForm;
