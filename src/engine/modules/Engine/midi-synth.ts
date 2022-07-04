import { InputDeviceId } from './devices';
import { MixMode } from './channel-group-types';
import { ChannelGroup } from './channel-group';

import {
  ProcessSaga,
  readFromInputDevice,
  isPaused,
  pushValues,
  waitNextFrame,
  isStopped,
} from './frame-generator';

export type MidiMessage = number[];

export const linearVelocityToDmxValue: Record<number, number> = {};

for (let i = 0; i < 128; i++) {
  if (i === 127) {
    linearVelocityToDmxValue[i] = 255;
  } else {
    linearVelocityToDmxValue[i] = i * 2;
  }
}

export interface NotesToChannelsNotesMappingMidiSynth {
  note: number;
  channelGroup: ChannelGroup;
  velocityToDmxValue: Record<number, number>;
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
  let pendingMessages: MidiMessage[] = [];

  while (!(yield isStopped())) {
    const inputData = yield readFromInputDevice(inputDeviceId);

    pendingMessages.push(
      ...inputData.map(({ message }: { message: MidiMessage }) => message)
    );

    if (!(yield isPaused())) {
      pendingMessages.forEach((message: MidiMessage) => {
        if (message[0] === 144 || message[0] === 128) {
          notesValue[message[1]] = message[2];
        }
      });

      pendingMessages = [];
    }

    for (let i = 0; i < notesMapping.length; i++) {
      const noteMap = notesMapping[i];

      const valueMSB =
        noteMap.velocityToDmxValue[notesValue[noteMap.note] || 0] || 0;

      yield pushValues(
        noteMap.channelGroup.getChannelsMixWithValue({
          weight: 1,
          mixMode: MixMode.GREATER_PRIORITY,
          valueMSB,
        })
      );
    }

    yield waitNextFrame();
  }
}
