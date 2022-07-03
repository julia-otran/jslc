import { v4 as uuidV4 } from 'uuid';
import {
  registerDmxOutputDevice,
  unregisterDmxOutputDevice,
  getDmxOutputDeviceIds,
  DmxOutputDeviceId,
  InputDeviceId,
  DMXData,
  isDmxOutputDeviceId,
  getInputDeviceIds,
  registerInputDevice,
  unregisterInputDevice,
} from '../Engine';

import {
  EngineDevicesInputMessage,
  EngineInputMessageNames,
  EngineMidiInputDataInputMessage,
  EngineOutputMessageNames,
  EngineRequestDevicesOutputMessage,
  EngineWriteToDeviceDoneInputMessage,
  EngineWriteToDeviceOutputMessage,
} from '../EngineMessaging';
import { registerMessageListener, sendMessage } from './messaging';

type DeviceReloadCallback = ({}: {
  dmxOutputDeviceIds: DmxOutputDeviceId[];
  inputDeviceIds: InputDeviceId[];
}) => void;
type DeviceReloadRequestId = string;

const deviceReloadCallbacks: Record<
  DeviceReloadRequestId,
  DeviceReloadCallback
> = {};

interface RegisteredInputDevices {
  inputDeviceId: InputDeviceId;
  midiInputId: number;
}

let registeredDmxOutputDevices: DmxOutputDeviceId[] = [];
let registeredInputDevices: RegisteredInputDevices[] = [];

let midiInputQueue: Record<number, Array<any>> = [];

registerMessageListener<EngineMidiInputDataInputMessage>(
  EngineInputMessageNames.MIDI_INPUT_DATA,
  (message) => {
    const { midiInputId, ...other } = message;

    if (midiInputQueue[midiInputId] === undefined) {
      midiInputQueue[midiInputId] = [];
    }

    midiInputQueue[midiInputId].push(other);
  }
);

registerMessageListener<EngineDevicesInputMessage>(
  EngineInputMessageNames.DEVICES_FOUND,
  (data) => {
    const { linuxDmxOutputDevices, midiInputDevices, requestId } = data;
    console.log('Engine received devices: ', data);

    // Outputs
    linuxDmxOutputDevices
      .filter(
        (d) => getDmxOutputDeviceIds().find((id) => id === d) === undefined
      )
      .forEach((deviceId: number) => {
        if (isDmxOutputDeviceId(deviceId)) {
          registerDmxOutputDevice(deviceId, (dmxData) => {
            return writeToDevice(deviceId, dmxData);
          });

          registeredDmxOutputDevices.push(deviceId);
        }
      });

    getDmxOutputDeviceIds()
      .filter(
        (devId) => linuxDmxOutputDevices.find((d) => d === devId) === undefined
      )
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
    const validMidiInputs = midiInputDevices.filter((d) =>
      d.name.includes('VMPK')
    );

    validMidiInputs.forEach((dev) => {
      if (
        registeredInputDevices.find((d) => d.midiInputId === dev.id) !==
        undefined
      ) {
        return;
      }

      const inputDeviceId = Math.max(0, ...getInputDeviceIds()) + 1;

      registerInputDevice(inputDeviceId, () => {
        const data = midiInputQueue[dev.id];
        midiInputQueue[dev.id] = [];
        return data;
      });

      registeredInputDevices.push({ inputDeviceId, midiInputId: dev.id });

      sendMessage({
        message: EngineOutputMessageNames.ENABLE_MIDI_INPUT,
        data: {
          requestId: uuidV4(),
          midiInputId: dev.id,
        },
      });
    });

    registeredInputDevices.map((registeredInputDevice) => {
      if (
        midiInputDevices.find(
          (d) => d.id === registeredInputDevice.midiInputId
        ) === undefined
      ) {
        unregisterInputDevice(registeredInputDevice.inputDeviceId);
        registeredInputDevices = registeredInputDevices.filter(
          (d) => d.inputDeviceId !== registeredInputDevice.inputDeviceId
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

type WriteCallback = (success: boolean) => void;

const writeCallbacks: Record<string, WriteCallback> = {};

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

const writeToDevice = (
  dmxOutputDevice: DmxOutputDeviceId,
  data: DMXData
): Promise<void> => {
  return new Promise((resolve, reject) => {
    const requestId = uuidV4();
    let callbackRun = false;
    let timeoutId: NodeJS.Timeout | undefined = undefined;

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
