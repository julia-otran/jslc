import { Channels } from '../main/preload';
import { EngineLocalConnInputMessage } from '../engine-types';

declare global {
  interface Window {
    electron: {
      ipcRenderer: {
        requestLocalConnValue(connectorKey: string): void;
        localConn(data: EngineLocalConnInputMessage): void;
        requestDevices(requestId: string): void;
        writeDMX(requestId: string, devId: number, data: Uint8Array): void;
        enableMidiInput(requestId: string, midiInputId: number): void;
        on(
          channel: string,
          func: (...args: unknown[]) => void
        ): (() => void) | undefined;
        once(channel: string, func: (...args: unknown[]) => void): void;
      };
    };
  }
}

export {};
