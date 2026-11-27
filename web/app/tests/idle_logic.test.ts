import { describe, it, expect } from 'vitest';
import { idleTick, IDLE_MS, IDLE_BUFFER_MS, IDLE_REPEAT_MS } from '../src/lib/idle.logic';

const base = {
  now: 100_000,
  lastActivity: 0,
  lastIdleAt: 0,
  lastIdleStart: 0,
  bubbleUp: false,
};

describe('idleTick', () => {
  it('pauses while a bubble is already up', () => {
    expect(idleTick({ ...base, bubbleUp: true })).toBe('pause');
  });

  it('waits until the user has been quiet for IDLE_MS', () => {
    expect(idleTick({ ...base, lastActivity: base.now - IDLE_MS + 1 })).toBe(
      'wait'
    );
    expect(idleTick({ ...base, lastActivity: base.now - IDLE_MS })).toBe('fire');
  });

  it('waits out the buffer after the last idle line', () => {
    expect(
      idleTick({
        ...base,
        lastActivity: base.now - IDLE_MS,
        lastIdleAt: base.now - IDLE_BUFFER_MS + 1,
      })
    ).toBe('wait');
  });

  it('waits before repeating an idle line', () => {
    expect(
      idleTick({
        ...base,
        lastActivity: base.now - IDLE_MS,
        lastIdleAt: base.now - IDLE_BUFFER_MS,
        lastIdleStart: base.now - IDLE_REPEAT_MS + 1,
      })
    ).toBe('wait');
    expect(
      idleTick({
        ...base,
        lastActivity: base.now - IDLE_MS,
        lastIdleAt: base.now - IDLE_BUFFER_MS,
        lastIdleStart: base.now - IDLE_REPEAT_MS,
      })
    ).toBe('fire');
  });
});
