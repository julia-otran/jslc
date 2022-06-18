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

export type Process<TReturn> = Generator<void, void, FrameControls<TReturn>>;

export interface FrameControls<TReturn> {
  addProcess(
    priority: ProcessPriority,
    process: Process<void>
  ): ProcessCallbackParams;
  cancelProcess(task: Task): void;
  stopProcess(task: Task): void;
  pauseProcess(task: Task): void;
  resumeProcess(task: Task): void;
  params: ProcessCallbackParams;
  getStackMixedChannels(): ChannelMixedMap;
  getValues(): ChannelMixMap;
  setValues(values: ChannelMixMapWithDefault): void;
  pushValues(values: ChannelMixMapWithDefault): void;
  isTaskPaused(task: Task): boolean;
  isTaskStopped(task: Task): boolean;
  isTaskDone(task: Task): boolean;
  getReturn(task: Task): any;
  setReturn(data: TReturn): void;
}
