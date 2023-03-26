import { FileHandle, open, readdir } from 'fs/promises';
import { clone, equals, map } from 'ramda';

import dmxlib from 'dmxnet';
import { ipcMain } from 'electron';
import midi from 'midi';

export interface ArtNetInputAddress {
  subnet: number;
  net: number;
  universe: number;
}

export interface LogicalDevices {
  status: { missingDevices: string[]; hasOutput: boolean };
  inputs: {
    midi: Record<string, string>;
    artNet: Record<string, ArtNetInputAddress>;
  };
  outputs: {
    mockDMX: Array<string>;
    artNet: Array<string>;
    linuxDMX: Record<string, number>;
  };
}

const logicalDevices: LogicalDevices = {
  status: { missingDevices: [], hasOutput: false },
  inputs: { midi: {}, artNet: {} },
  outputs: { mockDMX: [], artNet: [], linuxDMX: {} },
};

// Linux DMX Outputs ------------------

const getDevId = (devicePath: string): number =>
  parseInt(devicePath.replace('dmx', ''), 10);

interface OpenLinuxDmxDevice {
  path: string;
  id: number;
  handle: FileHandle;
}

let openedLinuxDmxDevices: OpenLinuxDmxDevice[] = [];

const findOutputLinuxDmxDevices = async (): Promise<void> => {
  console.log('Loading Linux output DMX devices....');

  const allDevices = await readdir('/dev');

  const tryDevices = allDevices
    .filter((d) => d.startsWith('dmx'))
    .filter(
      (dmxDevPath) =>
        openedLinuxDmxDevices.find((d) => d.path === dmxDevPath) === undefined
    )
    .map((dmxDevPath) =>
      open(`/dev/${dmxDevPath}`, 'w').then((handle) => ({
        handle,
        path: dmxDevPath,
        id: getDevId(dmxDevPath),
      }))
    );

  const results = await Promise.allSettled(tryDevices);

  (
    results.filter(
      (r) => r.status === 'fulfilled'
    ) as PromiseFulfilledResult<OpenLinuxDmxDevice>[]
  )
    .map((r) => r.value)
    .forEach((dev) => openedLinuxDmxDevices.push(dev));
};

const writeToLinuxDMXOutputDevice = (
  deviceId: number,
  dmxData: Uint8Array
): Promise<void> => {
  const device = openedLinuxDmxDevices.find((dev) => dev.id === deviceId);

  if (device) {
    return device.handle
      .write(dmxData)
      .then(() => {
        return undefined;
      })
      .catch((error) => {
        console.error(error);

        device.handle.close();

        openedLinuxDmxDevices = openedLinuxDmxDevices.filter(
          (d) => d.id !== deviceId
        );

        throw error;
      });
  }

  return Promise.reject();
};

// Midi Inputs -------------------
const midiInputDevice = new midi.Input();
const midiInputDevices: Record<string, midi.Input> = {};
let midiInputPortMap: Record<string, number> = {};
const openMidiInputPorts: string[] = [];
const midiEventTimeMap: Record<string, number> = {};

const midiInputCallbacks: Record<string, InputCallback> = {};

export type InputCallback = (
  message: any,
  messageTimestamp: number,
  deltaTime?: string | undefined
) => void;

const internalOpenMidiInput = (
  midiInputName: string,
  callback?: InputCallback | undefined
): void => {
  openMidiInputPorts.push(midiInputName);

  if (callback) {
    midiInputCallbacks[midiInputName] = callback;
  }

  if (
    midiInputDevices[midiInputName] === undefined &&
    midiInputPortMap[midiInputName] !== undefined
  ) {
    console.log(`Openning midi input port ${midiInputName}`);

    const input = new midi.Input();

    midiInputDevices[midiInputName] = input;

    input.openPort(midiInputPortMap[midiInputName]);

    input.on('message', (deltaTime, message) => {
      if (deltaTime === 0) {
        midiEventTimeMap[midiInputName] = new Date().getTime();
      } else if (midiEventTimeMap[midiInputName] === undefined) {
        midiEventTimeMap[midiInputName] =
          new Date().getTime() - deltaTime * 1000;
      } else {
        midiEventTimeMap[midiInputName] += deltaTime * 1000;
      }

      if (process.env.DEBUG_MIDI === 'true') {
        console.log({
          message,
          deltaTime,
          eventTime: midiEventTimeMap[midiInputName],
        });
      }

      if (midiInputCallbacks[midiInputName]) {
        midiInputCallbacks[midiInputName](
          message,
          midiEventTimeMap[midiInputName],
          deltaTime.toString()
        );
      }
    });
  }
};

