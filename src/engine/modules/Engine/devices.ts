import {
  DMXChannel,
  DMXData,
  DmxOutputDeviceId,
  InputDeviceId,
} from '../../../engine-types';

type DeviceWriteCb = (data: DMXData) => Promise<void>;
type DeviceReadCb<TData> = () => TData;

export type DmxOutputDevice = {
  id: DmxOutputDeviceId;
  write: DeviceWriteCb;
};

export type InputDevice<TData> = {
  id: InputDeviceId;
  read: DeviceReadCb<TData>;
};

export type DevicesChangeCallback = ({
  dmxOutputDeviceIds,
  inputDeviceIds,
}: {
  dmxOutputDeviceIds: DmxOutputDeviceId[];
  inputDeviceIds: InputDeviceId[];
}) => void;

let dmxOutputDevices: DmxOutputDevice[] = [];
let inputDevices: InputDevice<any>[] = [];

let deviceChangeCallbacks: DevicesChangeCallback[] = [];

export const dmxChannels = (): DMXChannel[] => {
  return Array(512)
    .fill(0)
    .map((_, i) => i + 1);
};

export const getDmxOutputDeviceIds = (): DmxOutputDeviceId[] => {
  return dmxOutputDevices.map((dev) => dev.id);
};

const triggerChangeCallbacks = (): void => {
  deviceChangeCallbacks.forEach((cb) =>
    cb({
      dmxOutputDeviceIds: dmxOutputDevices.map((d) => d.id),
      inputDeviceIds: inputDevices.map((d) => d.id),
    })
  );
};

export const registerDmxOutputDevice = (
  id: DmxOutputDeviceId,
  write: DeviceWriteCb
): void => {
  if (dmxOutputDevices.find((d) => d.id === id) !== undefined) {
    throw new Error(`DMX output device with id {id} already registered`);
  }

  console.log(`Registering output dmx device ${id}`);

  dmxOutputDevices.push({ id, write });

  triggerChangeCallbacks();
};

export const unregisterDmxOutputDevice = (id: DmxOutputDeviceId): void => {
  dmxOutputDevices = dmxOutputDevices.filter((d) => d.id !== id);

  triggerChangeCallbacks();
};

export const clearDevicesChangeCallbacks = () => {
  deviceChangeCallbacks = [];
};

export const addDevicesChangeCallback = (cb: DevicesChangeCallback): void => {
  deviceChangeCallbacks.push(cb);

  triggerChangeCallbacks();
};

export const removeDevicesChangeCallback = (
  cb: DevicesChangeCallback
): void => {
  deviceChangeCallbacks = deviceChangeCallbacks.filter((c) => c !== cb);
};

export const writeToDmxDevice = (
  dmxOutputDeviceId: DmxOutputDeviceId,
  data: DMXData
): Promise<void> => {
  const dmxOutputDevice = dmxOutputDevices.find(
    (d) => d.id === dmxOutputDeviceId
  );

  if (dmxOutputDevice === undefined) {
    return Promise.reject();
  }

  return dmxOutputDevice.write(data);
};

export const getInputDeviceIds = (): Array<InputDeviceId> =>
  inputDevices.map((d) => d.id);

export const registerInputDevice = <TData = any>(
  id: InputDeviceId,
  read: DeviceReadCb<TData>
): void => {
  if (inputDevices.find((d) => d.id === id) !== undefined) {
    throw new Error(`Input device with id {id} already registered`);
  }

  console.log(`Registering input device ${id}`);

  inputDevices.push({ id, read });

  triggerChangeCallbacks();
};

export const unregisterInputDevice = (id: InputDeviceId): void => {
  inputDevices = inputDevices.filter((d) => d.id !== id);

  triggerChangeCallbacks();
};

export const readFromInputDevice = <TData>(
  inputDeviceId: InputDeviceId
): TData | undefined => {
  const inputDevice = inputDevices.find((d) => d.id === inputDeviceId);

  if (inputDevice === undefined) {
    return undefined;
  }

  return inputDevice.read();
};
