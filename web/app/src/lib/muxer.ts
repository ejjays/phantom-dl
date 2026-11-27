import {
  muxToMp4 as packageMuxToMp4,
  isClientMuxSupported,
  type MuxOptions,
  type MuxProgress,
} from '@phantom/web-mux';

export type { MuxOptions, MuxProgress };

export { isClientMuxSupported };

export function muxToMp4(options: MuxOptions): Promise<Blob> {
  return packageMuxToMp4({
    ...options,
    workerUrl:
      options.workerUrl ?? new URL('@phantom/web-mux/worker', import.meta.url),
    filePrefix: options.filePrefix ?? 'phantom-mux',
  });
}
