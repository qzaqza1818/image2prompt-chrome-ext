import { vi, beforeEach } from 'vitest';

const storageSyncData: Record<string, unknown> = {};
const storageSessionData: Record<string, unknown> = {};

global.chrome = {
  storage: {
    sync: {
      get: vi.fn(async (keys: string | string[]) => {
        const k = Array.isArray(keys) ? keys : [keys];
        return Object.fromEntries(k.map((key) => [key, storageSyncData[key]]));
      }),
      set: vi.fn(async (items: Record<string, unknown>) => {
        Object.assign(storageSyncData, items);
      }),
    },
    session: {
      get: vi.fn(async (keys: string | string[]) => {
        const k = Array.isArray(keys) ? keys : [keys];
        return Object.fromEntries(k.map((key) => [key, storageSessionData[key]]));
      }),
      set: vi.fn(async (items: Record<string, unknown>) => {
        Object.assign(storageSessionData, items);
      }),
    },
    onChanged: {
      addListener: vi.fn(),
      removeListener: vi.fn(),
    },
  },
  contextMenus: {
    create: vi.fn(),
    onClicked: { addListener: vi.fn() },
  },
  runtime: {
    onMessage: { addListener: vi.fn() },
    onInstalled: { addListener: vi.fn() },
    sendMessage: vi.fn(),
  },
  sidePanel: {
    open: vi.fn(),
  },
} as unknown as typeof chrome;

// Reset storage between tests
beforeEach(() => {
  for (const key of Object.keys(storageSyncData)) delete storageSyncData[key];
  for (const key of Object.keys(storageSessionData)) delete storageSessionData[key];
  vi.clearAllMocks();
});
