import { beforeEach, describe, expect, it, vi } from 'vitest';

const connect = vi.fn();
const disconnect = vi.fn();
const emit = vi.fn();
const once = vi.fn((event: string, cb: () => void) => {
  if (event === 'connect') cb();
});

const socketMock = {
  connected: false,
  connect,
  disconnect,
  emit,
  once,
};

vi.mock('socket.io-client', () => ({
  io: vi.fn(() => socketMock),
}));

describe('socket helpers', () => {
  beforeEach(() => {
    vi.resetModules();
    connect.mockClear();
    disconnect.mockClear();
    emit.mockClear();
    once.mockClear();
    socketMock.connected = false;
  });

  it('creates singleton socket and returns same instance', async () => {
    const { getSocket } = await import('../../lib/socket');

    const a = getSocket();
    const b = getSocket();

    expect(a).toBe(b);
  });

  it('connectToVenue connects and emits join event', async () => {
    const { connectToVenue } = await import('../../lib/socket');

    connectToVenue('venue-1');

    expect(connect).toHaveBeenCalled();
    expect(once).toHaveBeenCalledWith('connect', expect.any(Function));
    expect(emit).toHaveBeenCalledWith('join:venue', 'venue-1');
  });

  it('disconnectSocket disconnects active socket and resets instance', async () => {
    const { getSocket, disconnectSocket } = await import('../../lib/socket');

    getSocket();
    socketMock.connected = true;
    disconnectSocket();

    expect(disconnect).toHaveBeenCalled();
  });
});
