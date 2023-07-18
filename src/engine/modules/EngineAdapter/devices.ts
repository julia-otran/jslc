import {
  DMXData,
  DmxOutputDeviceId,
  EngineDevicesInputMessage,
  EngineInputDataInputMessage,
  EngineInputDataInputMessageData,
  EngineInputMessageNames,
  EngineOutputMessageNames,
  EngineWriteToDeviceDoneInputMessage,
  EngineWriteToDeviceOutputMessage,
  InputDeviceId,
} from '../../../engine-types';
import {
  getDmxOutputDeviceIds,
  getInputDeviceIds,
  registerDmxOutputDevice,
  registerInputDevice,
  unregisterDmxOutputDevice,
  unregisterInputDevice,
} from '../Engine';
import { registerMessageListener, sendMessage } from './messaging';

import { v4 as uuidV4 } from 'uuid';

interface RegisteredInputDevices {
  midi: string[];
  dmx: string[];
}

let registeredDmxOutputDevices: DmxOutputDeviceId[] = [];
const registeredInputDevices: RegisteredInputDevices = { midi: [], dmx: [] };

const inputQueue: Record<string, Array<EngineInputDataInputMessageData>> = {};

registerMessageListener<EngineInputDataInputMessage>(
  EngineInputMessageNames.INPUT_DATA,
  (message) => {
    const { inputId } = message;

    if (inputQueue[inputId] === undefined) {
      inputQueue[inputId] = [];
    }

    inputQueue[inputId].push(message);
  }
);

type WriteCallback = (success: boolean) => void;

const writeCallbacks: Record<string, WriteCallback> = {};

const writeToDevice = (
  dmxOutputDevice: DmxOutputDeviceId,
  data: DMXData
): Promise<void> => {
  return new Promise((resolve, reject) => {
    const requestId = uuidV4();
    let callbackRun = false;
    let timeoutId: NodeJS.Timeout | undefined;

    const writeCallback: WriteCallback = (success) => {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = undefined;
      }

      if (!callbackRun) {
        callbackRun = true;

        if (success) {
          resolve();
        } else {
          reject();
        }
      }
    };

    // Ensure callback will be run, if some write gets stuck
    timeoutId = setTimeout(() => writeCallback(false), 100);

    writeCallbacks[requestId] = writeCallback;

    const dmxData = new Uint8Array(data);

    sendMessage<EngineWriteToDeviceOutputMessage>({
      message: EngineOutputMessageNames.WRITE_TO_DEVICE,
      data: { requestId, dmxOutputDevice, dmxData },
    });
  });
};

type DeviceReloadCallback = ({
  dmxOutputDeviceIds,
  inputDeviceIds,
}: {
  dmxOutputDeviceIds: DmxOutputDeviceId[];
  inputDeviceIds: InputDeviceId[];
}) => void;

let deviceChangeCallbacks: Array<DeviceReloadCallback> = [];

export const clearDeviceChangeCallbacks = () => {
  deviceChangeCallbacks = [];
};

export const addDeviceChangeCallback = (
  callback: DeviceReloadCallback
): void => {
  deviceChangeCallbacks.push(callback);

  callback({
    dmxOutputDeviceIds: getDmxOutputDeviceIds(),
    inputDeviceIds: getInputDeviceIds(),
  });
};

export const removeDeviceChangeCallback = (
  callback: DeviceReloadCallback
): void => {
  deviceChangeCallbacks = deviceChangeCallbacks.filter((cb) => cb !== callback);
};

registerMessageListener<EngineDevicesInputMessage>(
  EngineInputMessageNames.DEVICES_CHANGED,
  (deviceData) => {
    const { dmxOutputs, dmxInputs, midiInputs } = deviceData;
    console.log('Engine received devices: ', deviceData);

    // Outputs
    // Linux DMX
    dmxOutputs
      .filter(
        (d) => getDmxOutputDeviceIds().find((id) => id === d) === undefined
      )
      .forEach((deviceId: string) => {
        registerDmxOutputDevice(deviceId, (dmxData) => {
          return writeToDevice(deviceId, dmxData);
        });

        registeredDmxOutputDevices.push(deviceId);
      });

    getDmxOutputDeviceIds()
      .filter((devId) => dmxOutputs.find((d) => d === devId) === undefined)
      .filter(
        (devId) =>
          registeredDmxOutputDevices.find((d) => d === devId) !== undefined
      )
      .forEach((deviceId) => {
        unregisterDmxOutputDevice(deviceId);
        registeredDmxOutputDevices = registeredDmxOutputDevices.filter(
          (d) => d !== deviceId
        );
      });

    // Midi Inputs

    midiInputs.forEach((dev) => {
      if (registeredInputDevices.midi.find((d) => d === dev) !== undefined) {
        return;
      }

      registerInputDevice(dev, () => {
        const data = inputQueue[dev] || [];
        inputQueue[dev] = [];
        return data;
      });

      registeredInputDevices.midi.push(dev);

      sendMessage({
        message: EngineOutputMessageNames.ENABLE_INPUT,
        data: {
          requestId: uuidV4(),
          inputId: dev,
        },
      });
    });

    registeredInputDevices.midi.forEach((midiInputId) => {
      if (midiInputs.find((d) => d === midiInputId) === undefined) {
        unregisterInputDevice(midiInputId);

        registeredInputDevices.midi = registeredInputDevices.midi.filter(
          (d) => d !== midiInputId
        );
      }
    });

    // Dmx Inputs

    dmxInputs.forEach((dev) => {
      if (registeredInputDevices.dmx.find((d) => d === dev) !== undefined) {
        return;
      }

      registerInputDevice(dev, () => {
        const data = inputQueue[dev] || [];
        inputQueue[dev] = [];
        return data;
      });

      sendMessage({
        message: EngineOutputMessageNames.ENABLE_INPUT,
        data: {
          requestId: uuidV4(),
          inputId: dev,
        },
      });

      registeredInputDevices.dmx.push(dev);
    });

    registeredInputDevices.dmx.forEach((inputId) => {
      if (dmxInputs.find((d) => d === inputId) === undefined) {
        unregisterInputDevice(inputId);

        registeredInputDevices.dmx = registeredInputDevices.dmx.filter(
          (d) => d !== inputId
        );
      }
    });

    deviceChangeCallbacks.forEach((cb) =>
      cb({
        dmxOutputDeviceIds: getDmxOutputDeviceIds(),
        inputDeviceIds: getInputDeviceIds(),
      })
    );
  }
);

registerMessageListener<EngineWriteToDeviceDoneInputMessage>(
  EngineInputMessageNames.WRITE_TO_DEVICE_DONE,
  (data) => {
    const cb: WriteCallback | undefined = writeCallbacks[data.requestId];

    if (cb) {
      cb(data.success);
      delete writeCallbacks[data.requestId];
    }
  }
);
