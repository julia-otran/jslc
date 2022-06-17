import {
  ChannelMixMap,
  ChannelMixedMap,
  ChannelMixMapWithDefault,
} from './channel-group-types';

export type Token = string;

export type Task = { token: Token };

export interface ProcessStatus {
  paused: boolean;
  stopped: boolean;
}

export type ProcessPriority = number[];

export interface ProcessCallbackParams {
  status: ProcessStatus;
  token: Token;
  currentPriority: ProcessPriority;
}

export type Process<TReturn> = Generator<void, TReturn, FrameControls>;

export interface FrameControls {
  addProcess(
    priority: ProcessPriority,
    process: Process<void>
  ): ProcessCallbackParams;
  cancelProcess(task: Task): void;
  stopProcess(task: Task): void;
  pauseProcess(task: Task): void;
  params: ProcessCallbackParams;
  getStackMixedChannels(): ChannelMixedMap;
  getValues(): ChannelMixMap;
  setValues(values: ChannelMixMapWithDefault): void;
  pushValues(values: ChannelMixMapWithDefault): void;
  isStopped(task: Task): boolean;
  isDone(task: Task): boolean;
  getReturn(task: Task): any;
}
