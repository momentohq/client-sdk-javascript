import {InvalidArgumentError} from '../errors';
import jwtDecode from 'jwt-decode';

interface Claims {
  /**
   * control plane endpoint
   */
  cp: string;
  /**
   * cache endpoint
   */
  c: string;
}

/**
 * @param {string=} jwt
 * @returns Claims
 */
export const decodeJwt = (jwt?: string): Claims => {
  if (!jwt) {
    throw new InvalidArgumentError('malformed auth token');
  }
  try {
    return jwtDecode<Claims>(jwt);
  } catch (e) {
    throw new InvalidArgumentError('failed to parse jwt');
  }
};
