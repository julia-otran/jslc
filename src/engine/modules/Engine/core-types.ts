import {
  ChannelMixMap,
  ChannelMixedMap,
  ChannelMixMapWithDefault,
} from './channel-group-types';

export type Token = string;

export interface ProcessStatus {
  paused: boolean;
  stopped: boolean;
}

export interface FrameControls {
  token: Token;
  status: ProcessStatus;
  getStackMixedChannels(): ChannelMixedMap;
  getValues(): ChannelMixMap;
  setValues(values: ChannelMixMapWithDefault): void;
  pushValues(values: ChannelMixMapWithDefault): void;
}

export type Process = Generator<void, void, FrameControls>;

export interface ProcessCallbackParams {
  status: ProcessStatus;
  token: Token;
}

export type ProcessCallback = ({}: ProcessCallbackParams) => Process;
