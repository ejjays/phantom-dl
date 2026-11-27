import { describe, it, expect, vi } from 'vitest';
import { spawn } from 'node:child_process';
import { streamDownload } from '../../src/services/ytdlp/streamer.js';
import { createMockChildProcess } from '../utils/mocks.js';

// stale nsig = throttled, so cache reuse stays off

vi.mock('node:child_process', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:child_process')>();
  return {
    ...actual,
    spawn: vi.fn(),
    execFile: vi.fn(
      (
        _c: string,
        _a: string[],
        _o: unknown,
        cb?: (...args: unknown[]) => void
      ) => {
        if (cb) {
          cb(new Error('mock'), '', '');
        }
        return { stdout: '', stderr: '' };
      }
    ),
  };
});

vi.mock('../../src/services/extractors/index.js', () => ({
  getExtractor: vi.fn(() => null),
  shouldJSStream: vi.fn(() => false),
}));

const VIDEO_ID = 'fmtMismatch';
const STREAM_URL = `https://www.youtube.com/watch?v=${VIDEO_ID}`;

const info = {
  id: VIDEO_ID,
  extractorKey: 'youtube',
  webpageUrl: STREAM_URL,
  targetUrl: STREAM_URL,
  formats: [
    {
      formatId: '18',
      vcodec: 'avc1.42001E',
      acodec: 'mp4a.40.2',
      ext: 'mp4',
    },
  ],
} as unknown as Parameters<typeof streamDownload>[3];

describe('streamer disk-cache gate', () => {
  it('never passes --load-info-json while cache reuse is disabled', async () => {
    vi.mocked(spawn).mockReturnValue(createMockChildProcess());

    streamDownload(STREAM_URL, { format: 'mp4', formatId: '18' }, [], info);

    const ytdlpCall = await vi.waitFor(() => {
      const call = vi
        .mocked(spawn)
        .mock.calls.find((candidate) => candidate[0] === 'yt-dlp');
      expect(call).toBeDefined();
      return call;
    });

    expect(ytdlpCall[1]).not.toContain('--load-info-json');
  });
});
