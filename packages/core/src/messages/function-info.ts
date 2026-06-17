/**
 * Metadata about a Momento Function, returned by `listFunctions`.
 */
export class FunctionInfo {
  private readonly _functionId: string;
  private readonly _name: string;
  private readonly _description: string;
  private readonly _latestVersion: number;

  constructor(
    functionId: string,
    name: string,
    description: string,
    latestVersion: number
  ) {
    this._functionId = functionId;
    this._name = name;
    this._description = description;
    this._latestVersion = latestVersion;
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

  public getLatestVersion(): number {
    return this._latestVersion;
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
