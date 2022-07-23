import { ChannelValue } from './channel-group-types';

export const sleep = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

export function channelValueToValue<T extends ChannelValue | undefined>(
  a: T
): number | Extract<undefined, T>;

export function channelValueToValue(
  channelValue: ChannelValue | undefined
): number | undefined {
  if (!channelValue) {
    return 0;
  }

  const valueLSB =
    channelValue.valueLSB === undefined
      ? channelValue.valueMSB
      : channelValue.valueLSB;

  return (channelValue.valueMSB << 8) | (valueLSB & 0xff);
}

export const valueToChannelValue = (value: number): ChannelValue => {
  const valueLSB = value & 0xff;
  const valueMSB = value >> 8;

  return { valueMSB, valueLSB };
};
