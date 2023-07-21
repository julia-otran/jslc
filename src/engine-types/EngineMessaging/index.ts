import { DMXData, LocalConnMessage, LocalConnValues } from '../Engine';

export enum EngineOutputMessageNames {
  WRITE_TO_DEVICE = 'write-to-device',
  ENABLE_INPUT = 'enable-input',
  LOCAL_CONN = 'local-conn',
  ENGINE_STOPPED = 'engine-stopped',
}

export enum EngineInputMessageNames {
  DEVICES_CHANGED = 'devices-changed',
  WRITE_TO_DEVICE_DONE = 'write-to-device-done',
  INPUT_DATA = 'input-data',
  LOCAL_CONN = 'local-conn',
  LOCAL_CONN_REQUEST_VALUE = 'local-conn-request-value',
  STOP_ENGINE = 'stop-engine',
  INIT_ENGINE = 'init-engine',
  LOAD_CODE = 'load-code',
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

export type EngineLocalConnOutputMessageData = LocalConnMessage;

export type EngineLocalConnOutputMessage = EngineOutputMessage<
  EngineOutputMessageNames.LOCAL_CONN,
  EngineLocalConnOutputMessageData
>;

export interface EngineEnableInputOutputMessageData {
  requestId: string;
  inputId: string;
}

export type EngineEnableInputOutputMessage = EngineOutputMessage<
  EngineOutputMessageNames.ENABLE_INPUT,
  EngineEnableInputOutputMessageData
>;

export interface EngineDevicesInputMessageData {
  dmxOutputs: string[];
  midiInputs: string[];
  dmxInputs: string[];
}

export type EngineLocalConnInputMessageData = LocalConnMessage;

export type EngineLocalConnInputMessage = EngineInputMessage<
  EngineInputMessageNames.LOCAL_CONN,
  EngineLocalConnInputMessageData
>;

export interface EngineLocalConnRequestValueInputMessageData {
  connectorKey: string;
}

export type EngineLocalConnRequestValueInputMessage = EngineInputMessage<
  EngineInputMessageNames.LOCAL_CONN_REQUEST_VALUE,
  EngineLocalConnRequestValueInputMessageData
>;

export type EngineDevicesInputMessage = EngineInputMessage<
  EngineInputMessageNames.DEVICES_CHANGED,
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

export interface EngineInputDataInputMessageData {
  inputId: string;
  message: number[];
  deltaTime?: string | undefined;
  messageTimestamp: number;
}

export type EngineInputDataInputMessage = EngineInputMessage<
  EngineInputMessageNames.INPUT_DATA,
  EngineInputDataInputMessageData
>;

export interface EngineWriteToDeviceOutputMessageData {
  dmxData: DMXData;
  requestId: string;
  dmxOutputDevice: string;
}

export type EngineWriteToDeviceOutputMessage = EngineOutputMessage<
  EngineOutputMessageNames.WRITE_TO_DEVICE,
  EngineWriteToDeviceOutputMessageData
>;

export type EngineStopInputMessage = EngineInputMessage<
  EngineInputMessageNames.STOP_ENGINE,
  void
>;

export type EngineState = {
  localConnValues: LocalConnValues;
};

export type EngineStoppedOutputMessageData = EngineState | null | undefined;

export type EngineStoppedOutputMessage = EngineOutputMessage<
  EngineOutputMessageNames.ENGINE_STOPPED,
  EngineStoppedOutputMessageData
>;

export type EngineInitInputMessageData = EngineState | undefined;

export type EngineInitInputMessage = EngineInputMessage<
  EngineInputMessageNames.INIT_ENGINE,
  EngineInitInputMessageData
>;

export type EngineLoadCodeInputMessageData = string;

export type EngineLoadCodeInputMessage = EngineInputMessage<
  EngineInputMessageNames.LOAD_CODE,
  EngineLoadCodeInputMessageData
>;
