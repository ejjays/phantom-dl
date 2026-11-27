import { describe, it, expect, vi, beforeEach } from 'vitest';
import { spawn } from 'node:child_process';
import { streamDownload } from '../../src/services/ytdlp/streamer.js';
import { createMockChildProcess } from '../utils/mocks.js';

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

vi.mock('../../src/services/ytdlp/info.js', () => ({
  getVideoInfo: vi.fn(() =>
    Promise.resolve({
      id: 'testRotation',
      title: 'Client Rotation Test',
      formats: [
        {
          formatId: '140',
          url: 'https://rr1.googlevideo.com/test',
          vcodec: 'none',
          acodec: 'mp4a.40.2',
          ext: 'mp4',
        },
      ],
      targetUrl: 'https://www.youtube.com/watch?v=testRotation',
    })
  ),
}));

vi.mock('../../src/utils/network/proxy.util.js', () => ({
  getProxiedStream: vi.fn(() => {
    throw new Error('mock: direct fetch unavailable');
  }),
}));

const mockedSpawn = vi.mocked(spawn);
function withStdio(mock: ReturnType<typeof createMockChildProcess>) {
  mock.stdio = [mock.stdin, mock.stdout, mock.stderr] as never;
  return mock;
}
const okMock = () => withStdio(createMockChildProcess({ exitCode: 0 }));
const failMock = () => {
  const mock = withStdio(createMockChildProcess({ exitCode: 1 }));
  const on = mock.on.bind(mock);
  mock.on = ((event: string, listener: (...args: unknown[]) => void) => {
    const result = on(event, listener);
    if (event === 'close') {
      queueMicrotask(() => {
        mock.stderr?.write('ERROR: HTTP Error 403: Forbidden');
        mock.emit('close', 1);
      });
    }
    return result;
  }) as never;
  return mock;
};
const ytdlpQueue: ReturnType<typeof createMockChildProcess>[] = [];

function clientsFromCalls(): string[] {
  return mockedSpawn.mock.calls
    .map((call) => {
      const args = call[1] as string[];
      return args.find((arg) => arg.includes('player-client='))?.split('=')[1];
    })
    .filter((client): client is string => Boolean(client));
}

async function waitForClients(count: number): Promise<string[]> {
  const deadline = Date.now() + 5000;
  while (Date.now() < deadline) {
    const clients = clientsFromCalls();
    if (clients.length >= count) return clients;
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
  return clientsFromCalls();
}

describe('YouTube Client Rotation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    ytdlpQueue.length = 0;
    mockedSpawn.mockImplementation(((cmd: string | URL) =>
      String(cmd) === 'ffmpeg'
        ? okMock()
        : (ytdlpQueue.shift() ?? okMock())) as never);
  });

  it('uses tv as first client', async () => {
    ytdlpQueue.push(okMock());

    streamDownload('https://www.youtube.com/watch?v=testRotation', {
      format: 'mp3',
    });

    expect(await waitForClients(1)).toEqual(['tv']);
  });

  it('rotates to next client on failure', async () => {
    ytdlpQueue.push(failMock(), failMock(), okMock());

    streamDownload('https://www.youtube.com/watch?v=testRotation', {
      format: 'mp3',
    });

    expect(await waitForClients(3)).toEqual(['tv', 'android_vr', 'mweb']);
  });

  it('includes all expected clients in rotation order', async () => {
    ytdlpQueue.push(failMock(), failMock(), failMock(), failMock(), okMock());

    streamDownload('https://www.youtube.com/watch?v=testRotation', {
      format: 'mp3',
    });

    const clients = await waitForClients(5);
    expect(clients.slice(0, 4)).toEqual([
      'tv',
      'android_vr',
      'mweb',
      'web_embedded',
    ]);
  });
});
