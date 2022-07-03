import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';

export type Channels = 'dmx-data-done' | 'devices-found';

contextBridge.exposeInMainWorld('electron', {
  ipcRenderer: {
    requestDevices(requestId: string) {
      ipcRenderer.send('load-devices', requestId);
    },
    enableMidiInput(requestId: string, midiInputId: number) {
      ipcRenderer.send('enable-midi-input', requestId, midiInputId);
    },
    writeDMX(requestId: string, devId: number, data: Uint8Array) {
      if (data.length !== 512) {
        console.error(
          'Write DMX called with invalid data size. It will be ignored.'
        );
      } else {
        ipcRenderer.send('dmx-data', requestId, devId, data);
      }
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
