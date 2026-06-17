/**
 * Metadata about a Momento Function, returned by `putFunction` and `listFunctions`.
 */
export class FunctionInfo {
  private readonly _functionId: string;
  private readonly _name: string;
  private readonly _description: string;
  private readonly _latestVersion: number;
  private readonly _currentVersion: number;
  private readonly _lastUpdatedAt: string;

  constructor(
    functionId: string,
    name: string,
    description: string,
    latestVersion: number,
    currentVersion: number,
    lastUpdatedAt: string
  ) {
    this._functionId = functionId;
    this._name = name;
    this._description = description;
    this._latestVersion = latestVersion;
    this._currentVersion = currentVersion;
    this._lastUpdatedAt = lastUpdatedAt;
  }

  public getFunctionId(): string {
    return this._functionId;
  }

  public getName(): string {
    return this._name;
  }

  public getDescription(): string {
    return this._description;
  }

  /** The latest version of the function. */
  public getLatestVersion(): number {
    return this._latestVersion;
  }

  /** The version currently serving traffic (the pinned version, or the latest if not pinned). */
  public getCurrentVersion(): number {
    return this._currentVersion;
  }

  /** When the function was last updated (ISO 8601). */
  public getLastUpdatedAt(): string {
    return this._lastUpdatedAt;
  }
}

/**
 * Metadata about a single version of a Momento Function, returned by `listFunctionVersions`.
 */
export class FunctionVersionInfo {
  private readonly _functionId: string;
  private readonly _version: number;
  private readonly _description: string;
  private readonly _wasmId: string;

  constructor(
    functionId: string,
    version: number,
    description: string,
    wasmId: string
  ) {
    this._functionId = functionId;
    this._version = version;
    this._description = description;
    this._wasmId = wasmId;
  }

  public getFunctionId(): string {
    return this._functionId;
  }

  public getVersion(): number {
    return this._version;
  }

  public getDescription(): string {
    return this._description;
  }

  public getWasmId(): string {
    return this._wasmId;
  }
}
