import {
  EngineOutputMessageNames,
  EngineRequestDevicesOutputMessage,
  EngineDevicesInputMessage,
  EngineInputMessageNames,
  EngineMidiInputDataInputMessage,
  EngineWriteToDeviceDoneInputMessage,
  EngineWriteToDeviceOutputMessage,
  EngineEnableMidiInputOutputMessage,
} from '../../../engine';

import { registerMessageListener, sendMessage } from './messaging';

interface MidiInputData {
  midiInputId: number;
  deltaTime: string;
  message: number[];
}

window.electron.ipcRenderer.on(
  'midi-input-data',
  (...args: unknown[]): void => {
    const data = args[0] as MidiInputData;

    sendMessage<EngineMidiInputDataInputMessage>({
      message: EngineInputMessageNames.MIDI_INPUT_DATA,
      data,
    });
  }
);

registerMessageListener<EngineEnableMidiInputOutputMessage>(
  EngineOutputMessageNames.ENABLE_MIDI_INPUT,
  (msg) => {
    window.electron.ipcRenderer.enableMidiInput(msg.requestId, msg.midiInputId);
  }
);

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
    local?: Array<number>;
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

window.electron.ipcRenderer.on('devices-found', (...args: unknown[]): void => {
  devices = args[0] as Devices;
  const localDevices = devices as Devices;

  localDevices.outputs.local = [9];

  console.log(localDevices);

  devicesFoundCallbacks.forEach((cb) => cb(localDevices));

  const { requestId } = localDevices;

  const linuxDmxOutputDevices = localDevices.outputs.linuxDMX;
  const localDmxOutputDevices = localDevices.outputs.local;
  const midiInputDevices = localDevices.inputs.midi;

  sendMessage<EngineDevicesInputMessage>({
    message: EngineInputMessageNames.DEVICES_FOUND,
    data: {
      localDmxOutputDevices,
      linuxDmxOutputDevices,
      midiInputDevices,
      requestId,
    },
  });
});

registerMessageListener<EngineRequestDevicesOutputMessage>(
  EngineOutputMessageNames.REQUEST_DEVICES,
  (data) => {
    window.electron.ipcRenderer.requestDevices(data.requestId);
  }
);

window.electron.ipcRenderer.on('dmx-data-done', (...args) => {
  const requestId = args[0] as string;
  const success = args[1] as boolean;

  sendMessage<EngineWriteToDeviceDoneInputMessage>({
    message: EngineInputMessageNames.WRITE_TO_DEVICE_DONE,
    data: { requestId, success },
  });
});

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

registerMessageListener<EngineWriteToDeviceOutputMessage>(
  EngineOutputMessageNames.WRITE_TO_DEVICE,
  (data) => {
    if (data.dmxOutputDevice === 9) {
      setTimeout(() => {
        sendMessage<EngineWriteToDeviceDoneInputMessage>({
          message: EngineInputMessageNames.WRITE_TO_DEVICE_DONE,
          data: { requestId: data.requestId, success: true },
        });
      }, 20);
    } else {
      window.electron.ipcRenderer.writeDMX(
        data.requestId,
        data.dmxOutputDevice,
        data.dmxData
      );
    }

    valuesCallbacks.forEach((cb) => cb(data.dmxOutputDevice, data.dmxData));
  }
);
