import { InputDeviceId, MidiMessage, MixMode } from '../../../engine-types';
import {
  ProcessSaga,
  isPaused,
  isStopped,
  pushValues,
  readFromInputDevice,
  waitNextFrame,
} from './frame-generator';

import { ChannelGroup } from './channel-group';

export type VelocityToDmxValueMap = Record<number, number | undefined>;

export const linearVelocityToDmxValue: VelocityToDmxValueMap = {};

for (let i = 0; i < 128; i++) {
  if (i === 127) {
    linearVelocityToDmxValue[i] = 255;
  } else {
    linearVelocityToDmxValue[i] = i * 2;
  }
}

export const fixedVelocityToDmxValue = (
  value: number
): VelocityToDmxValueMap => {
  const result: VelocityToDmxValueMap = {};

  result[-1] = undefined;

  result[0] = 0;

  for (let i = 1; i < 128; i++) {
    result[i] = value;
  }

  return result;
};

export interface NotesToChannelsNotesMappingMidiSynth {
  note: number;
  channelGroup: ChannelGroup;
  velocityToDmxValue: VelocityToDmxValueMap;
  mixMode?: MixMode | undefined;
}

export interface NotesToChannelsMidiSynthParams {
  notesMapping: NotesToChannelsNotesMappingMidiSynth[];
  inputDeviceId: InputDeviceId;
}

export function* notesToChannelsMidiSynth({
  inputDeviceId,
  notesMapping,
}: NotesToChannelsMidiSynthParams): ProcessSaga {
  const notesValue: Record<number, number> = {};
  let pendingMessages: MidiMessage['message'][] = [];

  while (!(yield isStopped())) {
    const inputData = yield readFromInputDevice(inputDeviceId);

    pendingMessages.push(
      ...inputData.map(
        ({ message }: { message: MidiMessage['message'] }) => message
      )
    );

    if (!(yield isPaused())) {
      pendingMessages.forEach((message) => {
        const [mode, note, velocity] = message;

        if (mode === 144) {
          notesValue[note] = velocity;
        }

        if (message[0] === 128) {
          notesValue[note] = -1;
        }
      });

      pendingMessages = [];
    }

    for (let i = 0; i < notesMapping.length; i += 1) {
      const noteMap = notesMapping[i];
      const noteValue =
        notesValue[noteMap.note] !== undefined ? notesValue[noteMap.note] : -1;

      const valueMSB = noteMap.velocityToDmxValue[noteValue];

      if (valueMSB !== undefined) {
        yield pushValues(
          noteMap.channelGroup.getChannelsMixWithValue({
            weight: 1,
            mixMode:
              noteMap.mixMode === undefined
                ? MixMode.GREATER_PRIORITY
                : noteMap.mixMode,
            valueMSB,
          })
        );
      }
    }

    yield waitNextFrame();
  }
}
