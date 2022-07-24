import { UniverseOrDefault, Universe } from './universes';
import { DMXChannel, DMXValue } from './devices';

export interface GroupOutputDefault {
  universe: UniverseOrDefault;
  channelMSB: DMXChannel;
}

export interface GroupOutput {
  universe: Universe;
  channelMSB: DMXChannel;
}

export enum MixMode {
  CLEAR,
  GREATER_PRIORITY,
  MIN,
  MAX,
  AVERAGE,
}

export interface ChannelValue {
  valueMSB: DMXValue;
  valueLSB?: DMXValue | undefined;
}

export interface ChannelValueMixed extends ChannelValue {
  weight?: number | undefined;
}

export interface ChannelValueMix extends ChannelValueMixed {
  mixMode: MixMode;
}

export interface ChannelMixWithDefault extends ChannelValueMix {
  output: GroupOutputDefault;
}

export interface ChannelOutput {
  output: GroupOutput;
}

export interface ChannelMix extends ChannelValueMix, ChannelOutput {}

export interface ChannelMixed extends ChannelValueMixed, ChannelOutput {}

export type ChannelMixMapWithDefault = ChannelMixWithDefault[];

export type ChannelMixMap = ChannelMix[];

export type ChannelMixedMap = ChannelMixed[];

export interface Channel extends ChannelValue {
  output: GroupOutput;
}

export type ChannelMap = Channel[];
