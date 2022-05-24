import {
  EngineOutputMessageNames,
  EngineRequestDevicesOutputMessage,
  EngineDevicesInputMessage,
  EngineInputMessageNames,
  EngineWriteToDeviceDoneInputMessage,
  EngineWriteToDeviceOutputMessage,
  isOutputDeviceId,
  OutputDeviceId,
} from '../../../engine';

import { registerMessageListener, sendMessage } from './messaging';

window.electron.ipcRenderer.on('devices-found', (...args: unknown[]) => {
  const requestId = args[0] as string;

  const outputDevices = (args[1] as Array<number>).filter((d) =>
    isOutputDeviceId(d)
  ) as OutputDeviceId[];

  sendMessage<EngineDevicesInputMessage>({
    message: EngineInputMessageNames.DEVICES_FOUND,
    data: { outputDevices, requestId },
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
      data.outputDevice,
      data.dmxData
    );
  }
);
