import {decodeJwt} from '../../src/utils/jwt';
import {InvalidArgumentError} from '../../src/Errors';

const TEST_AUTH_TOKEN_NO_ENDPOINT =
  'eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJpbnRlZ3JhdGlvbiJ9.ZOgkTs';
const TEST_AUTH_TOKEN_ENDPOINT =
  'eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJzcXVpcnJlbCIsImNwIjoiY29udHJvbCBwbGFuZSBlbmRwb2ludCIsImMiOiJkYXRhIHBsYW5lIGVuZHBvaW50In0.zsTsEXFawetTCZI';
const MALFORMED_TOKEN = 'fsaf';

describe('jwt.ts', () => {
  it('should parse endpoints from jwt', () => {
    const res = decodeJwt(TEST_AUTH_TOKEN_ENDPOINT);
    expect(res.cp).toEqual('control plane endpoint');
    expect(res.c).toEqual('data plane endpoint');

    const noEndpoints = decodeJwt(TEST_AUTH_TOKEN_NO_ENDPOINT);
    expect(noEndpoints.cp).toBeUndefined();
    expect(noEndpoints.c).toBeUndefined();
  });

  it('should throw InvalidArgumentError if no jwt is passed', () => {
    expect(decodeJwt).toThrow(InvalidArgumentError);
  });

  it('should throw InvalidJwtError when jwt is malformed', () => {
    expect(() => decodeJwt(MALFORMED_TOKEN)).toThrow(InvalidArgumentError);
  });
});
