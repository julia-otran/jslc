import { v4 as uuidV4 } from 'uuid';
import {
  registerDmxOutputDevice,
  unregisterDmxOutputDevice,
  getDmxOutputDeviceIds,
  getInputDeviceIds,
  registerInputDevice,
  unregisterInputDevice,
} from '../Engine';

import {
  DmxOutputDeviceId,
  InputDeviceId,
  DMXData,
  EngineDevicesInputMessage,
  EngineInputMessageNames,
  EngineInputDataInputMessage,
  EngineOutputMessageNames,
  EngineRequestDevicesOutputMessage,
  EngineWriteToDeviceDoneInputMessage,
  EngineWriteToDeviceOutputMessage,
} from '../../../engine-types';
import { registerMessageListener, sendMessage } from './messaging';

type DeviceReloadCallback = ({
  dmxOutputDeviceIds,
  inputDeviceIds,
}: {
  dmxOutputDeviceIds: DmxOutputDeviceId[];
  inputDeviceIds: InputDeviceId[];
}) => void;
type DeviceReloadRequestId = string;

const deviceReloadCallbacks: Record<
  DeviceReloadRequestId,
  DeviceReloadCallback
> = {};

interface RegisteredInputDevices {
  midi: string[];
  dmx: string[];
}

let registeredDmxOutputDevices: DmxOutputDeviceId[] = [];
const registeredInputDevices: RegisteredInputDevices = { midi: [], dmx: [] };

const inputQueue: Record<string, Array<any>> = {};

registerMessageListener<EngineInputDataInputMessage>(
  EngineInputMessageNames.INPUT_DATA,
  (message) => {
    const { inputId, ...other } = message;

    if (inputQueue[inputId] === undefined) {
      inputQueue[inputId] = [];
    }

    inputQueue[inputId].push(other);
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

registerMessageListener<EngineDevicesInputMessage>(
  EngineInputMessageNames.DEVICES_FOUND,
  (deviceData) => {
    const { dmxOutputs, dmxInputs, midiInputs, requestId } = deviceData;
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
      if (midiInputs.find((d) => d === inputId) === undefined) {
        unregisterInputDevice(inputId);

        registeredInputDevices.dmx = registeredInputDevices.dmx.filter(
          (d) => d !== inputId
        );
      }
    });

    deviceReloadCallbacks[requestId]?.({
      dmxOutputDeviceIds: getDmxOutputDeviceIds(),
      inputDeviceIds: getInputDeviceIds(),
    });

    delete deviceReloadCallbacks[requestId];
  }
);

// eslint-disable-next-line import/prefer-default-export
export const reloadDevices = () =>
  new Promise<{
    dmxOutputDeviceIds: DmxOutputDeviceId[];
    inputDeviceIds: InputDeviceId[];
  }>((resolve) => {
    const requestId = uuidV4();

    deviceReloadCallbacks[requestId] = ({
      dmxOutputDeviceIds,
      inputDeviceIds,
    }) => {
      resolve({ dmxOutputDeviceIds, inputDeviceIds });
    };

    sendMessage<EngineRequestDevicesOutputMessage>({
      message: EngineOutputMessageNames.REQUEST_DEVICES,
      data: { requestId },
    });
  });

registerMessageListener<EngineWriteToDeviceDoneInputMessage>(
  EngineInputMessageNames.WRITE_TO_DEVICE_DONE,
  (data) => {
    if (!data.success) {
      reloadDevices();
    }

    const cb: WriteCallback | undefined = writeCallbacks[data.requestId];

    if (cb) {
      cb(data.success);
      delete writeCallbacks[data.requestId];
    }
  }
);
