import { v4 as uuidV4 } from 'uuid';
import type { LogicalDeviceIds } from '../../../main/devices-bridge';

export type Devices = LogicalDeviceIds;
export type DmxOutputDevice = LogicalDeviceIds['dmxOutputs'][0];

export type DevicesFoundCallback = (devices: LogicalDeviceIds) => void;
let devicesFoundCallbacks: Array<DevicesFoundCallback> = [];
let devices: LogicalDeviceIds | undefined;

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
  dmxOutputDevice: DmxOutputDevice,
  data: Uint8Array
) => void;

let valuesCallbacks: Array<ValuesCallback> = [];

export const addValuesCallback = (cb: ValuesCallback): void => {
  valuesCallbacks.push(cb);
};

export const removeValuesCallback = (cb: ValuesCallback): void => {
  valuesCallbacks = valuesCallbacks.filter((c) => c !== cb);
};

window.electron.ipcRenderer.on('devices-found', (eventDevices): void => {
  const currentDevices = eventDevices as LogicalDeviceIds;
  devices = currentDevices;

  devicesFoundCallbacks.forEach((dvc) => dvc(currentDevices));
});

window.electron.ipcRenderer.requestDevices(uuidV4());

interface DmxDataDone {
  dmxOutputDevice: DmxOutputDevice;
  dmxData: number[];
}

window.electron.ipcRenderer.on('dmx-data-done', (eventDmxData): void => {
  const { dmxOutputDevice, dmxData } = eventDmxData as DmxDataDone;

  valuesCallbacks.forEach((cb) => cb(dmxOutputDevice, new Uint8Array(dmxData)));
});
