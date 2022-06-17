import { v4 as uuidV4 } from 'uuid';
import { all as allR, any } from 'ramda';

import { ChannelMixMap } from './channel-group-types';
import { Process, Task } from './core-types';

export enum EffectType {
  WAIT_NEXT_FRAME = 'WAIT_NEXT_FRAME',
  FORK = 'FORK',
  CANCEL = 'CANCEL',
  FREEZE = 'FREEZE',
  STOP = 'STOP',
  PAUSE = 'PAUSE',
  RESUME = 'RESUME',
  TAKE = 'TAKE',
  TAKE_MAYBE = 'TAKE_MAYBE',
  PUT = 'PUT',
  JOIN = 'JOIN',
  RACE = 'RACE',
  ALL = 'ALL',
  IS_PAUSED = 'IS_PAUSED',
  IS_STOPPED = 'IS_STOPPED',
  IS_CANCELLED = 'IS_CANCELLED',
}

type GeneratorReturnType<T extends Generator> = T extends Generator<
  any,
  infer R,
  any
>
  ? R
  : never;

export interface BaseEffect<TType extends EffectType, TData = any> {
  type: TType;
  effectData: TData;
}

export type WaitNextFrameEffect = BaseEffect<EffectType.WAIT_NEXT_FRAME, void>;
export type WaitNextFrameEffectReturn = void;
export type WaitNextFrameGenerator = Generator<
  WaitNextFrameEffect,
  void,
  WaitNextFrameEffectReturn
>;

const isWaitNextFrameEffect = (value: any): value is WaitNextFrameEffect =>
  value?.type === EffectType.WAIT_NEXT_FRAME;

export const waitNextFrame = (): WaitNextFrameEffect => ({
  type: EffectType.WAIT_NEXT_FRAME,
  effectData: undefined,
});

export interface ForkEffectData<TSaga extends TInternalSaga> {
  forkGenerator: TSaga;
}
export type ForkEffect<TSaga extends TInternalSaga> = BaseEffect<
  EffectType.FORK,
  ForkEffectData<TSaga>
>;

export const fork = <TSaga extends TInternalSaga>(
  saga: TSaga
): ForkEffect<TSaga> => ({
  type: EffectType.FORK,
  effectData: { forkGenerator: saga },
});

const isForkEffect = <TSaga extends TInternalSaga>(
  value: any
): value is ForkEffect<TSaga> => value?.type === EffectType.FORK;

export type ForkEffectReturn = Task;
export type ForkGenerator<TSaga extends TInternalSaga> = Generator<
  ForkEffect<TSaga>,
  ForkEffectReturn,
  void
>;

export type CancelEffectData = Task | undefined;
export type CancelEffect = BaseEffect<EffectType.CANCEL, CancelEffectData>;
export type CancelEffectReturn = void;
export type CancelGenerator = Generator<CancelEffect, void, void>;

const isCancelEffect = (value: any): value is CancelEffect =>
  value?.type === EffectType.CANCEL;

export const cancel = (): CancelEffect => ({
  type: EffectType.CANCEL,
  effectData: undefined,
});

export type FreezeEffect = BaseEffect<EffectType.FREEZE, void>;
export type FreezeGenerator = Generator<FreezeEffect, void, void>;

export const freeze = (): FreezeEffect => ({
  type: EffectType.FREEZE,
  effectData: undefined,
});

const isFreezeEffect = (value: any): value is FreezeEffect =>
  value?.type === EffectType.FREEZE;

export type StopEffectData = Task | undefined;
export type StopEffect = BaseEffect<EffectType.STOP, StopEffectData>;
export type StopGenerator = Generator<StopEffect, void, void>;

const isStopEffect = (value: any): value is StopEffect =>
  value?.type === EffectType.STOP;

export const stop = (task?: Task | undefined): StopEffect => ({
  type: EffectType.STOP,
  effectData: task,
});

export type PauseEffectData = Task | undefined;
export type PauseEffect = BaseEffect<EffectType.PAUSE, PauseEffectData>;
export type PauseGenerator = Generator<PauseEffect, void, void>;

export const pause = (task?: Task): PauseEffect => ({
  type: EffectType.PAUSE,
  effectData: task,
});

const isPauseEffect = (value: any): value is PauseEffect =>
  value?.type === EffectType.PAUSE;

export type ResumeEffectData = Task | undefined;
export type ResumeEffect = BaseEffect<EffectType.RESUME, ResumeEffectData>;
export type ResumeGenerator = Generator<ResumeEffect, void, void>;