const findMidiInputs = async (): Promise<void> => {
  console.log('Loading Midi inputs....');

  const midiInputPortCount = midiInputDevice.getPortCount();

  const oldMidiInputPortMap = midiInputPortMap;
  midiInputPortMap = {};

  for (let i = 0; i < midiInputPortCount; i += 1) {
    const portName = midiInputDevice.getPortName(i).toString();
    midiInputPortMap[portName] = i;
  }

  openMidiInputPorts.forEach((portName) => {
    if (midiInputPortMap[portName] !== undefined) {
      if (midiInputPortMap[portName] !== oldMidiInputPortMap[portName]) {
        midiInputDevices[portName].closePort();
        internalOpenMidiInput(portName);
      }
    } else {
      midiInputDevices[portName].closePort();
      delete midiInputDevices[portName];
    }
  });
};

// Mock Outputs ------------

const writeToMockOutput = (): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, 20));

// ArtNet Commom
// eslint-disable-next-line new-cap
const dmxnet = new dmxlib.dmxnet({
  sName: 'JSLC',
  lName: 'JS Light Control',
});

// ArtNet Input Devices ----------------
type ArtNetInputDevice = dmxlib.receiver;
type ArtNetInputCallback = (
  dmxData: Uint8Array,
  messageTimestamp: number
) => void;

const artNetReceivers: Record<number, ArtNetInputDevice> = {};
const artNetReceiverCallbacks: Record<number, ArtNetInputCallback> = {};

const internalOpenArtNetInput = (
  address: ArtNetInputAddress,
  callback: ArtNetInputCallback
) => {
  const { subnet, net, universe } = address;

  const artNetInputId =
    // eslint-disable-next-line no-bitwise
    ((subnet & 0xff) << 16) | ((net & 0xff) << 8) | (universe & 0xff);

  artNetReceiverCallbacks[artNetInputId] = callback;

  if (artNetReceivers[artNetInputId] === undefined) {
    const receiver = dmxnet.newReceiver({ subnet, net, universe });
    artNetReceivers[artNetInputId] = receiver;

    let prevData: unknown;

    artNetReceivers[artNetInputId].on('data', (data) => {
      if (!equals(prevData, data)) {
        prevData = data;

        if (artNetReceiverCallbacks[artNetInputId]) {
          artNetReceiverCallbacks[artNetInputId](data, new Date().getTime());
        }
      }
    });
  } else {
    callback(
      new Uint8Array(artNetReceivers[artNetInputId].values),
      new Date().getTime()
    );
  }
};

// ArtNet Output Devices -------------
// TODO

// All I/O Related -------------------

const findConnectedDevices = async (): Promise<void> => {
  await findOutputLinuxDmxDevices();
  await findMidiInputs();
};

export interface LogicalDeviceIds {
  dmxOutputs: string[];
  midiInputs: string[];
  dmxInputs: string[];
}

export const getLogicalDevicesIds = (): LogicalDeviceIds => {
  return {
    midiInputs: Object.keys(logicalDevices.inputs.midi).filter(
      (id) => !logicalDevices.status.missingDevices.includes(id)
    ),
    dmxInputs: Object.keys(logicalDevices.inputs.artNet),
    dmxOutputs: [
      ...Object.keys(logicalDevices.outputs.linuxDMX).filter(
        (id) => !logicalDevices.status.missingDevices.includes(id)
      ),
      ...logicalDevices.outputs.artNet,
      ...logicalDevices.outputs.mockDMX,
    ],
  };
};

export interface LogicalDevicesInfo {
  linuxDMXOutputs: Record<string, number>;
  mockDMXOutputs: string[];
  midiInputs: Record<string, string>;
  artNetInputs: Record<string, ArtNetInputAddress>;
}

export const getLogicalDevicesInfo = (): LogicalDevicesInfo => {
  return {
    mockDMXOutputs: logicalDevices.outputs.mockDMX,
    linuxDMXOutputs: logicalDevices.outputs.linuxDMX,
    midiInputs: logicalDevices.inputs.midi,
    artNetInputs: map(
      (artNetInput) => ({
        subnet: artNetInput.subnet,
        net: artNetInput.net,
        universe: artNetInput.universe,
      }),
      logicalDevices.inputs.artNet
    ),
  };
};

export const getLogicalDevicesStatus = (): LogicalDevices['status'] =>
  clone(logicalDevices.status);

type ChangeLogicalDevicesCallback = (
  info: LogicalDevicesInfo,
  status: LogicalDevices['status']
) => void;

let changeLogicalDevicesCallbacks: ChangeLogicalDevicesCallback[] = [];

export const addChangeLogicalDevicesCallback = (
  callback: ChangeLogicalDevicesCallback
): void => {
  changeLogicalDevicesCallbacks.push(callback);
};

