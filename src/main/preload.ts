import { IpcRendererEvent, contextBridge, ipcRenderer } from 'electron';

import { EngineLocalConnInputMessage } from '../engine-types';
import type { LogicalDevicesInfo } from './devices-bridge';

export type Channels =
  | 'dmx-data-done'
  | 'devices-found'
  | 'local-conn'
  | 'io-state'
  | 'navigate'
  | 'engine-code';

export type IPCRenderer = {
  requestEngineCode(): void;
  engineCodeUpdate(data: string): void;
  requestLocalConnValue(connectorKey: string): void;
  localConn(data: EngineLocalConnInputMessage): void;
  requestDevices(requestId: string): void;
  getIOState(requestId: string): void;
  setIO(requestId: string, info: LogicalDevicesInfo): void;
  on(channel: Channels, func: (...args: unknown[]) => void): () => void;
  once(channel: Channels, func: (...args: unknown[]) => void): void;
};

export type RendererElectron = {
  ipcRenderer: IPCRenderer;
};

const electronBridge: RendererElectron = {
  ipcRenderer: {
    requestEngineCode() {
      ipcRenderer.send('request-engine-code');
    },
    engineCodeUpdate(data: string) {
      ipcRenderer.send('engine-code-update', data);
    },
    requestLocalConnValue(connectorKey: string) {
      ipcRenderer.send('request-local-conn-value', connectorKey);
    },
    localConn(data: EngineLocalConnInputMessage) {
      ipcRenderer.send('local-conn', data);
    },
    requestDevices(requestId: string) {
      ipcRenderer.send('request-devices', requestId);
    },
    getIOState(requestId: string) {
      ipcRenderer.send('get-io-state', requestId);
    },
    setIO(requestId: string, info: LogicalDevicesInfo) {
      ipcRenderer.send('set-io', requestId, info);
    },
    on(channel: Channels, func: (...args: unknown[]) => void) {
      const subscription = (_event: IpcRendererEvent, ...args: unknown[]) => {
        func(...args);
      };
      ipcRenderer.on(channel, subscription);

      return () => ipcRenderer.removeListener(channel, subscription);
    },
    once(channel: Channels, func: (...args: unknown[]) => void) {
      ipcRenderer.once(channel, (_event, ...args) => func(...args));
    },
  },
};

contextBridge.exposeInMainWorld('electron', electronBridge);