export const resume = (task?: Task): ResumeEffect => ({
  type: EffectType.RESUME,
  effectData: task,
});

const isResumeEffect = (value: any): value is ResumeEffect =>
  value?.type === EffectType.RESUME;

enum InternalEffectChannelToken {}

export type EffectChannelToken<TToken extends string> =
  | TToken
  | InternalEffectChannelToken;

export interface TakeEffectData<TChannelToken extends string> {
  channelToken: EffectChannelToken<TChannelToken>;
}

export type TakeEffect<TChannelToken extends string> = BaseEffect<
  EffectType.TAKE,
  TakeEffectData<TChannelToken>
>;
export type TakeGenerator<
  TChannelToken extends string,
  TChannelReturn
> = Generator<TakeEffect<TChannelToken>, void, TChannelReturn>;

const isTakeEffect = <TChannelToken extends string>(
  value: any
): value is TakeEffect<TChannelToken> => value?.type === EffectType.TAKE;

export const take = <TChannelToken extends string>(
  channelToken: TChannelToken
): TakeEffect<TChannelToken> => ({
  type: EffectType.TAKE,
  effectData: { channelToken },
});

export interface TakeMaybeEffectData<TChannelToken extends string> {
  channelToken: EffectChannelToken<TChannelToken>;
}

export type TakeMaybeEffect<TChannelToken extends string> = BaseEffect<
  EffectType.TAKE_MAYBE,
  TakeEffectData<TChannelToken>
>;
export type TakeMaybeGenerator<
  TChannelToken extends string,
  TChannelReturn
> = Generator<TakeMaybeEffect<TChannelToken>, void, TChannelReturn | undefined>;

export const takeMaybe = <TChannelToken extends string>(
  channelToken: TChannelToken
): TakeMaybeEffect<TChannelToken> => ({
  type: EffectType.TAKE_MAYBE,
  effectData: { channelToken },
});

const isTakeMaybeEffect = <TChannelToken extends string>(
  value: any
): value is TakeMaybeEffect<TChannelToken> =>
  value?.type === EffectType.TAKE_MAYBE;

export interface PutEffectData<
  TChannelToken extends string,
  TChannelData extends { [key in EffectChannelToken<TChannelToken>]: any }
> {
  channelToken: EffectChannelToken<TChannelToken>;
  data: TChannelData[TChannelToken];
}
export type PutEffect<
  TChannelToken extends string,
  TChannelData extends { [key in EffectChannelToken<TChannelToken>]: any }
> = BaseEffect<EffectType.PUT, PutEffectData<TChannelToken, TChannelData>>;

export type PutGenerator<
  TChannelToken extends string,
  TChannelData extends { [key in EffectChannelToken<TChannelToken>]: any }
> = Generator<PutEffect<TChannelToken, TChannelData>, void, void>;

export const put = <
  TChannelToken extends string,
  TChannelData extends { [key in EffectChannelToken<TChannelToken>]: any }
>(
  channelToken: TChannelToken,
  data: TChannelData[TChannelToken]
): PutEffect<TChannelToken, TChannelData> => ({
  type: EffectType.PUT,
  effectData: { channelToken, data },
});

const isPutEffect = <
  TChannelToken extends string,
  TChannelData extends { [key in EffectChannelToken<TChannelToken>]: any }
>(
  value: any
): value is PutEffect<TChannelToken, TChannelData> =>
  value?.type === EffectType.PUT;

export enum JoinMode {
  STOPPED = 'STOPPED',
  DONE = 'DONE',
}

export interface JoinEffectData {
  tasks: Task[];
  joinMode: JoinMode;
}
export type JoinEffect = BaseEffect<EffectType.JOIN, JoinEffectData>;
export type JoinGenerator = Generator<JoinEffect, void, void>;

export const join = (
  tasks: Task[],
  joinMode: JoinMode = JoinMode.DONE
): JoinEffect => ({
  type: EffectType.JOIN,
  effectData: { tasks, joinMode },
});

const isJoinEffect = (value: any): value is JoinEffect =>
  value?.type === EffectType.JOIN;

export interface RaceEffectData<
  TRaceKey extends string,
  TRaceMap extends { [key in TRaceKey]: TInternalSaga }
> {
  joinMode: JoinMode;
  raceMap: TRaceMap;
}
export type RaceEffect<
  TRaceKey extends string,
  TRaceMap extends { [key in TRaceKey]: TInternalSaga }
