import {
  ProcessStatus,
  ProcessCallback,
  Process,
  ProcessCallbackParams,
} from './core-types';
import { ChannelValue, MixMode } from './channel-group-types';
import { ChannelGroup } from './channel-group';

export interface TimedTransitionParams {
  startValue?(): number;
  endValue?: number;
  durationMs: number;
  initialTime?: number;
}

export interface TimedTransitionInputParams {
  params: ProcessCallbackParams;
  returnValue(val: number): void;
}

export const timedTransition = function* ({
  startValue = () => 0,
  endValue = 1,
  durationMs,
  initialTime,
}: TimedTransitionParams): Generator<void, void, TimedTransitionInputParams> {
  let output: TimedTransitionInputParams = yield;

  output.returnValue(startValue());

  let elapsedTime: number = 0;
  let remainingTime = durationMs;
  let prevTime = initialTime || new Date().getTime();

  do {
    output = yield;

    const deltaVal = endValue - startValue();
    const step = deltaVal / durationMs;

    let currentTime = new Date().getTime();

    if (output.params.status.paused) {
      prevTime = currentTime;
    }

    elapsedTime += currentTime - prevTime;
    remainingTime -= currentTime - prevTime;

    prevTime = currentTime;

    if (elapsedTime >= durationMs) {
      output.returnValue(endValue);
      break;
    }

    if (step >= 0) {
      output.returnValue(step * elapsedTime);
    } else {
      output.returnValue(Math.abs(step) * remainingTime);
    }
  } while (elapsedTime < durationMs);
};

export interface FadeParams {
  channelGroup: ChannelGroup;
  durationMs: number;
  targetValue: ChannelValue;
  mixMode?: MixMode;
  gracefulInStop?: boolean;
  startWeight?: number;
}

export const fadeOut = function* ({
  channelGroup,
  durationMs,
  targetValue,
  mixMode = MixMode.GREATER_PRIORITY,
  startWeight = 1,
}: FadeParams): Process {
  const decresingValue = timedTransition({
    startValue: () => startWeight,
    endValue: 0,
    durationMs,
  });

  decresingValue.next();

  while (true) {
    const controls = yield;
    let weight: number = 0;

    const setWeight = (w: number) => (weight = w);

    const decresingValueResult = decresingValue.next({
      params: controls.params,
      returnValue: setWeight,
    });

    controls.pushValues(
      channelGroup.getChannelsMixWithValue({
        ...targetValue,
        mixMode,
        weight,
      })
    );

    if (decresingValueResult.done) {
      break;
    }
  }
};

export const fadeIn = function* ({
  channelGroup,
  durationMs,
  targetValue,
  mixMode = MixMode.GREATER_PRIORITY,
  gracefulInStop = true,
  startWeight = 0,
}: FadeParams): Process {
  let weight = 0;
  const initialTime = new Date().getTime();
  const incresingValue = timedTransition({
    durationMs,
    initialTime,
    startValue: () => startWeight,
  });

  incresingValue.next();

  let controls = yield;

  while (!controls.params.status.stopped) {
    let weight = 0;

    const setWeight = (w: number) => (weight = w);

    const incresingValueResult = incresingValue.next({
      params: controls.params,
      returnValue: setWeight,
    });

    controls.pushValues(
      channelGroup.getChannelsMixWithValue({ ...targetValue, mixMode, weight })
    );

    if (incresingValueResult.done) {
      break;
    }

    controls = yield;
  }

  if (controls.params.status.stopped && gracefulInStop) {
    const durationMsOut = new Date().getTime() - initialTime;
    yield* fadeOut({
      channelGroup,
      durationMs: durationMsOut,
      targetValue,
      mixMode,
      startWeight: weight,
    });
  }
};

export interface KeepValueParams {
  channelGroup: ChannelGroup;
  targetValue: ChannelValue;
  durationMs?: number | undefined;
  mixMode?: MixMode;
  weight?: number | undefined;
}

export const keepValue = function* ({
  channelGroup,
  targetValue,
  mixMode = MixMode.GREATER_PRIORITY,
  weight,
  durationMs,
}: KeepValueParams): Process {
  const startAt = new Date().getTime();
  let stopped = false;

  while (!stopped) {
    const controls = yield;

    controls.pushValues(
      channelGroup.getChannelsMixWithValue({ ...targetValue, mixMode, weight })
    );

    const currentTime = new Date().getTime();

    if (durationMs && currentTime - startAt > durationMs) {
      break;
    }

    stopped = controls.params.status.stopped;
  }
};

export const fadeInWithOutByWeight = ({
  channelGroup,
  durationMs,
  targetValue,
  mixMode = MixMode.GREATER_PRIORITY,
}: FadeParams): ProcessCallback =>
  function* (): Process {
    yield* fadeIn({ channelGroup, durationMs, targetValue, mixMode });
    yield* keepValue({ channelGroup, targetValue, mixMode });
    yield* fadeOut({ channelGroup, targetValue, mixMode, durationMs });
  };
