import { groupBy, pipe, sort, flatten, reduce } from 'ramda';
import { v4 as uuidV4 } from 'uuid';

import { DMXData, dmxChannels } from './devices';
import {
  addUniverseCreatedCallback,
  Universe,
  addUniverseRemovedCallback,
  writeToUniverse,
  getDefaultUniverse,
} from './universes';
import {
  ChannelMap,
  ChannelMapWithDefault,
  MixMode,
  ChannelValue,
} from './channel-group-types';
import { sleep } from './utils';

type Token = string;

interface InternalPriority {
  major: number;
  minor: number;
}

export interface FrameControls {
  getValues(): ChannelMap;
  setValues(values: ChannelMapWithDefault): void;
  pushValues(values: ChannelMapWithDefault): void;
}

export type Process = Generator<void, void, FrameControls>;

interface OutputFunction {
  token: Token;
  process: Process;
  priority: InternalPriority;
}

let outputFunctions: OutputFunction[] = [];

export const getNextPriority = (): number => {
  const prio = Math.max(...outputFunctions.map((fn) => fn.priority.major));
  return isFinite(prio) ? prio + 1 : 0;
};

const getNextMinorPriority = (major: number): number => {
  const prio = Math.max(
    ...outputFunctions
      .filter((fn) => fn.priority.major === major)
      .map((fn) => fn.priority.minor)
  );
  return isFinite(prio) ? prio + 1 : 0;
};

export const addProcess = (priority: number, process: Process): Token => {
  const minorPriority = getNextMinorPriority(priority);
  const token = uuidV4();

  outputFunctions.push({
    priority: { major: priority, minor: minorPriority },
    process,
    token,
  });

  return token;
};

let processingUniverses: Universe[] = [];

export const startProcessUniverse = (universe: Universe) => {
  console.log('Universe added to process', universe);
  processingUniverses.push(universe);
};

addUniverseCreatedCallback(startProcessUniverse);

export const stopProcessUniverse = (universe: Universe) => {
  console.log('Universe processing stopped', universe);
  processingUniverses = processingUniverses.filter((u) => u.id !== universe.id);
};

addUniverseRemovedCallback(stopProcessUniverse);

const groupAndSortByPriorityMajor = pipe(
  groupBy((fn: OutputFunction) => fn.priority.major.toString()),
  Object.values,
  sort(
    (a: OutputFunction[], b: OutputFunction[]) =>
      a[0].priority.major - b[0].priority.major
  )
);

const processMixModes = (values: ChannelValue[]): ChannelValue | undefined => {
  const current = values[0];

  if (!current) {
    return undefined;
  }

  const next = values.slice(1);

  if (next.length <= 0) {
    return current;
  }

  if (current.mixMode === MixMode.GREATER_PRIORITY) {
    if (!current.weight || current.weight >= 1) {
      return current;
    }

    const nextp = processMixModes(next);

    const currentVal = current.weight * current.value;
    const nextVal = (1 - current.weight) * (nextp?.value || 0);

    const value = currentVal + nextVal;

    return { ...current, weight: undefined, value };
  }

  if (current.mixMode === MixMode.MAX) {
    return {
      ...current,
      value: Math.max(current.value, processMixModes(next)?.value || 0),
    };
  }

  if (current.mixMode === MixMode.MIN) {
    return {
      ...current,
      value: Math.min(current.value, processMixModes(next)?.value || 0),
    };
  }

  if (current.mixMode === MixMode.AVERAGE) {
    const nextResult = processMixModes(next);
    const currentWeight = current.weight || 1;

    const nextWeight = nextResult?.weight || 1;
    const nextVal = (nextResult?.value || 0) * nextWeight;
    const weight = nextWeight + currentWeight;

    const value = (nextVal + currentWeight * current.value) / weight;

    return { ...current, weight, value };
  }

  throw new Error('Invalid MixMode.');
};

const reduceFunctions = (acc: ChannelMap, fn: OutputFunction): ChannelMap => {
  // First, send current values
  // maybe the process don't care
  let newValues: ChannelMapWithDefault = [];

  const getValues = (): ChannelMap => acc;
  const setValues = (values: ChannelMapWithDefault): void => {
    newValues = values;
  };

  const pushValues = (values: ChannelMapWithDefault): void => {
    newValues.push(...values);
  };

  let processOutput = fn.process.next({
    getValues,
    setValues,
    pushValues,
  });

  if (processOutput.done) {
    outputFunctions = outputFunctions.filter((o) => o.token !== fn.token);
  }

  if (newValues === undefined || newValues.length <= 0) {
    return acc;
  }

  const unmixedValues = [...acc];

  newValues.forEach((out) => {
    const universe = out.output.universe || getDefaultUniverse();

    if (!universe) {
      return;
    }

    const { channel } = out.output;

    unmixedValues.push({
      ...out,
      output: { universe, channel },
    });
  });

  const result: ChannelMap = [];

  processingUniverses.forEach((universe) => {
    dmxChannels().forEach((channel) => {
      const chValuesUnmixed = unmixedValues
        .filter((v) => v.output.universe.id === universe.id)
        .filter((v) => v.output.channel === channel);

      const chValue = processMixModes(chValuesUnmixed);

      if (chValue) {
        result.push({ ...chValue, output: { universe, channel } });
      }
    });
  });

  return result;
};

const processUniverses = (): Promise<void> => {
  const fns = flatten(
    groupAndSortByPriorityMajor(outputFunctions).map((fns) =>
      fns.sort((a, b) => a.priority.minor - b.priority.minor)
    )
  );

  const channelMap: ChannelMap = reduce(reduceFunctions, [], fns);

  const pendingWrites: Promise<void>[] = [];

  processingUniverses.forEach((universe) => {
    const dataNumber: number[] = [];

    dmxChannels().forEach((chNumber) => {
      const val = channelMap
        .filter((m) => m.output.universe?.id === universe.id)
        .find((m) => m.output.channel === chNumber);

      const i = chNumber - 1;

      dataNumber[i] = Math.max(0, Math.min(255, Math.round(val?.value || 0)));
    });

    const data: DMXData = new Uint8Array(dataNumber);

    pendingWrites.push(writeToUniverse(universe, data));
  });

  return Promise.allSettled(pendingWrites).then(() => {});
};

let process = false;

export const startProcessing = async () => {
  let errorCount: number = 0;
  process = true;

  let lastRunDate = new Date();
  let frames = 0;

  while (process) {
    try {
      if (processingUniverses.length <= 0) {
        process = false;
        console.error('Engine error: No universes to process');
        throw new Error('No universes to process');
      }

      await processUniverses();

      errorCount = 0;
      frames += 1;

      if (frames > 100) {
        const current = new Date();
        const deltaSecs = (current.getTime() - lastRunDate.getTime()) / 1000;
        const fps = frames / deltaSecs;

        console.log('DMX FPS: ', Math.round(fps * 10) / 10);

        frames = 0;
        lastRunDate = current;
      }
    } catch (error) {
      errorCount += 1;

      if (errorCount > 50) {
        console.error('Too many errors when processing. Engine will sleep.');
        console.error(error);

        await sleep(10);
      }
    }
  }
};

export const stopProcessing = () => {
  process = false;
};