> = BaseEffect<EffectType.RACE, RaceEffectData<TRaceKey, TRaceMap>>;

export type RaceGenerator<
  TRaceKey extends string,
  TRaceMap extends { [key in TRaceKey]: TInternalSaga },
  TRaceReturn extends { [key in TRaceKey]?: GeneratorReturnType<TRaceMap[key]> }
> = Generator<RaceEffect<TRaceKey, TRaceMap>, TRaceReturn, void>;

export const race = <
  TRaceKey extends string,
  TRaceMap extends { [key in TRaceKey]: TInternalSaga }
>(
  raceMap: TRaceMap,
  joinMode: JoinMode = JoinMode.DONE
) => ({
  type: EffectType.RACE,
  effectData: { raceMap, joinMode },
});

const isRaceEffect = <
  TRaceKey extends string,
  TRaceMap extends { [key in TRaceKey]: TInternalSaga }
>(
  value: any
): value is RaceEffect<TRaceKey, TRaceMap> => value?.type === EffectType.RACE;

export interface AllEffectData<
  TAllKey extends string,
  TAllMap extends { [key in TAllKey]: TInternalSaga }
> {
  joinMode: JoinMode;
  allMap: TAllMap;
}
export type AllEffect<
  TAllKey extends string,
  TAllMap extends { [key in TAllKey]: TInternalSaga }
> = BaseEffect<EffectType.RACE, AllEffectData<TAllKey, TAllMap>>;

export type AllGenerator<
  TAllKey extends string,
  TAllMap extends { [key in TAllKey]: TInternalSaga },
  TAllReturn extends { [key in TAllKey]?: GeneratorReturnType<TAllMap[key]> }
> = Generator<AllEffect<TAllKey, TAllMap>, TAllReturn, void>;

export const all = <
  TAllKey extends string,
  TAllMap extends { [key in TAllKey]: TInternalSaga }
>(
  allMap: TAllMap,
  joinMode: JoinMode = JoinMode.DONE
) => ({
  type: EffectType.ALL,
  effectData: { allMap, joinMode },
});

const isAllEffect = <
  TAllKey extends string,
  TAllMap extends { [key in TAllKey]: TInternalSaga }
>(
  value: any
): value is AllEffect<TAllKey, TAllMap> => value?.type === EffectType.ALL;

export interface IsPausedEffectData {
  task?: Task | undefined;
}
export type IsPausedEffect = BaseEffect<
  EffectType.IS_PAUSED,
  IsPausedEffectData
>;
export type IsPausedGenerator = Generator<IsPausedEffect, boolean, void>;
export const isPaused = (task?: Task | undefined): IsPausedEffect => ({
  type: EffectType.IS_PAUSED,
  effectData: { task },
});
const isPausedEffect = (effect: any): effect is IsPausedEffect =>
  effect && effect.type === EffectType.IS_PAUSED;

export interface IsStoppedEffectData {
  task?: Task | undefined;
}
export type IsStoppedEffect = BaseEffect<
  EffectType.IS_STOPPED,
  IsStoppedEffectData
>;
export type IsStoppedGenerator = Generator<IsStoppedEffect, boolean, void>;
export const isStopped = (task?: Task | undefined): IsStoppedEffect => ({
  type: EffectType.IS_STOPPED,
  effectData: { task },
});
const isStoppedEffect = (effect: any): effect is IsStoppedEffect =>
  effect && effect.type === EffectType.IS_STOPPED;

export interface IsCancelledEffectData {
  task: Task;
}
export type IsCancelledEffect = BaseEffect<
  EffectType.IS_CANCELLED,
  IsCancelledEffectData
>;
export type IsCancelledGenerator = Generator<IsCancelledEffect, boolean, void>;
export const isCancelled = (task: Task): IsCancelledEffect => ({
  type: EffectType.IS_CANCELLED,
  effectData: { task },
});
const isCancelledEffect = (effect: any): effect is IsCancelledEffect =>
  effect && effect.type === EffectType.IS_CANCELLED;

export type ReturnGenerator<TReturn> = Generator<void, TReturn, void>;

