type DeviceWriteCb = (data: DMXData) => Promise<void>;

export type OutputDeviceId = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

export const isOutputDeviceId = (id: number): id is OutputDeviceId => {
  return [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].find((n) => n === id) !== undefined;
};

export type OutputDevice = {
  id: OutputDeviceId;
  write: DeviceWriteCb;
};

export type DevicesChangeCallback = ({}: {
  outputDevices: OutputDevice[];
}) => void;

export type DMXChannel = number;
export type DMXValue = number;

export type DMXData = Uint8Array;

let outputDevices: OutputDevice[] = [];
let deviceChangeCallbacks: DevicesChangeCallback[] = [];

export const dmxChannels = (): DMXChannel[] => {
  return Array(512)
    .fill(0)
    .map((_, i) => i + 1);
};

export const getDeviceIds = (): OutputDeviceId[] => {
  return outputDevices.map((dev) => dev.id);
};

export const registerDevice = (
  id: OutputDeviceId,
  write: DeviceWriteCb
): void => {
  if (outputDevices.find((d) => d.id === id) !== undefined) {
    throw new Error(`Device with id {id} already registered`);
  }

  console.log(`Registering device ${id}`);

  outputDevices.push({ id, write });
  deviceChangeCallbacks.forEach((cb) => cb({ outputDevices }));
};

export const unregisterDevice = (id: OutputDeviceId): void => {
  outputDevices = outputDevices.filter((d) => d.id !== id);
  deviceChangeCallbacks.forEach((cb) => cb({ outputDevices }));
};

export const addDevicesChangeCallback = (cb: DevicesChangeCallback): void => {
  deviceChangeCallbacks.push(cb);
  cb({ outputDevices });
};

export const removeDevicesChangeCallback = (
  cb: DevicesChangeCallback
): void => {
  deviceChangeCallbacks = deviceChangeCallbacks.filter((c) => c !== cb);
};

export const writeToDevice = (
  outputDeviceId: OutputDeviceId,
  data: DMXData
): Promise<void> => {
  const outputDevice = outputDevices.find((d) => d.id === outputDeviceId);

  if (outputDevice === undefined) {
    return Promise.reject();
  }

  return outputDevice.write(data);
};

export const validateDMXChannel = (n: DMXChannel): void => {
  if (n < 1) {
    throw new Error(`Channel ${n} is less than 1.`);
  }

  if (n > 512) {
    throw new Error(`Channel ${n} is greater than 512.`);
  }

  if (parseInt(n.toString()) !== n) {
    throw new Error(`Channel ${n} is not integer.`);
  }
};

export const validateDMXValue = (v: DMXValue): void => {
  if (v < 0) {
    throw new Error(`Value ${v} is less than 0.`);
  }

  if (v > 255) {
    throw new Error(`Value ${v} is greater than 255.`);
  }

  if (parseInt(v.toString()) !== v) {
    throw new Error(`Value ${v} is not integer.`);
  }
};