export const removeChangeLogicalDevicesCallback = (
  callback: ChangeLogicalDevicesCallback
): void => {
  changeLogicalDevicesCallbacks = changeLogicalDevicesCallbacks.filter(
    (c) => c !== callback
  );
};

const updateLogicalDevicesStatus = (): void => {
  const missingDevices: string[] = [];

  let hasOutput = logicalDevices.outputs.mockDMX.length > 0;

  Object.keys(logicalDevices.outputs.linuxDMX).forEach((deviceId) => {
    const linuxDMXOutputDeviceId = logicalDevices.outputs.linuxDMX[deviceId];

    const openedLinuxDmxDevice = openedLinuxDmxDevices.find(
      (dev) => dev.id === linuxDMXOutputDeviceId
    );

    if (openedLinuxDmxDevice) {
      hasOutput = true;
    } else {
      missingDevices.push(deviceId);
    }
  });

  Object.keys(logicalDevices.inputs.midi).forEach((midiInputId) => {
    const midiInputName = logicalDevices.inputs.midi[midiInputId];

    if (midiInputPortMap[midiInputName] === undefined) {
      missingDevices.push(midiInputId);
    }
  });

  logicalDevices.status = { missingDevices, hasOutput };

  changeLogicalDevicesCallbacks.forEach((cb) =>
    cb(getLogicalDevicesInfo(), getLogicalDevicesStatus())
  );
};

export const setLogicalDevicesInfo = (newInfo: LogicalDevicesInfo): void => {
  logicalDevices.outputs.mockDMX = clone(newInfo.mockDMXOutputs);
  logicalDevices.outputs.linuxDMX = clone(newInfo.linuxDMXOutputs);
  logicalDevices.inputs.midi = clone(newInfo.midiInputs);
  logicalDevices.inputs.artNet = clone(newInfo.artNetInputs);
  updateLogicalDevicesStatus();
};

export const writeToDmxOutputDevice = async (
  deviceId: string,
  dmxData: Uint8Array
): Promise<void> => {
  const linuxDMXDevice = logicalDevices.outputs.linuxDMX[deviceId];

  if (linuxDMXDevice !== undefined) {
    try {
      await writeToLinuxDMXOutputDevice(linuxDMXDevice, dmxData);
    } catch (error) {
      updateLogicalDevicesStatus();
      throw error;
    }

    return;
  }

  const mockDmxDevice = logicalDevices.outputs.mockDMX.filter(
    (id) => id === deviceId
  )[0];

  if (mockDmxDevice !== undefined) {
    await writeToMockOutput();
  }
};

export const openInput = (inputId: string, callback: InputCallback): void => {
  if (
    logicalDevices.status.missingDevices.find((d) => d === inputId) !==
    undefined
  ) {
    return undefined;
  }

  const midiInput = logicalDevices.inputs.midi[inputId];

  if (midiInput) {
    internalOpenMidiInput(midiInput, callback);
    return undefined;
  }

  const artNetInput = logicalDevices.inputs.artNet[inputId];

  if (artNetInput) {
    internalOpenArtNetInput(artNetInput, callback);
  }

  return undefined;
};

export const closeDevices = (): Promise<void> => {
  openedLinuxDmxDevices.forEach((dev) => dev.handle.close());
  openedLinuxDmxDevices = [];

  return Promise.resolve();
};

export const initDeviceBridge = async () => {
  await findConnectedDevices();
};

// User Interface Messaging

export interface IOState {
  requestId: string;
  info: LogicalDevicesInfo;
  status: LogicalDevices['status'];
  connectedDevices: {
    inputs: {
      midi: string[];
    };
    outputs: {
      linuxDMX: string[];
    };
  };
}

const replyIOState = (
  event: Electron.IpcMainEvent,
  requestId: unknown
): void => {
  const ioState: IOState = {
    requestId: requestId as string,
    info: getLogicalDevicesInfo(),
    status: getLogicalDevicesStatus(),
    connectedDevices: {
      inputs: {
        midi: Object.keys(midiInputPortMap),
      },
      outputs: {
        linuxDMX: openedLinuxDmxDevices.map((d) => d.id.toString()),
      },
    },
  };

  event.reply('io-state', ioState);
};

ipcMain.on('get-io-state', (event: Electron.IpcMainEvent, requestId): void => {
  findConnectedDevices()
    .then(() => replyIOState(event, requestId))
    .catch(console.error);
});

ipcMain.on(
  'set-io',
  (event: Electron.IpcMainEvent, requestId, eventInfo): void => {
    const logicalDevicesInfo = eventInfo as LogicalDevicesInfo;
    setLogicalDevicesInfo(logicalDevicesInfo);
    replyIOState(event, requestId);
  }
);
