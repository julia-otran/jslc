import {
  ChannelMixMapWithDefault,
  InputDeviceId,
  MixMode,
  UniverseOrDefault,
  ValueProvider,
} from '../../../engine-types';
import {
  ProcessSaga,
  isStopped,
  pushValues,
  readFromInputDevice,
  waitNextFrame,
} from './frame-generator';

export const defaultChannelMappingFromTo = (
  startChannel: number,
  endChannel: number
): Record<number, number> => {
  const result: Record<number, number> = {};

  for (let channel = startChannel; channel <= endChannel; channel += 1) {
    result[channel] = channel;
  }

  return result;
};

interface ForwardDmxInputParams {
  inputDeviceId: InputDeviceId;
  weightProvider: ValueProvider;
  mixMode: MixMode;
  universe?: UniverseOrDefault;
  channelMappingFromTo: Record<number, number>;
}

// eslint-disable-next-line import/prefer-default-export
export function* forwardDmxInput({
  universe,
  inputDeviceId,
  channelMappingFromTo,
  mixMode,
  weightProvider,
}: ForwardDmxInputParams): ProcessSaga {
  let prevMessage: number[] = [];

  while (!(yield isStopped())) {
    const inputData = yield readFromInputDevice(inputDeviceId);

    const { message } = (inputData?.slice(-1)[0] || {
      message: prevMessage,
    }) as {
      message: number[];
    };

    if (message) {
      prevMessage = message;
      const channelOuts: ChannelMixMapWithDefault = [];

      for (let channel = 1; channel <= 512; channel += 1) {
        if (channelMappingFromTo[channel] !== undefined) {
          channelOuts.push({
            output: {
              universe,
              channelMSB: channelMappingFromTo[channel],
            },

            mixMode,
            weight: weightProvider(),

            valueMSB: message[channel - 1] || 0,
          });
        }
      }

      yield pushValues(channelOuts);
    }

    yield waitNextFrame();
  }
}
