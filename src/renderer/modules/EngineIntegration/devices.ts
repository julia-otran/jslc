import { v4 as uuidV4 } from 'uuid';

export interface Devices {
  requestId: string;
  inputs: {
    midi: Array<{
      name: string;
      id: number;
    }>;
  };
  outputs: {
    linuxDMX: Array<number>;
    local: Array<number>;
  };
}

export type DevicesFoundCallback = (devices: Devices) => void;
let devicesFoundCallbacks: Array<DevicesFoundCallback> = [];
let devices: Devices | undefined = undefined;

export const addDevicesFoundCallback = (fn: DevicesFoundCallback): void => {
  devicesFoundCallbacks.push(fn);

  if (devices) {
    fn(devices);
  }
};

export const removeDevicesFoundCallback = (fn: DevicesFoundCallback): void => {
  devicesFoundCallbacks = devicesFoundCallbacks.filter((f) => f !== fn);
};

export type ValuesCallback = (
  dmxOutputDevice: number,
  data: Uint8Array
) => void;

let valuesCallbacks: Array<ValuesCallback> = [];

export const addValuesCallback = (cb: ValuesCallback): void => {
  valuesCallbacks.push(cb);
};

export const removeValuesCallback = (cb: ValuesCallback): void => {
  valuesCallbacks = valuesCallbacks.filter((c) => c !== cb);
};

window.electron.ipcRenderer.on('devices-found', (dvs: Devices): void => {
  devices = dvs;
  devicesFoundCallbacks.forEach((dvc) => dvc(devices));
});

window.electron.ipcRenderer.requestDevices(uuidV4());

interface DmxDataDone {
  dmxOutputDevice: number;
  dmxData: number[];
}

window.electron.ipcRenderer.on(
  'dmx-data-done',
  ({ dmxOutputDevice, dmxData }: DmxDataDone): void => {
    valuesCallbacks.forEach((cb) => cb(dmxOutputDevice, dmxData));
  }
);
