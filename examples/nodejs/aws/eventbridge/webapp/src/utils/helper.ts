import {toastInfo} from "./toast";

export const generateRandomData = () => {
  const locations = ["Seattle", "New York", "Los Angeles", "Chicago", "Houston", "Phoenix", "Philadelphia", "San Antonio", "San Diego", "Dallas"];
  const randomLocation = locations[Math.floor(Math.random() * locations.length)];
  const maxTemp = Math.floor(Math.random() * 100).toString();
  const minTemp = Math.floor(Math.random() * parseInt(maxTemp)).toString();
  const precipitation = Math.floor(Math.random() * 100).toString();
  const ttl = "120"; // 2 minutes
  return {
    location: randomLocation,
    maxTemp,
    minTemp,
    precipitation,
    ttl
  };
};


export const parseDynamoRecord = (record: {
  Item?: {
    Location?: { S: string };
    MaxTemp?: { N: string };
    MinTemp?: { N: string };
    ChancesOfPrecipitation?: { N: string };
  };
}) => {
  const { Item } = record;
  const location = Item?.Location?.S;
  const maxTemp = Item?.MaxTemp?.N;
  const minTemp = Item?.MinTemp?.N;
  const chancesOfPrecipitation = Item?.ChancesOfPrecipitation?.N;
  if (!location || !maxTemp || !minTemp || !chancesOfPrecipitation) {
    toastInfo("The record does not exist.");
    return null;
  }
  return {
    Location: location,
    MaxTemp: maxTemp,
    MinTemp: minTemp,
    ChancesOfPrecipitation: chancesOfPrecipitation
  };
};
