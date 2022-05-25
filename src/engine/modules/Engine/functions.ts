import {
  ProcessStatus,
  ProcessCallback,
  Process,
  ProcessCallbackParams,
} from './core-types';
import { ChannelValue, MixMode } from './channel-group-types';
import { ChannelGroup } from './channel-group';

export interface TimedTransitionParams {
  status: ProcessStatus;
  startValue?(): number;
  endValue?: number;
  durationMs: number;
  initialTime?: number;
}

export const timedTransition = function* ({
  status,
  startValue = () => 0,
  endValue = 1,
  durationMs,
  initialTime,
}: TimedTransitionParams): Generator<number, number, void> {
  yield startValue();

  let elapsedTime: number = 0;
  let prevTime = initialTime || new Date().getTime();

  do {
    const deltaVal = endValue - startValue();
    const step = deltaVal / durationMs;

    let currentTime = new Date().getTime();

    if (status.paused) {
      prevTime = currentTime;
    }

    elapsedTime += currentTime - prevTime;
    prevTime = currentTime;

    if (elapsedTime >= durationMs) {
      break;
    }

    yield step * elapsedTime;
  } while (elapsedTime < durationMs);

  return endValue;
};

export interface FadeParams {
  channelGroup: ChannelGroup;
  durationMs: number;
  targetValue: ChannelValue;
  mixMode?: MixMode;
  gracefulInStop?: boolean;
  startWeight?: number;
}

export const fadeOut = function* (
  {
    channelGroup,
    durationMs,
    targetValue,
    mixMode = MixMode.GREATER_PRIORITY,
    startWeight = 1,
  }: FadeParams,
  { status }: ProcessCallbackParams
): Process {
  let weight = 0;

  const decresingValue = timedTransition({
    status,
    startValue: () => startWeight,
    endValue: 0,
    durationMs,
  });

  while (true) {
    const controls = yield;

    const decresingValueResult = decresingValue.next();
    weight = decresingValueResult.value;

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

export const fadeIn = function* (
  {
    channelGroup,
    durationMs,
    targetValue,
    mixMode = MixMode.GREATER_PRIORITY,
    gracefulInStop = true,
    startWeight = 0,
  }: FadeParams,
  { status, ...cbParams }: ProcessCallbackParams
): Process {
  let weight = 0;
  const initialTime = new Date().getTime();
  const incresingValue = timedTransition({
    status,
    durationMs,
    initialTime,
    startValue: () => startWeight,
  });

  while (!status.stopped) {
    const controls = yield;

    const incresingValueResult = incresingValue.next();
    weight = incresingValueResult.value;

    controls.pushValues(
      channelGroup.getChannelsMixWithValue({ ...targetValue, mixMode, weight })
    );

    if (incresingValueResult.done) {
      break;
    }
  }

  if (status.stopped && gracefulInStop) {
    const durationMsOut = new Date().getTime() - initialTime;
    yield* fadeOut(
      {
        channelGroup,
        durationMs: durationMsOut,
        targetValue,
        mixMode,
        startWeight: weight,
      },
      { status, ...cbParams }
    );
  }
};

export interface KeepValueParams {
  channelGroup: ChannelGroup;
  targetValue: ChannelValue;
  durationMs?: number | undefined;
  mixMode?: MixMode;
  weight?: number | undefined;
}

export const keepValue = function* (
  {
    channelGroup,
    targetValue,
    mixMode = MixMode.GREATER_PRIORITY,
    weight,
    durationMs,
  }: KeepValueParams,
  { status }: ProcessCallbackParams
): Process {
  const startAt = new Date().getTime();

  while (!status.stopped) {
    const controls = yield;
    controls.pushValues(
      channelGroup.getChannelsMixWithValue({ ...targetValue, mixMode, weight })
    );

    const currentTime = new Date().getTime();

    if (durationMs && currentTime - startAt > durationMs) {
      break;
    }
  }
};

export const fadeInWithOutByWeight = ({
  channelGroup,
  durationMs,
  targetValue,
  mixMode = MixMode.GREATER_PRIORITY,
}: FadeParams): ProcessCallback =>
  function* (params): Process {
    yield* fadeIn({ channelGroup, durationMs, targetValue, mixMode }, params);
    yield* keepValue({ channelGroup, targetValue, mixMode }, params);
    yield* fadeOut({ channelGroup, targetValue, mixMode, durationMs }, params);
  };
