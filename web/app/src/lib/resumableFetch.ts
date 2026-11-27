export {
  resumableFetchToSink,
  ResumeNotSupportedError,
  SizeMismatchError,
  FetchIncompleteError as EdgeFetchIncompleteError,
  type ResumableFetchOptions,
  type ResumableFetchResult,
} from '@phantom/web-mux';

export interface MinimalResponse {
  ok: boolean;
  status: number;
  headers: { get(name: string): string | null };
  body: ReadableStream<Uint8Array> | null;
}

export type FetchLike = (
  url: string,
  init: { signal?: AbortSignal; headers?: Record<string, string> }
) => Promise<MinimalResponse>;
