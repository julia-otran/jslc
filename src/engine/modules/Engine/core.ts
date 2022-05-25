import { groupBy, pipe, sort, flatten, reduce } from 'ramda';
import { v4 as uuidV4 } from 'uuid';

import { DMXData, DMXValue, dmxChannels } from './devices';
import {
  addUniverseCreatedCallback,
  Universe,
  addUniverseRemovedCallback,
  writeToUniverse,
  getDefaultUniverse,
} from './universes';
import {
  ChannelMap,
  ChannelMixMapWithDefault,
  MixMode,
  ChannelValue,
  ChannelMix,
  ChannelMixWithDefault,
  ChannelValueMixed,
  ChannelValueMix,
  ChannelMixMap,
  ChannelMixedMap,
  ChannelOutput,
} from './channel-group-types';
import { Token, Process, ProcessStatus, ProcessCallback } from './core-types';
import { sleep, channelValueToValue, valueToChannelValue } from './utils';
import { getChannelMSB, getChannelLSB } from './channel-lsb';

interface InternalPriority {
  major: number;
  minor: number;
}

interface OutputFunction {
  token: Token;
  process: Process;
  status: ProcessStatus;
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

export const addProcess = (
  priority: number,
  processCb: ProcessCallback
): Token => {
  const minorPriority = getNextMinorPriority(priority);
  const token = uuidV4();
  const status = { stopped: false, paused: false };

  outputFunctions.push({
    status,
    priority: { major: priority, minor: minorPriority },
    process: processCb({ status, token }),
    token,
  });

  return token;
};

export const pauseProcess = (token: Token): void => {
  const fn = outputFunctions.find((fn) => fn.token === token);

  if (fn) {
    fn.status.paused = true;
  }
};

export const resumeProcess = (token: Token): void => {
  const fn = outputFunctions.find((fn) => fn.token === token);

  if (fn) {
    fn.status.paused = false;
  }
};

export const stopProcess = (token: Token): void => {
  const fn = outputFunctions.find((fn) => fn.token === token);

  if (fn) {
    fn.status.stopped = true;
  }
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

const valueWeightCalc = (
  current: number,
  previous: number,
  currentWeight: number | undefined
): number => {
  const weight = currentWeight === undefined ? 1 : currentWeight;
  return current * weight + previous * (1 - weight);
};

const channelValueOp = (
  current: ChannelValueMixed,
  previous: ChannelValueMixed | undefined,
  op: (a: number, b: number) => number
): ChannelValue => {
  const currentVal = channelValueToValue(current);
  const previousVal = channelValueToValue(previous);
  const currentWeight = current.weight;

  return valueToChannelValue(
    valueWeightCalc(op(currentVal, previousVal), previousVal, currentWeight)
  );
};

const mixChannelValues = <
  TMixed extends ChannelValueMixed,
  TCurrent extends TMixed & ChannelValueMix
>(
  previous: TMixed | undefined,
  current: TCurrent | undefined
): TMixed | undefined => {
  if (!current) {
    return previous;
  }

  const currentValue = channelValueToValue(current);
  const currentWeight = current.weight === undefined ? 1 : current.weight;

  if (current.mixMode === MixMode.GREATER_PRIORITY) {
    const value = valueWeightCalc(
      currentValue,
      channelValueToValue(previous),
      currentWeight
    );

    return { ...current, ...valueToChannelValue(value), weight: undefined };
  }

  if (current.mixMode === MixMode.MAX) {
    return {
      ...current,
      ...channelValueOp(current, previous, Math.max),
      weight: undefined,
    };
  }

  if (current.mixMode === MixMode.MIN) {
    return {
      ...current,
      ...channelValueOp(current, previous, Math.min),
      weight: undefined,
    };
  }

  if (current.mixMode === MixMode.AVERAGE) {
    const prevWeight = previous?.weight === undefined ? 1 : previous.weight;

    const prevVal = channelValueToValue(previous) * prevWeight;
    const weight = prevWeight + currentWeight;

    const value = (prevVal + currentWeight * currentValue) / weight;

    return { ...current, ...valueToChannelValue(value), weight };
  }

  throw new Error('Invalid MixMode.');
};

const fillUniverse = (
  withDefault: ChannelMixWithDefault
): ChannelMix | undefined => {
  const universe = withDefault.output.universe || getDefaultUniverse();

  if (!universe) {
    return undefined;
  }

  const { channelMSB } = withDefault.output;

  return {
    ...withDefault,
    output: { universe, channelMSB },
  };
};

const groupByOutput = <T extends ChannelOutput>(entities: T[]): T[][] =>
  Object.values(
    groupBy<T>(
      ({ output }) => `${output.universe.id}-${output.channelMSB}`,
      entities
    )
  );

const fixChInput = (
  mixMapWithDefault: ChannelMixMapWithDefault
): ChannelMixMap => {
  const mixMap = mixMapWithDefault
    .map(fillUniverse)
    .filter(Boolean) as ChannelMixMap;
  const msbInputs = mixMap.filter(
    (chMix) =>
      getChannelMSB({
        universe: chMix.output.universe,
        channelLSB: chMix.output.channelMSB,
      }) === undefined
  );

  if (msbInputs.length !== mixMap.length) {
    console.error(
      'An LSB Channel was outputed as MSB Channel. The engine will ignore this value. Please, set the valueLSB and valueMSB in a MSB channel.'
    );
  }

  return msbInputs;
};

const reduceFunctions = (
  acc: ChannelMixedMap,
  fn: OutputFunction
): ChannelMixedMap => {
  // First, send current values
  // maybe the process don't care
  let newValues: ChannelMixMap = [];

  const getStackMixedChannels = (): ChannelMixedMap => acc;
  const getValues = (): ChannelMixMap => newValues;
  const setValues = (values: ChannelMixMapWithDefault): void => {
    newValues = fixChInput(values);
  };

  const pushValues = (values: ChannelMixMapWithDefault): void => {
    newValues.push(...fixChInput(values));
  };

  let processOutput = fn.process.next({
    getStackMixedChannels,
    getValues,
    setValues,
    pushValues,
    status: fn.status,
  });

  if (processOutput.done) {
    outputFunctions = outputFunctions.filter((o) => o.token !== fn.token);
  }

  if (newValues === undefined || newValues.length <= 0) {
    return acc;
  }

  return groupByOutput(newValues.filter(Boolean) as ChannelMixMap)
    .map((mixMap) => {
      const initialMixed = acc
        .filter(
          ({ output }) => (output.universe.id = mixMap[0].output.universe.id)
        )
        .find(
          ({ output }) => output.channelMSB === mixMap[0].output.channelMSB
        );

      return reduce(mixChannelValues, initialMixed, mixMap);
    })
    .filter(Boolean) as ChannelMixedMap;
};

const sanitizeValue = (data: number | undefined): DMXValue =>
  Math.max(0, Math.min(255, Math.round(data || 0)));

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
        .find((m) => m.output.channelMSB === chNumber);

      const lsbCh = getChannelLSB({ universe, channelMSB: chNumber });

      const i = chNumber - 1;
      const ilsb = lsbCh ? lsbCh - 1 : undefined;

      dataNumber[i] = sanitizeValue(val?.valueMSB);

      if (ilsb) {
        dataNumber[ilsb] = sanitizeValue(val?.valueLSB);
      }
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
