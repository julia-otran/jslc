import { UniverseOrDefault, Universe } from './universes';
import { DMXChannel, DMXValue } from './devices';

export interface GroupOutput {
  universe: UniverseOrDefault;
  channelMSB: DMXChannel;
  channelLSB?: DMXChannel | undefined;
}

export interface OutputDefault {
  universe: UniverseOrDefault;
  channel: DMXChannel;
}

export interface Output {
  universe: Universe;
  channel: DMXChannel;
}

export enum MixMode {
  GREATER_PRIORITY,
  MIN,
  MAX,
  AVERAGE,
}

export interface ChannelValue {
  value: DMXValue;
  weight?: number | undefined;
  mixMode: MixMode;
}

export interface GroupChannelValue extends ChannelValue {
  valueLSB?: number | undefined;
}

interface OutputDefaultValue extends ChannelValue {
  output: OutputDefault;
}

interface OutputValue extends ChannelValue {
  output: Output;
}

export type ChannelMapWithDefault = OutputDefaultValue[];

export type ChannelMap = OutputValue[];
