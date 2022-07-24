import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';
import { EngineLocalConnInputMessage } from '../engine-types';

export type Channels = 'dmx-data-done' | 'devices-found' | 'local-conn';

contextBridge.exposeInMainWorld('electron', {
  ipcRenderer: {
    requestLocalConnValue(connectorKey: string) {
      ipcRenderer.send('request-local-conn-value', connectorKey);
    },
    localConn(data: EngineLocalConnInputMessage) {
      ipcRenderer.send('local-conn', data);
    },
    requestDevices(requestId: string) {
      ipcRenderer.send('request-devices', requestId);
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
});
