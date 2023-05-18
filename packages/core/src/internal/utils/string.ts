import {Buffer} from 'buffer';

export const decodeFromBase64 = (base64: string) => {
  return Buffer.from(base64, 'base64').toString('utf8');
};

export const encodeToBase64 = (str: string) => {
  return Buffer.from(str, 'utf-8').toString('base64');
};
