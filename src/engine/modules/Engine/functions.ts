import { DMXValue } from './devices';
import { OutputDefault } from './channel-group-types';
import { ChannelGroup } from './channel-group';
import { MixMode, addProcess, Process } from './core';

export interface FnBaseAttrs {
  priority: number;
  defaultMixMode?: MixMode | undefined;
}

export interface FadeInAttrs extends FnBaseAttrs {
  timeSecs: number;
}

export type BaseOutput = ChannelGroup | OutputDefault;

export type SetChFn = (output: BaseOutput, value: DMXValue) => void;

export type CallFn = (setValues: SetChFn) => void;

export interface Token extends Promise<void> {
  tokenValue: string;
}

function* privateFadeIn(attrs: FadeInAttrs): Process {}

export const fadeIn = (attrs: FadeInAttrs, call: CallFn): Token => {
  addProcess(attrs.priority, privateFadeIn(attrs));
};
