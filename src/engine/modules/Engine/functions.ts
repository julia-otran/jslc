import {
  ValueProvider,
  Task,
  ChannelValue,
  MixMode,
} from '../../../engine-types';
import { ChannelGroup } from './channel-group';
import {
  ProcessSaga,
  isPaused,
  pushValues,
  waitNextFrame,
  isStopped,
  fork,
  cancel,
} from './frame-generator';

export interface TimedTransitionParams {
  startValue?: ValueProvider;
  endValue?: ValueProvider;
  durationMs: ValueProvider;
  initialTime?: number;
}

export interface TimedTransitionInputParams {
  isPaused: boolean;
}

export const timedTransition = function* ({
  startValue = () => 0,
  endValue = () => 1,
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
  let prevTime = initialTime || new Date().getTime();

  do {
    const deltaVal = endValue() - startValue();
    const step = deltaVal / durationMs();

    let currentTime = new Date().getTime();

    if (output.isPaused) {
      prevTime = currentTime;
    }

    elapsedTime += currentTime - prevTime;

    prevTime = currentTime;

    if (elapsedTime >= durationMs()) {
      output = yield endValue();
      break;
    }

    if (step >= 0) {
      output = yield step * elapsedTime;
    } else {
      output = yield Math.abs(step) * (durationMs() - elapsedTime);
    }
  } while (elapsedTime < durationMs());

  return endValue();
};

export interface FadeParams {
  weightCb(w: number): void;
  durationMs: ValueProvider;
  gracefulInStop?: boolean;
  startWeight?: number;
  initialTime?: number;
}

export const fadeOut = function* ({
  weightCb,
  durationMs,
  startWeight = 1,
  initialTime,
}: FadeParams): ProcessSaga {
  const decresingValue = timedTransition({
    startValue: () => startWeight,
    endValue: () => 0,
    durationMs,
    initialTime,
  });

  while (true) {
    const paused = yield isPaused();

    const decresingValueResult = decresingValue.next({
      isPaused: paused,
    });

    weightCb(decresingValueResult.value);

    yield waitNextFrame();

    if (decresingValueResult.done) {
      break;
    }
  }
};

export const fadeIn = function* ({
  weightCb,
  durationMs,
  gracefulInStop = true,
  startWeight = 0,
  initialTime,
}: FadeParams): ProcessSaga {
  let weight = 0;
  let stoppedVal = yield isStopped();

  const initialTimeVal = initialTime || new Date().getTime();
  const incresingValue = timedTransition({
    durationMs,
    initialTime: initialTimeVal,
    startValue: () => startWeight,
  });

  while (!stoppedVal) {
    const pausedVal = yield isPaused();

    const incresingValueResult = incresingValue.next({
      isPaused: pausedVal,
    });

    weight = incresingValueResult.value;

    weightCb(weight);

    yield waitNextFrame();

    if (incresingValueResult.done) {
      break;
    }

    stoppedVal = yield isStopped();
  }

  if (stoppedVal && gracefulInStop) {
    const durationMsOut = new Date().getTime() - initialTimeVal;
    yield* fadeOut({
      weightCb,
      durationMs: () => durationMsOut,
      startWeight: weight,
    });
  }
};

export interface HangParams {
  durationMs?: ValueProvider | undefined;
}

export const hang = function* ({ durationMs }: HangParams): ProcessSaga {
  const startAt = new Date().getTime();

  const stoppedVal = yield isStopped();

  if (stoppedVal) {
    return;
  }

  while (true) {
    const currentTime = new Date().getTime();

    yield waitNextFrame();

    if (yield isStopped()) {
      break;
    }

    if (durationMs && currentTime - startAt > durationMs()) {
      break;
    }
  }
};

export interface KeepValueParams {
  channelGroup: ChannelGroup;
  targetValue: ChannelValue;
  durationMs?: ValueProvider | undefined;
  mixMode?: MixMode;
  weightProvider?: ValueProvider;
  unstopable?: boolean | undefined;
}

export const keepValue = function* ({
  channelGroup,
  targetValue,
  mixMode = MixMode.GREATER_PRIORITY,
  weightProvider,
  durationMs,
  unstopable,
}: KeepValueParams): ProcessSaga {
  const startAt = new Date().getTime();

  const stoppedVal = yield isStopped();

  if (!unstopable && stoppedVal) {
    return;
  }

  while (true) {
    const weight = weightProvider?.() ?? undefined;

    yield pushValues(
      channelGroup.getChannelsMixWithValue({ ...targetValue, mixMode, weight })
    );

    const currentTime = new Date().getTime();

    yield waitNextFrame();

    if (!unstopable && (yield isStopped())) {
      break;
    }

    if (durationMs && currentTime - startAt > durationMs()) {
      break;
    }
  }
};

export interface FadeInWithOutByWeightParams {
  channelGroup: ChannelGroup;
  targetValue: ChannelValue;
  durationMs: ValueProvider;
  mixMode?: MixMode;
  weightProvider?: ValueProvider;
}

export const fadeInWithOutByWeight = function* ({
  channelGroup,
  durationMs,
  targetValue,
  mixMode = MixMode.GREATER_PRIORITY,
  weightProvider,
}: FadeInWithOutByWeightParams): ProcessSaga {
  let internalWeight = 0;

  let weightCb = (w: number) => {
    internalWeight = w;
  };

  let weightProviderInt = (): number =>
    internalWeight * (weightProvider?.() ?? 1);

  const keepValuesTask: Task = yield fork(
    keepValue({
      unstopable: true,
      channelGroup,
      targetValue,
      mixMode,
      weightProvider: weightProviderInt,
    })
  );

  yield* fadeIn({ weightCb, durationMs });

  yield* hang({});

  yield* fadeOut({ weightCb, durationMs });

  yield cancel(keepValuesTask);
};
