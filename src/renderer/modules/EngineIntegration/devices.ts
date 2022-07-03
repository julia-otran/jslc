import {
  EngineOutputMessageNames,
  EngineRequestDevicesOutputMessage,
  EngineDevicesInputMessage,
  EngineInputMessageNames,
  EngineWriteToDeviceDoneInputMessage,
  EngineWriteToDeviceOutputMessage,
} from '../../../engine';

import { registerMessageListener, sendMessage } from './messaging';

interface Devices {
  requestId: string;
  inputs: {
    midi: Array<{
      name: string;
      id: number;
    }>;
  };
  outputs: {
    linuxDMX: Array<number>;
  };
}

window.electron.ipcRenderer.on('devices-found', (...args: unknown[]) => {
  const devices = args[0] as Devices;

  console.log(devices);

  const { requestId } = devices;

  const linuxDmxOutputDevices = devices.outputs.linuxDMX;
  const midiInputDevices = devices.inputs.midi;

  sendMessage<EngineDevicesInputMessage>({
    message: EngineInputMessageNames.DEVICES_FOUND,
    data: { linuxDmxOutputDevices, midiInputDevices, requestId },
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

registerMessageListener<EngineWriteToDeviceOutputMessage>(
  EngineOutputMessageNames.WRITE_TO_DEVICE,
  (data) => {
    window.electron.ipcRenderer.writeDMX(
      data.requestId,
      data.dmxOutputDevice,
      data.dmxData
    );
  }
);
