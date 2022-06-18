import { ChannelValue, MixMode } from './channel-group-types';
import { ChannelGroup } from './channel-group';
import {
  ProcessSaga,
  isPaused,
  pushValues,
  waitNextFrame,
  isStopped,
} from './frame-generator';

export interface TimedTransitionParams {
  startValue?(): number;
  endValue?: number;
  durationMs: number;
  initialTime?: number;
}

export interface TimedTransitionInputParams {
  isPaused: boolean;
}

export const timedTransition = function* ({
  startValue = () => 0,
  endValue = 1,
  durationMs,
  initialTime,
}: TimedTransitionParams): Generator<
  number,
  number,
  TimedTransitionInputParams
> {
  let output: TimedTransitionInputParams;

  output = yield startValue();

  let elapsedTime: number = 0;
  let remainingTime = durationMs;
  let prevTime = initialTime || new Date().getTime();

  do {
    const deltaVal = endValue - startValue();
    const step = deltaVal / durationMs;

    let currentTime = new Date().getTime();

    if (output.isPaused) {
      prevTime = currentTime;
    }

    elapsedTime += currentTime - prevTime;
    remainingTime -= currentTime - prevTime;

    prevTime = currentTime;

    if (elapsedTime >= durationMs) {
      output = yield endValue;
      break;
    }

    if (step >= 0) {
      output = yield step * elapsedTime;
    } else {
      output = yield Math.abs(step) * remainingTime;
    }
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

export const fadeOut = function* ({
  channelGroup,
  durationMs,
  targetValue,
  mixMode = MixMode.GREATER_PRIORITY,
  startWeight = 1,
}: FadeParams): ProcessSaga {
  const decresingValue = timedTransition({
    startValue: () => startWeight,
    endValue: 0,
    durationMs,
  });

  while (true) {
    let weight: number = 0;

    const paused = yield isPaused();

    const decresingValueResult = decresingValue.next({
      isPaused: paused,
    });

    weight = decresingValueResult.value;

    yield pushValues(
      channelGroup.getChannelsMixWithValue({
        ...targetValue,
        mixMode,
        weight,
      })
    );

    yield waitNextFrame();

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
}: FadeParams): ProcessSaga {
  let weight = 0;
  let stoppedVal = yield isStopped();

  const initialTime = new Date().getTime();
  const incresingValue = timedTransition({
    durationMs,
    initialTime,
    startValue: () => startWeight,
  });

  while (!stoppedVal) {
    const pausedVal = yield isPaused();

    const incresingValueResult = incresingValue.next({
      isPaused: pausedVal,
    });

    weight = incresingValueResult.value;

    yield pushValues(
      channelGroup.getChannelsMixWithValue({ ...targetValue, mixMode, weight })
    );

    yield waitNextFrame();

    if (incresingValueResult.done) {
      break;
    }

    stoppedVal = yield isStopped();
  }

  if (stoppedVal && gracefulInStop) {
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
}: KeepValueParams): ProcessSaga {
  const startAt = new Date().getTime();

  const stoppedVal = yield isStopped();

  if (stoppedVal) {
    console.log('Stopped');
    return;
  }

  while (true) {
    yield pushValues(
      channelGroup.getChannelsMixWithValue({ ...targetValue, mixMode, weight })
    );

    const currentTime = new Date().getTime();

    yield waitNextFrame();

    if (yield isStopped()) {
      break;
    }

    if (durationMs && currentTime - startAt > durationMs) {
      break;
    }
  }
};

export const fadeInWithOutByWeight = function* ({
  channelGroup,
  durationMs,
  targetValue,
  mixMode = MixMode.GREATER_PRIORITY,
}: FadeParams): ProcessSaga {
  yield* fadeIn({ channelGroup, durationMs, targetValue, mixMode });
  yield* keepValue({ channelGroup, targetValue, mixMode });
  yield* fadeOut({ channelGroup, targetValue, mixMode, durationMs });
};
