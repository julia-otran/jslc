import {
  EngineInputDataInputMessageData,
  createBPMTapper,
} from '../../../engine-types';
import {
  ProcessSaga,
  isStopped,
  readFromInputDevice,
  waitNextFrame,
} from './frame-generator';
import { sendLocalConnValue, sendRawLocalConnValue } from './local-conn';

import { scaleValue } from './utils';

export type AssignLocalConnWithMidiControlMapPush = (
  value: number,
  minValue?: number,
  maxValue?: number
) => void;

export type AssignLocalConnWithMidiControlMapParam = (
  message: EngineInputDataInputMessageData,
  pushValue: AssignLocalConnWithMidiControlMapPush
) => void;

export interface AssignLocalConnWithMidiParams {
  localConnName: string;
  inputDeviceId: string;
  controlMap: AssignLocalConnWithMidiControlMapParam;
}

export function* assignLocalConnWithMidi({
  localConnName,
  inputDeviceId,
  controlMap,
}: AssignLocalConnWithMidiParams): ProcessSaga {
  let run = !(yield isStopped());

  while (run) {
    const inputData = yield readFromInputDevice(inputDeviceId);

    let change:
      | { value: number; minValue?: number; maxValue?: number }
      | undefined;

    const pushChange: AssignLocalConnWithMidiControlMapPush = (
      value,
      minValue,
      maxValue
    ): void => {
      change = { value, minValue, maxValue };
    };

    inputData.forEach((message: EngineInputDataInputMessageData) =>
      controlMap(message, pushChange)
    );

    if (change) {
      if (change.minValue !== undefined && change.maxValue !== undefined) {
        sendLocalConnValue(
          localConnName,
          change.value,
          change.minValue,
          change.maxValue
        );
      } else {
        sendRawLocalConnValue(localConnName, change.value);
      }
    }

    yield waitNextFrame();
    run = !(yield isStopped());
  }
}

export interface KnobControlMapParams {
  status?: number;
  controlNumber: number;
  activeProvider?(): boolean;
  scale?: {
    inputMin: number;
    inputMax: number;
    outputMin: number;
    outputMax: number;
  };
}

export const knobControlMap = ({
  status = 0xb0,
  controlNumber,
  activeProvider,
  scale = {
    inputMin: 0,
    inputMax: 127,
    outputMin: 0,
    outputMax: 255,
  },
}: KnobControlMapParams): AssignLocalConnWithMidiControlMapParam => {
  return (message, callback) => {
    if (activeProvider !== undefined) {
      if (!activeProvider()) {
        return;
      }
    }

    const [recvStatus, recvControlNumber, recvValue] = message.message;

    if (recvStatus === status && recvControlNumber === controlNumber) {
      callback(
        scaleValue(
          recvValue,
          scale.inputMin,
          scale.inputMax,
          scale.outputMin,
          scale.outputMax
        )
      );
    }
  };
};

export interface RollControlMapParams {
  status?: number;
  activeProvider?(): boolean;
}

export const rollControlMap =
  ({
    status = 0xc0,
    activeProvider,
  }: RollControlMapParams): AssignLocalConnWithMidiControlMapParam =>
  (message, callback) => {
    if (activeProvider !== undefined) {
      if (!activeProvider()) {
        return;
      }
    }

    if (message.message[0] === status) {
      callback(message.message[1]);
    }
  };

export interface IncrementToggleControlMapParams {
  noteOn?: number;
  controlNumber: number;
  currentValueProvider(): number;
  activeProvider?(): boolean;
  maxValue?: number;
}

export const incrementToggleControlMap =
  ({
    noteOn = 0x90,
    controlNumber,
    currentValueProvider,
    activeProvider,
    maxValue,
  }: IncrementToggleControlMapParams): AssignLocalConnWithMidiControlMapParam =>
  (message, callback) => {
    if (activeProvider !== undefined) {
      if (!activeProvider()) {
        return;
      }
    }

    const [inStatus, inControlNumber, inValue] = message.message;

    if (
      inStatus === noteOn &&
      controlNumber === inControlNumber &&
      inValue > 0
    ) {
      const newVal = currentValueProvider() + 1;
      if (maxValue === undefined || newVal <= maxValue) {
        callback(newVal);
      }
    }
  };

export interface DecrementToggleControlMapParams {
  noteOn?: number;
  controlNumber: number;
  currentValueProvider(): number;
  activeProvider?(): boolean;
  minValue?: number;
}

export const decrementToggleControlMap =
  ({
    noteOn = 0x90,
    controlNumber,
    currentValueProvider,
    activeProvider,
    minValue,
  }: DecrementToggleControlMapParams): AssignLocalConnWithMidiControlMapParam =>
  (message, callback) => {
    if (activeProvider !== undefined) {
      if (!activeProvider()) {
        return;
      }
    }

    const [inStatus, inControlNumber, inValue] = message.message;

    if (
      inStatus === noteOn &&
      controlNumber === inControlNumber &&
      inValue > 0
    ) {
      const newVal = currentValueProvider() - 1;
      if (minValue === undefined || newVal >= minValue) {
        callback(newVal);
      }
    }
  };

export interface BpmButtonControlMapParams {
  noteOn?: number;
  controlNumber: number;
  activeProvider?(): boolean;
}

export const bpmButtonControlMap = ({
  noteOn = 0x90,
  controlNumber,
  activeProvider,
}: BpmButtonControlMapParams): AssignLocalConnWithMidiControlMapParam => {
  const { onTap } = createBPMTapper();

  return (message, callback) => {
    if (activeProvider !== undefined) {
      if (!activeProvider()) {
        return;
      }
    }

    const [inStatus, inControlNumber, inValue] = message.message;

    if (
      inStatus === noteOn &&
      controlNumber === inControlNumber &&
      inValue > 0
    ) {
      const newVal = onTap(message.messageTimestamp);

      if (newVal !== undefined) {
        callback(newVal);
      }
    }
  };
};
