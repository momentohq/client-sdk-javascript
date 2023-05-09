abstract class Expiration {
  private readonly _doesExpire: boolean;

  constructor(doesExpire: boolean) {
    this._doesExpire = doesExpire;
  }

  /**
   * Whether or not the token expires or not.
   * @returns {boolean}
   */
  public doesExpire(): boolean {
    return this._doesExpire;
  }
}

export class ExpiresIn extends Expiration {
  private readonly _validForSeconds: number;

  /**
   * If doesExpire is false, the refresh token will not have a expiration time, instead validForSeconds will be 'Infinity'.
   * @param {number} [validForSeconds]
   * @param {boolean} [doesExpire]
   */
  private constructor(validForSeconds: number) {
    super(validForSeconds !== Infinity);
    this._validForSeconds =
      validForSeconds === null ? Infinity : validForSeconds;
  }

  /**
   * Time token is valid for in seconds.
   * @returns {number} Infinity, if token doesn't expire.
   */
  public seconds(): number {
    return this._validForSeconds;
  }

  /**
   * Constructs a ExpiresIn which never expires.
   * @param validForSeconds
   * @returns {ExpiresIn}
   */
  public static never(): ExpiresIn {
    return new ExpiresIn(Infinity);
  }

  /**
   * Constructs a ExpiresIn with a specified validFor period in seconds.
   * If seconds are undefined, or null, then token never expires.
   * @param validForSeconds
   * @returns {ExpiresIn}
   */
  public static seconds(validForSeconds: number): ExpiresIn {
    return new ExpiresIn(validForSeconds);
  }

  /**
   * Constructs a ExpiresIn with a specified validFor period in minutes.
   * @param validForMinutes
   * @returns {ExpiresIn}
   */
  public static minutes(validForMinutes: number): ExpiresIn {
    return new ExpiresIn(validForMinutes * 60);
  }

  /**
   * Constructs a ExpiresIn with a specified validFor period in hours.
   * @param validForHours
   * @returns {ExpiresIn}
   */
  public static hours(validForHours: number): ExpiresIn {
    return new ExpiresIn(validForHours * 3600);
  }

  /**
   * Constructs a ExpiresIn with a specified validFor period in days.
   * @param validForDays
   * @returns {ExpiresIn}
   */
  public static days(validForDays: number): ExpiresIn {
    return new ExpiresIn(validForDays * 86400);
  }

  /**
   * Constructs a ExpiresIn with a specified expiresBy period in epoch format.
   * @param expiresBy
   * @returns {ExpiresIn}
   */
  public static epoch(expiresBy: number): ExpiresIn {
    const currentEpoch = new Date().getTime() / 1000;
    const secondsUntilEpoch = Math.round(expiresBy - currentEpoch);
    return new ExpiresIn(secondsUntilEpoch);
  }
}

export class ExpiresAt extends Expiration {
  private readonly validUntil: number;

  private constructor(epochTimestamp: number | undefined) {
    super(epochTimestamp !== undefined);
    if (this.doesExpire()) {
      this.validUntil = epochTimestamp as number;
    } else {
      this.validUntil = Infinity;
    }
  }

  /**
   * Returns epoch timestamp of when api token expires.
   * @returns {number}
   */
  public epoch(): number {
    return this.validUntil;
  }

  /**
   * Constructs a ExpiresAt with a the specified epoch timestamp,
   * if timestamp is undefined, then epoch timetamp will instead be Infinity.
   * @param epoch
   * @returns {ExpiresAt}
   */
  public static fromEpoch(epoch: number | undefined): ExpiresAt {
    return new ExpiresAt(epoch);
  }
}
