export const sleep = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

export interface TimedIncrementParams {
  startValue(): number;
  endValue: number;
  durationMs: number;
  initialTime?: number;
}

export const timedIncrement = function* ({
  startValue,
  endValue,
  durationMs,
  initialTime,
}: TimedIncrementParams): Generator<number, number, void> {
  const initTime = initialTime || new Date().getTime();

  yield startValue();

  let elapsedTime: number = 0;

  do {
    const deltaVal = endValue - startValue();
    const step = deltaVal / durationMs;

    let currentTime = new Date().getTime();
    elapsedTime = currentTime - initTime;

    if (elapsedTime >= durationMs) {
      break;
    }

    yield step * elapsedTime;
  } while (elapsedTime < durationMs);

  return endValue;
};
