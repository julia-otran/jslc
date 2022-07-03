import {
  DmxOutputDeviceId as SrcDmxOutputDeviceId,
  DMXData as SrcDMXData,
  isDmxOutputDeviceId,
} from '../Engine';

export type DmxOutputDeviceId = SrcDmxOutputDeviceId;
export type DMXData = SrcDMXData;

export { isDmxOutputDeviceId };

export enum EngineOutputMessageNames {
  REQUEST_DEVICES = 'request-devices',
  WRITE_TO_DEVICE = 'write-to-device',
}

export enum EngineInputMessageNames {
  DEVICES_FOUND = 'devices-found',
  WRITE_TO_DEVICE_DONE = 'write-to-device-done',
}

export interface EngineOutputMessage<
  TMessage extends EngineOutputMessageNames = EngineOutputMessageNames,
  TData = any
> {
  message: TMessage;
  data: TData;
}

export interface EngineInputMessage<
  TMessage extends EngineInputMessageNames = EngineInputMessageNames,
  TData = any
> {
  message: TMessage;
  data: TData;
}

export interface EngineRequestDevicesOutputMessageData {
  requestId: string;
}

export type EngineRequestDevicesOutputMessage = EngineOutputMessage<
  EngineOutputMessageNames.REQUEST_DEVICES,
  EngineRequestDevicesOutputMessageData
>;

export interface EngineDevicesInputMessageData {
  linuxDmxOutputDevices: number[];
  midiInputDevices: Array<{
    id: number;
    name: string;
  }>;
  requestId: string;
}

export type EngineDevicesInputMessage = EngineInputMessage<
  EngineInputMessageNames.DEVICES_FOUND,
  EngineDevicesInputMessageData
>;

export interface EngineWriteToDeviceDoneInputMessageData {
  success: boolean;
  requestId: string;
}

export type EngineWriteToDeviceDoneInputMessage = EngineInputMessage<
  EngineInputMessageNames.WRITE_TO_DEVICE_DONE,
  EngineWriteToDeviceDoneInputMessageData
>;

export interface EngineWriteToDeviceOutputMessageData {
  dmxData: DMXData;
  requestId: string;
  dmxOutputDevice: DmxOutputDeviceId;
}

export type EngineWriteToDeviceOutputMessage = EngineOutputMessage<
  EngineOutputMessageNames.WRITE_TO_DEVICE,
  EngineWriteToDeviceOutputMessageData
>;