export type ProcessSaga<
  TChannelToken extends string,
  TChannelData extends { [key in EffectChannelToken<TChannelToken>]: any },
  TRaceKeys extends string,
  TRaceMap extends { [key in TRaceKeys]: TInternalSaga },
  TRaceReturn extends {
    [key in TRaceKeys]?: GeneratorReturnType<TRaceMap[key]>;
  },
  TAllKeys extends string,
  TAllMap extends { [key in TAllKeys]: TInternalSaga },
  TAllReturn extends { [key in TAllKeys]?: GeneratorReturnType<TAllMap[key]> },
  TForkSaga extends TInternalSaga,
  TSagaReturn
> =
  | WaitNextFrameGenerator
  | ForkGenerator<TForkSaga>
  | CancelGenerator
  | FreezeGenerator
  | StopGenerator
  | PauseGenerator
  | ResumeGenerator
  | TakeGenerator<TChannelToken, TChannelData>
  | PutGenerator<TChannelToken, TChannelData>
  | TakeMaybeGenerator<TChannelToken, TChannelData>
  | JoinGenerator
  | RaceGenerator<TRaceKeys, TRaceMap, TRaceReturn>
  | AllGenerator<TAllKeys, TAllMap, TAllReturn>
  | IsPausedGenerator
  | IsStoppedGenerator
  | IsCancelledGenerator
  | ReturnGenerator<TSagaReturn>;

type TInternalSaga = ProcessSaga<
  any,
  any,
  any,
  any,
  any,
  any,
  any,
  any,
  any,
  any
>;

let putQueue: PutEffectData<any, any>[] = [];
const takeQueue: Record<string, EffectChannelToken<any>> = {};

export const processGenerator = function* <
  TChannelToken extends string,
  TChannelData extends { [key in EffectChannelToken<TChannelToken>]: any },
  TRaceKeys extends string,
  TRaceMap extends { [key in TRaceKeys]: TInternalSaga },
  TRaceReturn extends {
    [key in TRaceKeys]?: GeneratorReturnType<TRaceMap[key]>;
  },
  TAllKeys extends string,
  TAllMap extends { [key in TAllKeys]: TInternalSaga },
  TAllReturn extends { [key in TAllKeys]?: GeneratorReturnType<TAllMap[key]> },
  TForkSaga extends TInternalSaga,
  TSagaReturn,
  TSaga extends ProcessSaga<
    TChannelToken,
    TChannelData,
    TRaceKeys,
    TRaceMap,
    TRaceReturn,
    TAllKeys,
    TAllMap,
    TAllReturn,
    TForkSaga,
    TSagaReturn
  >
