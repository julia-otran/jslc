import { v4 as uuidV4 } from 'uuid';
import {
  registerDmxOutputDevice,
  unregisterDmxOutputDevice,
  getDmxOutputDeviceIds,
  DmxOutputDeviceId,
  DMXData,
  isDmxOutputDeviceId,
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

type DeviceReloadCallback = ({}: {
  dmxOutputDevices: DmxOutputDeviceId[];
}) => void;
type DeviceReloadRequestId = string;

const deviceReloadCallbacks: Record<
  DeviceReloadRequestId,
  DeviceReloadCallback
> = {};

let registeredDmxOutputDevices: DmxOutputDeviceId[] = [];

registerMessageListener<EngineDevicesInputMessage>(
  EngineInputMessageNames.DEVICES_FOUND,
  (data) => {
    const { linuxDmxOutputDevices, requestId } = data;
    console.log('Engine received devices: ', data);

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

    deviceReloadCallbacks[requestId]?.({
      dmxOutputDevices: getDmxOutputDeviceIds(),
    });
    delete deviceReloadCallbacks[requestId];
  }
);

export const reloadDevices = () =>
  new Promise<{ dmxOutputDevices: DmxOutputDeviceId[] }>((resolve) => {
    const requestId = uuidV4();

    deviceReloadCallbacks[requestId] = ({ dmxOutputDevices }) => {
      resolve({ dmxOutputDevices });
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
