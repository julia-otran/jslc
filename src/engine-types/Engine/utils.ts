export const MIN_BPM = 35;
export const MAX_MS_PER_BEAT = (1 / MIN_BPM) * 60 * 1000;

export const msToBpm = (ms: number) => 1 / (ms / (60 * 1000));
export const bpmToMs = (bpm: number) => (1 / bpm) * 60 * 1000;

const getBPM = (times: number[]): number => {
  if (times.length <= 1) {
    return 0;
  }

  let bpmSum = 0;
  let lastBpm;

  for (let i = 0; i < times.length - 1; i += 1) {
    const bpm = msToBpm(times[i + 1] - times[i]);
    lastBpm = bpm;
    // const roundedBPM = Math.round(bpm * 2) / 2;
    bpmSum += bpm;
  }

  console.log({ lastBpm });

  const bpmAverage = bpmSum / (times.length - 1);
  const roundedBPM = Math.round(bpmAverage * 2) / 2;

  return bpmToMs(roundedBPM);
};

export interface CreateBPMTapperReturn {
  onTap(time?: number): number | undefined;
}

export const createBPMTapper = (): CreateBPMTapperReturn => {
  let lastTaps: number[] = [];

  return {
    onTap(time): number | undefined {
      const now = time !== undefined ? time : new Date().getTime();

      console.log({ tapTime: now });

      if (lastTaps.length === 0) {
        lastTaps.push(now);
      } else if (now - lastTaps[lastTaps.length - 1] <= MAX_MS_PER_BEAT) {
        lastTaps.push(now);

        if (lastTaps.length > 8) {
          const [_, ...pluck] = lastTaps;
          lastTaps = pluck;
        }

        return getBPM(lastTaps);
      } else {
        lastTaps = [now];
      }

      return undefined;
    },
  };
};
