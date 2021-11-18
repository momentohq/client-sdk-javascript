import {readFileSync, accessSync} from 'fs';
import {homedir} from 'os';
import {parse} from 'toml';

const getProfileToUse = (): string => {
  return process.env.MOMENTO_PROFILE ?? 'default';
};

type Credential = {
  token: string;
};

type Credentials = {
  profile: Record<string, Credential>;
};

export const getCredentials = (): Credential => {
  const profileToUse = getProfileToUse();
  const homeDir = homedir();
  const credsFilePath = `${homeDir}/.momento/credentials.toml`;

  try {
    // checking to make sure file exists
    accessSync(credsFilePath);
  } catch (e) {
    throw new Error(
      'pass a momento authentication token or configure momento creds using the momento-cli https://github.com/momentohq/momento-cli'
    );
  }

  const credsFileString = readFileSync(credsFilePath).toString();
  const credsFileToml = parse(credsFileString) as Credentials;
  if (profileToUse in credsFileToml.profile) {
    return credsFileToml.profile[profileToUse];
  }
  throw new Error(
    `profile "${profileToUse}" does not exist in your momento config. You can add it using the cli "momento configure"`
  );
};
