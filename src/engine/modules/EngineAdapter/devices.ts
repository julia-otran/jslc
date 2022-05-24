import { v4 as uuidV4 } from 'uuid';
import {
  registerDevice,
  unregisterDevice,
  getDeviceIds,
  OutputDeviceId,
  DMXData,
  isOutputDeviceId,
} from '../Engine';

import {
  EngineDevicesInputMessage,
  EngineInputMessageNames,
  EngineOutputMessageNames,
  EngineRequestDevicesOutputMessage,
  EngineWriteToDeviceDoneInputMessage,
  EngineWriteToDeviceOutputMessage,
} from '../EngineMessaging';
import { registerMessageListener, sendMessage } from './messaging';

type DeviceReloadCallback = ({}: { outputDevices: OutputDeviceId[] }) => void;
type DeviceReloadRequestId = string;

const deviceReloadCallbacks: Record<
  DeviceReloadRequestId,
  DeviceReloadCallback
> = {};

let registeredDevices: OutputDeviceId[] = [];

registerMessageListener<EngineDevicesInputMessage>(
  EngineInputMessageNames.DEVICES_FOUND,
  (data) => {
    const { outputDevices, requestId } = data;
    console.log('Engine received outputDevices: ', data);

    outputDevices
      .filter((d) => getDeviceIds().find((id) => id === d) === undefined)
      .forEach((deviceId: number) => {
        if (isOutputDeviceId(deviceId)) {
          registerDevice(deviceId, (dmxData) => {
            return writeToDevice(deviceId, dmxData);
          });

          registeredDevices.push(deviceId);
        }
      });

    getDeviceIds()
      .filter((devId) => outputDevices.find((d) => d === devId) === undefined)
      .filter(
        (devId) => registeredDevices.find((d) => d === devId) !== undefined
      )
      .forEach((deviceId) => {
        unregisterDevice(deviceId);
        registeredDevices = registeredDevices.filter((d) => d !== deviceId);
      });

    deviceReloadCallbacks[requestId]?.({ outputDevices: getDeviceIds() });
    delete deviceReloadCallbacks[requestId];
  }
);

export const reloadDevices = () =>
  new Promise<{ outputDevices: OutputDeviceId[] }>((resolve) => {
    const requestId = uuidV4();

    deviceReloadCallbacks[requestId] = ({ outputDevices }) => {
      resolve({ outputDevices });
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
  outputDevice: OutputDeviceId,
  data: DMXData
): Promise<void> => {
  return new Promise((resolve, reject) => {
    const requestId = uuidV4();

    const writeCallback: WriteCallback = (success) => {
      if (success) {
        resolve();
      } else {
        reject();
      }
    };

    writeCallbacks[requestId] = writeCallback;

    const dmxData = new Uint8Array(data);

    sendMessage<EngineWriteToDeviceOutputMessage>({
      message: EngineOutputMessageNames.WRITE_TO_DEVICE,
      data: { requestId, outputDevice, dmxData },
    });
  });
};