>(saga: TSaga): Process<TSagaReturn> {
  let controls = yield;
  let forkPriority = 1;
  let channelMixStack: ChannelMixMap = [];
  let takeChannelToken: EffectChannelToken<TChannelToken> | undefined =
    undefined;
  let forwardParam: any = undefined;

  while (true) {
    const {
      cancelProcess,
      stopProcess,
      pauseProcess,
      resumeProcess,
      isStopped,
      isDone,
    } = controls;
    const { currentPriority } = controls.params;

    const result = saga.next(forwardParam);

    if (result)
      if (isForkEffect(result.value)) {
        const { token } = controls.addProcess(
          [...currentPriority, forkPriority],
          processGenerator(
            result.value.effectData.forkGenerator
          ) as Process<void>
        );
        forkPriority += 1;
        forwardParam = { token };
      }

    if (isPauseEffect(result.value)) {
      if (result.value?.effectData === undefined) {
        pauseProcess({ token: controls.params.token });
      } else {
        pauseProcess(result.value?.effectData);
      }
    }

    if (isResumeEffect(result.value)) {
      if (result.value?.effectData === undefined) {
        resumeProcess({ token: controls.params.token });
      } else {
        resumeProcess(result.value?.effectData);
      }
    }

    if (isStopEffect(result.value)) {
      if (result.value?.effectData === undefined) {
        stopProcess({ token: controls.params.token });
      } else {
        stopProcess(result.value?.effectData);
      }
    }

    if (isCancelEffect(result.value)) {
      if (result.value?.effectData === undefined) {
        cancelProcess({ token: controls.params.token });
      } else {
        cancelProcess(result.value?.effectData);
      }
    }

    if (isPausedEffect(result.value)) {
      const { task } = result.value.effectData;

      if (task) {
        forwardParam = isPaused(task);
      } else {
        forwardParam = isPaused({ token: controls.params.token });
      }
    }

    if (isStoppedEffect(result.value)) {
      const { task } = result.value.effectData;

      if (task) {
        forwardParam = isPaused(task);
      } else {
        forwardParam = isPaused({ token: controls.params.token });
      }
    }

    if (isCancelledEffect(result.value)) {
      const { task } = result.value.effectData;
      forwardParam = isPaused(task);
    }

    if (isFreezeEffect(result.value)) {
      controls.pushValues(channelMixStack);
    }

    if (isTakeEffect(result.value)) {
      takeChannelToken = result.value.effectData.channelToken;
    }

    if (takeChannelToken) {
      let takeToken = uuidV4();
      takeQueue[takeToken] = takeChannelToken;

      let putEvent = putQueue.find((q) => q.channelToken === takeChannelToken);

      if (putEvent) {
        // Ensure we return always on next frame
        controls = yield;
      }

      while (!putEvent) {
        controls = yield;
        putEvent = putQueue.find((q) => q.channelToken === takeChannelToken);
      }

      delete takeQueue[takeToken];

      if (
        Object.values(takeQueue).find(
          (chToken) => chToken === takeChannelToken
        ) === undefined
      ) {
        putQueue = putQueue.filter((q) => q.channelToken !== takeChannelToken);
      }

      forwardParam = putEvent.data;
      takeChannelToken = undefined;
    }

    if (isTakeMaybeEffect(result.value)) {
      takeChannelToken = result.value.effectData.channelToken;

      let putEvent = putQueue.find((q) => q.channelToken === takeChannelToken);
      putQueue = putQueue.filter((q) => q.channelToken !== takeChannelToken);

      // Ensure we return always on next frame
      controls = yield;

      if (putEvent) {
        forwardParam = putEvent.data;
      }

      takeChannelToken = undefined;
    }

    if (isPutEffect(result.value)) {
      const { channelToken, data } = result.value.effectData;

      putQueue = putQueue.filter((q) => q.channelToken !== channelToken);
      putQueue.push({ channelToken, data });
    }

    if (isJoinEffect(result.value)) {
      const { joinMode, tasks } = result.value.effectData;

      const isAllTasksDone = allR<Task>((task) => {
        if (joinMode === JoinMode.STOPPED) {
          return isStopped(task);
        } else {
          return isDone(task);
        }
      });

      while (!isAllTasksDone(tasks)) {
        controls = yield;
      }
    }

    if (isRaceEffect(result.value)) {
      let { raceMap, joinMode } = result.value.effectData;

      const keys = Object.keys(raceMap) as TRaceKeys[];

      const processes = keys
        .map((key) => raceMap[key])
        .map((saga) =>
          controls.addProcess(
            [...currentPriority, forkPriority++],
            processGenerator(saga) as Process<void>
          )
        );

      const tokens = processes.map((p) => p.token);
      const results: { [key in TRaceKeys]?: any } = {};

      while (true) {
        const statuses = tokens.map((token) =>
          joinMode === JoinMode.STOPPED
            ? { token, done: controls.isStopped({ token }) }
            : { token, done: controls.isDone({ token }) }
        );

        statuses.forEach((s, i) => {
          if (s.done && results[keys[i]] === undefined) {
            results[keys[i]] = controls.getReturn({ token: tokens[i] });
          }
        });

        if (any((r) => r.done, statuses)) {
          forwardParam = results;
          break;
        }

        controls = yield;
      }
    }

    if (isAllEffect(result.value)) {
      let { allMap, joinMode } = result.value.effectData;

      const keys = Object.keys(allMap) as TAllKeys[];

      const processes = keys
        .map((key) => allMap[key])
        .map((saga) =>
          controls.addProcess(
            [...currentPriority, forkPriority++],
            processGenerator(saga) as Process<void>
          )
        );

      const tokens = processes.map((p) => p.token);
      const results: { [key in TAllKeys]?: any } = {};

      while (true) {
        const statuses = tokens.map((token) =>
          joinMode === JoinMode.STOPPED
            ? { token, done: controls.isStopped({ token }) }
            : { token, done: controls.isDone({ token }) }
        );

        // Memo the result because it will be garbage collected after function is run
        statuses.forEach((s, i) => {
          if (s.done && results[keys[i]] === undefined) {
            results[keys[i]] = controls.getReturn({ token: tokens[i] });
          }
        });

        if (all((r) => r.done, statuses)) {
          forwardParam = results;
          break;
        }

        controls = yield;
      }
    }

    if (isWaitNextFrameEffect(result.value)) {
      channelMixStack = controls.getValues();
      controls = yield;
    }
  }
};
