import {InvalidArgumentError, InvalidJwtError} from '../Errors';
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
 *
 * @param {string=} jwt
 */
export const decodeJwt = (jwt?: string): Claims => {
  if (!jwt) {
    throw new InvalidArgumentError('malformed auth token');
  }
  try {
    return jwtDecode<Claims>(jwt);
  } catch (e) {
    throw new InvalidJwtError('failed to parse jwt');
  }
};
