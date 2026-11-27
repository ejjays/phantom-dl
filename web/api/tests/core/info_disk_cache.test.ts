import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { spawn } from 'node:child_process';
import { EventEmitter } from 'node:events';
import { PassThrough } from 'node:stream';
import fs from 'node:fs';
import path from 'node:path';
import { CACHE_DIR } from '../../src/services/ytdlp/config.js';
import { runYtdlpInfo } from '../../src/services/ytdlp/info.js';

// optimize subsequent stream spawn

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
        if (cb) cb(new Error('mock'), '', '');
        return { stdout: '', stderr: '' };
      }
    ),
  };
});

vi.mock('../../src/services/extractors/index.js', () => ({
  getExtractor: vi.fn(() => null),
  shouldJSStream: vi.fn(() => false),
}));

const META_DIR = path.join(CACHE_DIR, 'metadata');

// avoid regex truncation in tests
const PERSIST_ID = 'dQw4w9WgXcQ';
const PERSIST_FILE = path.join(META_DIR, `${PERSIST_ID}.json`);

const FAKE_YTDLP_JSON = {
  id: PERSIST_ID,
  title: 'Disk Cache Test',
  uploader: 'Test',
  formats: [
    {
      format_id: '137',
      url: 'https://cdn.example.com/v.mp4',
      vcodec: 'avc1.640028',
      acodec: 'mp4a.40.2',
      ext: 'mp4',
    },
  ],
};

function makeYtdlpInfoProcess(stdoutPayload: string) {
  const proc = new EventEmitter() as unknown as Record<string, unknown> & {
    stdout: PassThrough;
    stderr: PassThrough;
  };
  proc.stdout = new PassThrough();
  proc.stderr = new PassThrough();
  proc.pid = 99999;
  proc.exitCode = null as number | null;
  setImmediate(() => {
    proc.stdout.write(stdoutPayload);
    proc.stdout.end();
    proc.stderr.end();
    (proc as unknown as EventEmitter).emit('close', 0);
  });
  return proc as unknown as ReturnType<typeof spawn>;
}

describe('runYtdlpInfo — disk JSON persistence', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    if (fs.existsSync(PERSIST_FILE)) fs.unlinkSync(PERSIST_FILE);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    if (fs.existsSync(PERSIST_FILE)) fs.unlinkSync(PERSIST_FILE);
  });

  it('writes raw yt-dlp JSON to CACHE_DIR/metadata/<id>.json on success', async () => {
    const rawJson = JSON.stringify(FAKE_YTDLP_JSON);
    vi.mocked(spawn).mockImplementation(
      () => makeYtdlpInfoProcess(rawJson) as never
    );

    const info = await runYtdlpInfo(
      `https://www.youtube.com/watch?v=${PERSIST_ID}`,
      []
    );

    expect(info.id).toBe(PERSIST_ID);

    // allow filesystem persistence
    await vi.waitFor(() => {
      expect(fs.existsSync(PERSIST_FILE)).toBe(true);
    });

    const persisted = fs.readFileSync(PERSIST_FILE, 'utf8');
    expect(JSON.parse(persisted).id).toBe(PERSIST_ID);
  });

  it('skips persistence gracefully when id is missing', async () => {
    const rawJson = JSON.stringify({ ...FAKE_YTDLP_JSON, id: '' });
    vi.mocked(spawn).mockImplementation(
      () => makeYtdlpInfoProcess(rawJson) as never
    );

    const info = await runYtdlpInfo(
      'https://www.youtube.com/watch?v=noIdTest11',
      []
    );

    expect(info.title).toBe('Disk Cache Test');
  });
});
