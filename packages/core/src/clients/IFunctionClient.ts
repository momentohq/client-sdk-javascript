import {
  DeleteFunction,
  ListFunctions,
  ListFunctionVersions,
  PutFunction,
} from '../messages/responses/function';

/**
 * Options for a {@link IFunctionClient.putFunction} request.
 */
export interface PutFunctionOptions {
  /** A human-readable description stored alongside the function. */
  description?: string;
  /** Non-secret environment variables made available to the function at runtime. */
  environmentVariables?: Record<string, string>;
}

export interface IFunctionClient {
  putFunction(
    cacheName: string,
    functionName: string,
    wasmBytes: Uint8Array,
    options?: PutFunctionOptions
  ): Promise<PutFunction.Response>;
  deleteFunction(
    cacheName: string,
    functionName: string
  ): Promise<DeleteFunction.Response>;
  listFunctions(cacheName: string): Promise<ListFunctions.Response>;
  listFunctionVersions(
    functionId: string
  ): Promise<ListFunctionVersions.Response>;
  close(): void;
}
