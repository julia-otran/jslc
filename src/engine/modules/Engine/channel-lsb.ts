import { validateDMXChannel, DMXChannel } from './devices';
import { Universe } from './universes';

export interface ChannelCombine {
  universe: Universe;
  channelMSB: DMXChannel;
  channelLSB: DMXChannel;
}

let combinedChannels: ChannelCombine[] = [];

export interface CreateChannelBitAssignementParams {
  universe: Universe;
  start: number;
  offsetMSB: number;
  offsetLSB: number;
}

export const createChannelBitAssignement = ({
  start,
  offsetMSB,
  offsetLSB,
  universe,
}: CreateChannelBitAssignementParams): void => {
  const channelMSB = start + offsetMSB;

  validateDMXChannel(channelMSB);

  const channelLSB = start + offsetLSB;

  validateDMXChannel(channelLSB);

  const existentCombine = combinedChannels
    .filter((combined) => universe.id === combined.universe.id)
    .find(
      (combined) =>
        combined.channelLSB === channelLSB ||
        combined.channelMSB === combined.channelMSB
    );

  if (existentCombine !== undefined) {
    throw new Error(
      'Cannot extends channels. They are already used in other combination.'
    );
  }

  combinedChannels.push({ universe, channelMSB, channelLSB });
};

export interface DeleteChannelBitAssignementParams {
  universe: Universe;
  start: number;
  offsetMSB: number;
}

export const deleteChannelBitAssign = ({
  universe,
  start,
  offsetMSB,
}: DeleteChannelBitAssignementParams) => {
  const channelMSB = start + offsetMSB;

  combinedChannels = combinedChannels.filter(
    (combined) =>
      !(
        combined.universe.id === universe.id &&
        combined.channelMSB === channelMSB
      )
  );
};

export interface GetChannelLSBParams {
  universe: Universe;
  channelMSB: DMXChannel;
}

export const getChannelLSB = ({
  universe,
  channelMSB,
}: GetChannelLSBParams): DMXChannel | undefined => {
  return combinedChannels
    .filter((combined) => combined.universe.id === universe.id)
    .find((combined) => combined.channelMSB === channelMSB)?.channelLSB;
};

export interface GetChannelMSBParams {
  universe: Universe;
  channelLSB: DMXChannel;
}

export const getChannelMSB = ({
  universe,
  channelLSB,
}: GetChannelMSBParams): DMXChannel | undefined => {
  return combinedChannels
    .filter((combined) => combined.universe.id === universe.id)
    .find((combined) => combined.channelLSB === channelLSB)?.channelMSB;
};
